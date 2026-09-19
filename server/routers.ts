import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createHomework, createLocalUser, getDashboardSummary, getLessonById, getTeacherDashboard, getUserByEmail, getUserByOpenId, gradeHomework, listCourses, listLessons, listStudentHomework, listTeacherHomework, listUsersForAdmin, localOpenId, normalizePali, saveProgress, searchDictionary, setLocalPassword, updateLessonMedia, updateUserRole, upsertUser } from "./db";
import { storagePut } from "./storage";
import { hashPassword, verifyPassword } from "./password";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";

const teacherProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "teacher" && ctx.user.role !== "admin" && ctx.user.role !== "owner") throw new TRPCError({ code: "FORBIDDEN", message: "เฉพาะพระอาจารย์หรือผู้ดูแลระบบ" });
  return next({ ctx });
});

const publicUser = <T extends { passwordHash?: string | null }>(user: T): Omit<T, "passwordHash"> => {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
};

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user ? publicUser(opts.ctx.user) : null),
    register: publicProcedure.input(z.object({ name: z.string().min(2).max(100), email: z.string().email().max(320), password: z.string().min(8).max(128) })).mutation(async ({ ctx, input }) => {
      const email = input.email.trim().toLowerCase();
      const passwordHash = await hashPassword(input.password);
      const existing = await getUserByEmail(email);
      if (existing?.passwordHash) throw new TRPCError({ code: "CONFLICT", message: "อีเมลนี้มีบัญชีอยู่แล้ว" });
      const id = existing ? existing.id : await createLocalUser({ name: input.name, email, passwordHash });
      if (existing) await setLocalPassword(email, passwordHash, input.name);
      const user = existing ? await getUserByOpenId(existing.openId) : await getUserByOpenId(localOpenId(email));
      if (!id || !user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "สร้างบัญชีไม่สำเร็จ" });
      const token = await sdk.signSession({ openId: user.openId, appId: ENV.appId, name: user.name || input.name });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return publicUser(user);
    }),
    login: publicProcedure.input(z.object({ email: z.string().email().max(320), password: z.string().min(8).max(128) })).mutation(async ({ ctx, input }) => {
      const user = await getUserByEmail(input.email.trim().toLowerCase());
      if (!user?.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) throw new TRPCError({ code: "UNAUTHORIZED", message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
      const token = await sdk.signSession({ openId: user.openId, appId: ENV.appId, name: user.name || input.email });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return publicUser(user);
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  profile: router({
    update: protectedProcedure.input(z.object({ name: z.string().min(2).max(100), monasteryName: z.string().max(160).optional() })).mutation(async ({ ctx, input }) => {
      await upsertUser({ openId: ctx.user.openId, name: input.name, monasteryName: input.monasteryName ?? null });
      return { success: true };
    }),
  }),
  courses: router({
    list: publicProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) => listCourses(input?.search)),
    lessons: publicProcedure.input(z.object({ courseId: z.number().optional() })).query(({ input }) => listLessons(input.courseId)),
    lesson: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => getLessonById(input.id)),
    updateMedia: teacherProcedure.input(z.object({ id: z.number(), videoUrl: z.string().url().optional().or(z.literal("")), pdfUrl: z.string().url().optional().or(z.literal("")) })).mutation(async ({ input }) => {
      await updateLessonMedia(input.id, input.videoUrl, input.pdfUrl);
      return { success: true };
    }),
  }),
  progress: router({
    save: protectedProcedure.input(z.object({ lessonId: z.number(), progressPercent: z.number().min(0).max(100), minutesWatched: z.number().min(0).max(1000) })).mutation(async ({ ctx, input }) => {
      await saveProgress(ctx.user.id, input.lessonId, input.progressPercent, input.minutesWatched);
      return { success: true };
    }),
  }),
  homework: router({
    mine: protectedProcedure.query(({ ctx }) => listStudentHomework(ctx.user.id)),
    forTeacher: teacherProcedure.query(() => listTeacherHomework()),
    submit: protectedProcedure.input(z.object({ lessonId: z.number(), fileName: z.string().min(1).max(200), contentType: z.string().startsWith("image/"), dataUrl: z.string().max(8_000_000), note: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
      const match = input.dataUrl.match(/^data:[^;]+;base64,(.+)$/);
      if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "ไฟล์รูปไม่ถูกต้อง" });
      const buffer = Buffer.from(match[1], "base64");
      if (buffer.length > 5_000_000) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "ไฟล์ต้องมีขนาดไม่เกิน 5 MB" });
      const uploaded = await storagePut(`homework/${ctx.user.id}/${input.fileName}`, buffer, input.contentType);
      const id = await createHomework({ lessonId: input.lessonId, studentId: ctx.user.id, submissionImageUrl: uploaded.url, submissionFileKey: uploaded.key, note: input.note });
      return { id, url: uploaded.url };
    }),
    grade: teacherProcedure.input(z.object({ id: z.number(), status: z.enum(["graded", "revision"]), score: z.number().min(0).max(10).optional(), feedback: z.string().max(2000).optional() })).mutation(async ({ input }) => {
      await gradeHomework(input.id, input);
      return { success: true };
    }),
  }),
  dictionary: router({
    search: publicProcedure.input(z.object({ query: z.string().max(100) })).query(({ input }) => searchDictionary(normalizePali(input.query))),
  }),
  dashboard: router({
    summary: protectedProcedure.query(({ ctx }) => getDashboardSummary(ctx.user.id, ctx.user.role)),
    teacher: teacherProcedure.query(() => getTeacherDashboard()),
  }),
  admin: router({
    users: adminProcedure.query(() => listUsersForAdmin()),
    createTeacher: adminProcedure.input(z.object({ name: z.string().min(2).max(100), email: z.string().email().max(320), password: z.string().min(8).max(128) })).mutation(async ({ input }) => {
      const email = input.email.trim().toLowerCase();
      if (await getUserByEmail(email)) throw new TRPCError({ code: "CONFLICT", message: "อีเมลนี้มีบัญชีอยู่แล้ว" });
      const id = await createLocalUser({ name: input.name, email, passwordHash: await hashPassword(input.password), role: "teacher" });
      if (!id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "สร้างบัญชีครูไม่สำเร็จ" });
      return { success: true, id };
    }),
    setRole: adminProcedure.input(z.object({ userId: z.number(), role: z.enum(["user", "teacher", "admin", "owner"]) })).mutation(async ({ input }) => {
      await updateUserRole(input.userId, input.role);
      return { success: true };
    }),
    promoteTeacher: adminProcedure.input(z.object({ userId: z.number() })).mutation(async ({ input }) => {
      await updateUserRole(input.userId, "teacher");
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;

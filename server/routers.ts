import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { consumePasswordResetToken, createCourse, createHomework, createLesson, createLocalUser, createPasswordResetToken, createVerificationCode, deleteLesson, getDashboardSummary, getLessonById, getStudentRoster, getTeacherDashboard, getUserByEmail, getUserByIdentifier, getUserByOpenId, gradeHomework, issueCertificate, listCertificates, listCourses, listDictionaryFavorites, listLessonQuizzes, listLessons, listLoginDevices, listNotifications, listStudentHomework, listTeacherHomework, listUsersForAdmin, localOpenId, markNotificationRead, normalizePali, normalizePhone, notifyUser, registerLoginDevice, reviewVocabulary, saveProgress, searchDictionary, setLocalContactPassword, setLocalPassword, submitQuiz, toggleDictionaryFavorite, updateCourse, updateLesson, updateUserPassword, updateUserProfile, updateLessonMedia, updateUserRole, upsertUser, verifyCode, getVocabularyStats } from "./db";
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
    register: publicProcedure.input(z.object({ name: z.string().min(2).max(100), email: z.string().email().max(320).optional(), phone: z.string().regex(/^(\+?66|0)[0-9]{8,10}$/).optional(), password: z.string().min(8).max(128), remember: z.boolean().default(true) }).refine(input => Boolean(input.email || input.phone), { message: "กรุณากรอกอีเมลหรือเบอร์โทรศัพท์" })).mutation(async ({ ctx, input }) => {
      const identifier = input.email?.trim().toLowerCase() || normalizePhone(input.phone || "");
      const passwordHash = await hashPassword(input.password);
      const existing = await getUserByIdentifier(identifier);
      if (existing?.passwordHash) throw new TRPCError({ code: "CONFLICT", message: "อีเมลหรือเบอร์นี้มีบัญชีอยู่แล้ว" });
      const id = existing ? existing.id : await createLocalUser({ name: input.name, email: input.email, phone: input.phone, passwordHash });
      if (existing) await setLocalContactPassword(identifier, passwordHash, input.name);
      const user = existing ? await getUserByOpenId(existing.openId) : await getUserByOpenId(localOpenId(identifier));
      if (!id || !user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "สร้างบัญชีไม่สำเร็จ" });
      const token = await sdk.signSession({ openId: user.openId, appId: ENV.appId, name: user.name || input.name });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), ...(input.remember ? { maxAge: ONE_YEAR_MS } : {}) });
      return publicUser(user);
    }),
    login: publicProcedure.input(z.object({ identifier: z.string().min(3).max(320), password: z.string().min(8).max(128), remember: z.boolean().default(true) })).mutation(async ({ ctx, input }) => {
      const user = await getUserByIdentifier(input.identifier);
      if (!user?.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) throw new TRPCError({ code: "UNAUTHORIZED", message: "อีเมลหรือเบอร์โทรศัพท์ หรือรหัสผ่านไม่ถูกต้อง" });
      const token = await sdk.signSession({ openId: user.openId, appId: ENV.appId, name: user.name || input.identifier });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), ...(input.remember ? { maxAge: ONE_YEAR_MS } : {}) });
      await registerLoginDevice(user.id, "เว็บเบราว์เซอร์", ctx.req.headers["user-agent"]);
      return publicUser(user);
    }),
    requestVerification: protectedProcedure.input(z.object({ channel: z.enum(["email", "phone"]) })).mutation(async ({ ctx, input }) => {
      const target = input.channel === "email" ? ctx.user.email : ctx.user.phone;
      if (!target) throw new TRPCError({ code: "BAD_REQUEST", message: "ยังไม่มีข้อมูลสำหรับยืนยัน" });
      await createVerificationCode(ctx.user.id, input.channel, target);
      return { success: true, message: "ส่งรหัสยืนยันแล้ว กรุณาตรวจสอบช่องทางของคุณ" };
    }),
    verify: protectedProcedure.input(z.object({ channel: z.enum(["email", "phone"]), code: z.string().regex(/^\d{6}$/) })).mutation(async ({ ctx, input }) => {
      const success = await verifyCode(ctx.user.id, input.channel, input.code);
      if (!success) throw new TRPCError({ code: "BAD_REQUEST", message: "รหัสไม่ถูกต้องหรือหมดอายุ" });
      return { success: true };
    }),
    requestPasswordReset: publicProcedure.input(z.object({ identifier: z.string().min(3).max(320) })).mutation(async ({ input }) => {
      const user = await getUserByIdentifier(input.identifier);
      if (user) await createPasswordResetToken(user.id);
      return { success: true, message: "หากพบบัญชี ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้" };
    }),
    resetPassword: publicProcedure.input(z.object({ token: z.string().min(32), password: z.string().min(8).max(128) })).mutation(async ({ input }) => {
      const userId = await consumePasswordResetToken(input.token);
      if (!userId) throw new TRPCError({ code: "BAD_REQUEST", message: "ลิงก์หมดอายุหรือไม่ถูกต้อง" });
      await updateUserPassword(userId, await hashPassword(input.password));
      return { success: true };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  profile: router({
    update: protectedProcedure.input(z.object({ name: z.string().min(2).max(100), email: z.string().email().optional().or(z.literal("")), phone: z.string().optional(), monasteryName: z.string().max(160).optional(), avatarUrl: z.string().url().optional().or(z.literal("")) })).mutation(async ({ ctx, input }) => {
      await updateUserProfile(ctx.user.id, input);
      return { success: true };
    }),
    changePassword: protectedProcedure.input(z.object({ currentPassword: z.string().min(8), newPassword: z.string().min(8).max(128) })).mutation(async ({ ctx, input }) => {
      if (!ctx.user.passwordHash || !(await verifyPassword(input.currentPassword, ctx.user.passwordHash))) throw new TRPCError({ code: "UNAUTHORIZED", message: "รหัสผ่านเดิมไม่ถูกต้อง" });
      await updateUserPassword(ctx.user.id, await hashPassword(input.newPassword));
      return { success: true };
    }),
    devices: protectedProcedure.query(({ ctx }) => listLoginDevices(ctx.user.id)),
  }),
  courses: router({
    list: publicProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) => listCourses(input?.search)),
    lessons: publicProcedure.input(z.object({ courseId: z.number().optional() })).query(({ input }) => listLessons(input.courseId)),
    lesson: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => getLessonById(input.id)),
    updateMedia: teacherProcedure.input(z.object({ id: z.number(), videoUrl: z.string().url().optional().or(z.literal("")), pdfUrl: z.string().url().optional().or(z.literal("")) })).mutation(async ({ input }) => {
      await updateLessonMedia(input.id, input.videoUrl, input.pdfUrl);
      return { success: true };
    }),
    create: adminProcedure.input(z.object({ code: z.string().min(2).max(32), title: z.string().min(2).max(220), paliLevel: z.string().min(2).max(80), description: z.string().max(2000).optional(), orderIndex: z.number().int().optional() })).mutation(async ({ input }) => ({ id: await createCourse(input) })),
    update: adminProcedure.input(z.object({ id: z.number(), title: z.string().min(2).max(220).optional(), paliLevel: z.string().max(80).optional(), description: z.string().max(2000).optional(), isActive: z.boolean().optional(), orderIndex: z.number().int().optional() })).mutation(async ({ input }) => { const { id, ...values } = input; await updateCourse(id, values); return { success: true }; }),
    createLesson: adminProcedure.input(z.object({ courseId: z.number(), title: z.string().min(2).max(240), subtitle: z.string().max(240).optional(), videoUrl: z.string().url().optional().or(z.literal("")), pdfUrl: z.string().url().optional().or(z.literal("")), paliRawText: z.string().max(10000).optional(), durationMinutes: z.number().int().min(1).max(600).optional(), orderIndex: z.number().int().optional() })).mutation(async ({ input }) => ({ id: await createLesson(input) })),
    updateLesson: adminProcedure.input(z.object({ id: z.number(), title: z.string().min(2).max(240).optional(), subtitle: z.string().max(240).optional(), videoUrl: z.string().url().optional().or(z.literal("")), pdfUrl: z.string().url().optional().or(z.literal("")), paliRawText: z.string().max(10000).optional(), durationMinutes: z.number().int().min(1).max(600).optional(), orderIndex: z.number().int().optional(), isPublished: z.boolean().optional() })).mutation(async ({ input }) => { const { id, ...values } = input; await updateLesson(id, values); return { success: true }; }),
    deleteLesson: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await deleteLesson(input.id); return { success: true }; }),
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
    submit: protectedProcedure.input(z.object({ lessonId: z.number(), fileName: z.string().min(1).max(200), contentType: z.string().refine(value => value.startsWith("image/") || value === "application/pdf", "รองรับเฉพาะรูปภาพหรือ PDF"), dataUrl: z.string().max(8_000_000), note: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
      const match = input.dataUrl.match(/^data:[^;]+;base64,(.+)$/);
      if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "ไฟล์รูปไม่ถูกต้อง" });
      const buffer = Buffer.from(match[1], "base64");
      if (buffer.length > 5_000_000) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "ไฟล์ต้องมีขนาดไม่เกิน 5 MB" });
      const uploaded = await storagePut(`homework/${ctx.user.id}/${input.fileName}`, buffer, input.contentType);
      const id = await createHomework({ lessonId: input.lessonId, studentId: ctx.user.id, submissionImageUrl: uploaded.url, submissionFileKey: uploaded.key, note: input.note });
      const teachers = await listUsersForAdmin();
      await Promise.all(teachers.filter(user => user.role === "teacher" || user.role === "admin" || user.role === "owner").map(user => notifyUser(user.id, "homework_submitted", "มีการส่งการบ้านใหม่", `${ctx.user.name || "ผู้เรียน"} ส่งงานเพื่อรอตรวจ`)));
      return { id, url: uploaded.url };
    }),
    grade: teacherProcedure.input(z.object({ id: z.number(), status: z.enum(["graded", "revision"]), score: z.number().min(0).max(10).optional(), feedback: z.string().max(2000).optional() })).mutation(async ({ input }) => {
      await gradeHomework(input.id, input);
      const submission = (await listTeacherHomework()).find(item => item.submission.id === input.id);
      if (submission) await notifyUser(submission.submission.studentId, "homework_graded", input.status === "graded" ? "ครูตรวจการบ้านแล้ว" : "การบ้านต้องแก้ไข", input.feedback);
      return { success: true };
    }),
  }),
  dictionary: router({
    search: publicProcedure.input(z.object({ query: z.string().max(100) })).query(({ input }) => searchDictionary(normalizePali(input.query))),
    favorites: protectedProcedure.query(({ ctx }) => listDictionaryFavorites(ctx.user.id)),
    toggleFavorite: protectedProcedure.input(z.object({ entryId: z.number() })).mutation(async ({ ctx, input }) => ({ favorite: await toggleDictionaryFavorite(ctx.user.id, input.entryId) })),
    review: protectedProcedure.input(z.object({ entryId: z.number(), remembered: z.boolean() })).mutation(({ ctx, input }) => reviewVocabulary(ctx.user.id, input.entryId, input.remembered)),
    stats: protectedProcedure.query(({ ctx }) => getVocabularyStats(ctx.user.id)),
  }),
  quiz: router({
    forLesson: protectedProcedure.input(z.object({ lessonId: z.number() })).query(({ input }) => listLessonQuizzes(input.lessonId)),
    submit: protectedProcedure.input(z.object({ lessonId: z.number(), answers: z.array(z.number()).max(100) })).mutation(({ ctx, input }) => submitQuiz(ctx.user.id, input.lessonId, input.answers)),
  }),
  notifications: router({
    mine: protectedProcedure.query(({ ctx }) => listNotifications(ctx.user.id)),
    markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await markNotificationRead(ctx.user.id, input.id); return { success: true }; }),
  }),
  certificates: router({
    mine: protectedProcedure.query(({ ctx }) => listCertificates(ctx.user.id)),
    issue: protectedProcedure.input(z.object({ courseId: z.number() })).mutation(({ ctx, input }) => issueCertificate(ctx.user.id, input.courseId)),
  }),
  dashboard: router({
    summary: protectedProcedure.query(({ ctx }) => getDashboardSummary(ctx.user.id, ctx.user.role)),
    teacher: teacherProcedure.query(() => getTeacherDashboard()),
  }),
  admin: router({
    users: adminProcedure.query(() => listUsersForAdmin()),
    students: teacherProcedure.query(() => getStudentRoster()),
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

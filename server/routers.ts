import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createHomework, getDashboardSummary, getLessonById, getTeacherDashboard, gradeHomework, listCourses, listLessons, listStudentHomework, listTeacherHomework, normalizePali, saveProgress, searchDictionary, upsertUser } from "./db";
import { storagePut } from "./storage";

const teacherProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "teacher" && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "เฉพาะพระอาจารย์หรือผู้ดูแลระบบ" });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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
    promoteTeacher: adminProcedure.input(z.object({ userId: z.number() })).mutation(async () => ({ success: true })),
  }),
});

export type AppRouter = typeof appRouter;

import { and, count, desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { ENV } from "./_core/env";
import {
  courses,
  dictionaryEntries,
  homeworkSubmissions,
  lessonProgress,
  lessons,
  type InsertUser,
  users,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod", "monasteryName"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

const seedCourses = [
  { code: "PALI1-2", title: "ประโยค ๑–๒: อ่านบาลีให้เห็นความหมาย", paliLevel: "ประโยค ๑–๒", description: "เริ่มต้นอ่านและแปลประโยคบาลีด้วยจังหวะที่เป็นธรรมชาติ", coverTone: "saffron", orderIndex: 1 },
  { code: "GRAMMAR", title: "ไวยากรณ์บาลีพื้นฐาน", paliLevel: "บาลีไวยากรณ์", description: "ทำความเข้าใจนามศัพท์ วิภัตติ และโครงสร้างประโยค", coverTone: "teal", orderIndex: 2 },
  { code: "DHAMMAPADA", title: "ธรรมบท: ศัพท์และอรรถ", paliLevel: "ธรรมบท", description: "เรียนบาลีผ่านคาถาธรรมบท พร้อมศัพท์สำคัญที่ใช้บ่อย", coverTone: "coral", orderIndex: 3 },
];

const seedLessons = [
  { code: "PALI1-2", title: "พุทฺโธ ธมฺโม สงฺโฆ", subtitle: "ไตรสรณคมน์ • บทที่ ๐๔", durationMinutes: 18, orderIndex: 1, paliRawText: "พุทฺธํ สรณํ คจฺฉามิ\nธมฺมํ สรณํ คจฺฉามิ\nสงฺฆํ สรณํ คจฺฉามิ" },
  { code: "PALI1-2", title: "ตสฺมาติห — เพราะฉะนั้นแล", subtitle: "สังสนธิพื้นฐาน • บทที่ ๐๕", durationMinutes: 24, orderIndex: 2, paliRawText: "ตสฺมา อิติ ห ตสฺมาติห" },
  { code: "GRAMMAR", title: "นามศัพท์และวิภัตติ", subtitle: "ไวยากรณ์บาลี • บทที่ ๐๒", durationMinutes: 31, orderIndex: 1, paliRawText: "พุทฺโธ ภควา โลเก อุปฺปนฺโน" },
  { code: "DHAMMAPADA", title: "มโนปุพฺพงฺคมา ธมฺมา", subtitle: "ธรรมบท • คาถาที่ ๑", durationMinutes: 27, orderIndex: 1, paliRawText: "มโนปุพฺพงฺคมา ธมฺมา มโนเสฏฺฐา มโนมยา" },
];

const seedDictionary = [
  { displayText: "พุทฺโธ", searchIndex: "พุทโธ", meaning: "ผู้รู้ ผู้ตื่น ผู้เบิกบาน; พระพุทธเจ้า", grammarNote: "นามศัพท์ ปฐมาวิภัตติ เอกวจนะ", example: "พุทฺโธ ธมฺมํ เทเสติ" },
  { displayText: "ธมฺโม", searchIndex: "ธมโม", meaning: "ธรรมะ; คำสอนของพระพุทธเจ้า; สิ่งที่ทรงไว้ซึ่งผู้ปฏิบัติ", grammarNote: "นามศัพท์ ปฐมาวิภัตติ เอกวจนะ", example: "ธมฺโม ปาเปติ สุคตึ" },
  { displayText: "สงฺโฆ", searchIndex: "สงโฆ", meaning: "หมู่; คณะ; พระสงฆ์สาวกของพระพุทธเจ้า", grammarNote: "นามศัพท์ ปฐมาวิภัตติ เอกวจนะ", example: "สงฺโฆ สีลสมฺปนฺโน" },
  { displayText: "ตสฺมา", searchIndex: "ตสมา", meaning: "เพราะเหตุนั้น; เพราะฉะนั้น", grammarNote: "นิบาตบอกเหตุผล", example: "ตสฺมา อปฺปมาเทน สมฺปาเทถ" },
  { displayText: "มโน", searchIndex: "มโน", meaning: "ใจ; จิต; ความคิด", grammarNote: "นามศัพท์ นปุงสกลิงค์", example: "มโนปุพฺพงฺคมา ธมฺมา" },
];

export function normalizePali(value: string) {
  return value.replace(/[ฺํ]/g, "").normalize("NFC").toLowerCase().trim();
}

export async function ensureCatalogSeed() {
  const db = await getDb();
  if (!db) return;
  const existingCourses = await db.select({ total: count() }).from(courses);
  if (Number(existingCourses[0]?.total ?? 0) === 0) await db.insert(courses).values(seedCourses);
  const existingLessons = await db.select({ total: count() }).from(lessons);
  if (Number(existingLessons[0]?.total ?? 0) === 0) {
    const dbCourses = await db.select({ id: courses.id, code: courses.code }).from(courses);
    const ids = new Map(dbCourses.map(course => [course.code, course.id]));
    await db.insert(lessons).values(seedLessons.map(lesson => ({ courseId: ids.get(lesson.code) ?? 1, title: lesson.title, subtitle: lesson.subtitle, durationMinutes: lesson.durationMinutes, orderIndex: lesson.orderIndex, paliRawText: lesson.paliRawText })));
  }
  const existingDictionary = await db.select({ total: count() }).from(dictionaryEntries);
  if (Number(existingDictionary[0]?.total ?? 0) === 0) await db.insert(dictionaryEntries).values(seedDictionary);
}

export async function listCourses(search?: string) {
  const db = await getDb();
  if (!db) return [];
  await ensureCatalogSeed();
  const rows = await db.select().from(courses).where(eq(courses.isActive, true)).orderBy(courses.orderIndex);
  const query = search ? normalizePali(search) : "";
  const filtered = query ? rows.filter(row => normalizePali(`${row.title} ${row.paliLevel} ${row.code}`).includes(query)) : rows;
  return Promise.all(filtered.map(async course => ({ ...course, lessons: await listLessons(course.id) })));
}

export async function listLessons(courseId?: number) {
  const db = await getDb();
  if (!db) return [];
  await ensureCatalogSeed();
  const conditions = [eq(lessons.isPublished, true)];
  if (courseId) conditions.push(eq(lessons.courseId, courseId));
  return db.select().from(lessons).where(and(...conditions)).orderBy(lessons.orderIndex);
}

export async function getLessonById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  await ensureCatalogSeed();
  const result = await db.select({ lesson: lessons, course: courses }).from(lessons).innerJoin(courses, eq(lessons.courseId, courses.id)).where(eq(lessons.id, id)).limit(1);
  return result[0] ? { ...result[0].lesson, course: result[0].course } : undefined;
}

export async function saveProgress(userId: number, lessonId: number, progressPercent: number, minutesWatched: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(lessonProgress).where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId))).limit(1);
  const progress = Math.max(0, Math.min(100, progressPercent));
  const values = { progressPercent: progress, minutesWatched: Math.max(0, minutesWatched), lastViewedAt: new Date(), completedAt: progress >= 100 ? new Date() : null };
  if (existing[0]) await db.update(lessonProgress).set(values).where(eq(lessonProgress.id, existing[0].id));
  else await db.insert(lessonProgress).values({ userId, lessonId, ...values });
}

export async function listStudentHomework(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ submission: homeworkSubmissions, lesson: lessons, course: courses }).from(homeworkSubmissions).innerJoin(lessons, eq(homeworkSubmissions.lessonId, lessons.id)).innerJoin(courses, eq(lessons.courseId, courses.id)).where(eq(homeworkSubmissions.studentId, studentId)).orderBy(desc(homeworkSubmissions.createdAt));
}

export async function listTeacherHomework() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ submission: homeworkSubmissions, lesson: lessons, student: users }).from(homeworkSubmissions).innerJoin(lessons, eq(homeworkSubmissions.lessonId, lessons.id)).innerJoin(users, eq(homeworkSubmissions.studentId, users.id)).orderBy(desc(homeworkSubmissions.createdAt));
}

export async function createHomework(input: { lessonId: number; studentId: number; submissionImageUrl: string; submissionFileKey: string; note?: string }) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(homeworkSubmissions).values(input);
  return Number(result[0].insertId);
}

export async function gradeHomework(id: number, input: { status: "graded" | "revision"; score?: number; feedback?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(homeworkSubmissions).set({ ...input, gradedAt: new Date() }).where(eq(homeworkSubmissions.id, id));
}

export async function searchDictionary(query: string) {
  const db = await getDb();
  if (!db) return [];
  await ensureCatalogSeed();
  const normalized = normalizePali(query);
  if (!normalized) return db.select().from(dictionaryEntries).orderBy(dictionaryEntries.displayText).limit(8);
  return db.select().from(dictionaryEntries).where(or(like(dictionaryEntries.searchIndex, `%${normalized}%`), like(dictionaryEntries.displayText, `%${query}%`))).limit(12);
}

export async function getDashboardSummary(userId: number, role: string) {
  const db = await getDb();
  if (!db) return { role, totalLessons: 0, completedLessons: 0, avgProgress: 0, homeworkPending: 0, weeklyMinutes: 0, progress: [], pendingForTeacher: 0, gradedThisWeek: 0 };
  await ensureCatalogSeed();
  const lessonCount = await db.select({ total: count() }).from(lessons).where(eq(lessons.isPublished, true));
  const progressRows = await db.select({ lessonId: lessonProgress.lessonId, progressPercent: lessonProgress.progressPercent, minutesWatched: lessonProgress.minutesWatched }).from(lessonProgress).where(eq(lessonProgress.userId, userId));
  const homeworkRows = await db.select({ status: homeworkSubmissions.status }).from(homeworkSubmissions).where(eq(homeworkSubmissions.studentId, userId));
  const completedLessons = progressRows.filter(row => row.progressPercent >= 100).length;
  const avgProgress = progressRows.length ? Math.round(progressRows.reduce((sum, row) => sum + row.progressPercent, 0) / progressRows.length) : 0;
  const pendingForTeacher = role === "teacher" || role === "admin" ? Number((await db.select({ total: count() }).from(homeworkSubmissions).where(eq(homeworkSubmissions.status, "pending")))[0]?.total ?? 0) : 0;
  return { role, totalLessons: Number(lessonCount[0]?.total ?? 0), completedLessons, avgProgress, homeworkPending: homeworkRows.filter(row => row.status === "pending").length, weeklyMinutes: progressRows.reduce((sum, row) => sum + row.minutesWatched, 0), progress: progressRows, pendingForTeacher, gradedThisWeek: homeworkRows.filter(row => row.status === "graded").length };
}

export async function getTeacherDashboard() {
  const db = await getDb();
  if (!db) return { students: 0, pendingHomework: 0, gradedThisWeek: 0, averageScore: 0 };
  const students = await db.select({ total: count() }).from(users).where(eq(users.role, "user"));
  const pendingHomework = await db.select({ total: count() }).from(homeworkSubmissions).where(eq(homeworkSubmissions.status, "pending"));
  const gradedThisWeek = await db.select({ total: count() }).from(homeworkSubmissions).where(eq(homeworkSubmissions.status, "graded"));
  return { students: Number(students[0]?.total ?? 0), pendingHomework: Number(pendingHomework[0]?.total ?? 0), gradedThisWeek: Number(gradedThisWeek[0]?.total ?? 0), averageScore: 0 };
}

import { and, count, desc, eq, like, lt, or, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createHash, randomBytes } from "node:crypto";
import { ENV } from "./_core/env";
import {
  courses,
  certificates,
  dictionaryEntries,
  dictionaryFavorites,
  homeworkSubmissions,
  lessonQuizzes,
  lessonProgress,
  lessons,
  loginDevices,
  notifications,
  passwordResetTokens,
  quizAttempts,
  type InsertUser,
  users,
  verificationCodes,
  vocabularyReviews,
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

export function localOpenId(email: string) {
  return `local_${createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 56)}`;
}

export function normalizePhone(phone: string) {
  const compact = phone.trim().replace(/[\s().-]/g, "");
  if (compact.startsWith("+66")) return `0${compact.slice(3)}`;
  if (compact.startsWith("66")) return `0${compact.slice(2)}`;
  return compact;
}

export function isEmailIdentifier(identifier: string) {
  return identifier.includes("@");
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
  return result[0];
}

export async function getUserByIdentifier(identifier: string) {
  const value = identifier.trim();
  if (isEmailIdentifier(value)) return getUserByEmail(value);
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.phone, normalizePhone(value))).limit(1);
  return result[0];
}

export async function createLocalUser(input: { name: string; email?: string; phone?: string; passwordHash: string; role?: "user" | "teacher" | "admin" | "owner" }) {
  const db = await getDb();
  if (!db) return undefined;
  const contact = input.email?.trim().toLowerCase() || normalizePhone(input.phone || "");
  const [created] = await db.insert(users).values({ openId: localOpenId(contact), name: input.name.trim(), email: input.email?.trim().toLowerCase() || null, phone: input.phone ? normalizePhone(input.phone) : null, passwordHash: input.passwordHash, loginMethod: input.email ? "email" : "phone", role: input.role || "user" }).$returningId();
  return created?.id;
}

export async function setLocalPassword(email: string, passwordHash: string, name: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ passwordHash, name: name.trim(), loginMethod: "email" }).where(eq(users.email, email.trim().toLowerCase()));
}

export async function setLocalContactPassword(identifier: string, passwordHash: string, name: string) {
  const db = await getDb();
  if (!db) return;
  const field = isEmailIdentifier(identifier) ? eq(users.email, identifier.trim().toLowerCase()) : eq(users.phone, normalizePhone(identifier));
  await db.update(users).set({ passwordHash, name: name.trim(), loginMethod: isEmailIdentifier(identifier) ? "email" : "phone" }).where(field);
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

const seedQuizTemplates = [
  { lessonTitle: "พุทฺโธ ธมฺโม สงฺโฆ", question: "พุทฺธํ สรณํ คจฺฉามิ มีความหมายว่าอย่างไร", choices: ["ข้าพเจ้าถึงพระพุทธเจ้าเป็นสรณะ", "ข้าพเจ้าถึงพระสงฆ์เป็นสรณะ", "ข้าพเจ้าถึงธรรมเป็นสรณะ"], answerIndex: 0, explanation: "พุทฺธํ คือ พระพุทธเจ้า" },
  { lessonTitle: "ตสฺมาติห — เพราะฉะนั้นแล", question: "ตสฺมา แปลว่าอะไร", choices: ["เมื่อวานนี้", "เพราะเหตุนั้น", "ที่ไหน"], answerIndex: 1, explanation: "ตสฺมา เป็นนิบาตบอกเหตุผล" },
  { lessonTitle: "นามศัพท์และวิภัตติ", question: "ปฐมาวิภัตติทำหน้าที่ใดโดยทั่วไป", choices: ["ประธาน", "กรรม", "เครื่องมือ"], answerIndex: 0, explanation: "ปฐมาวิภัตติมักทำหน้าที่เป็นประธาน" },
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
  const existingQuizzes = await db.select({ total: count() }).from(lessonQuizzes);
  if (Number(existingQuizzes[0]?.total ?? 0) === 0) {
    const dbLessons = await db.select({ id: lessons.id, title: lessons.title }).from(lessons);
    const quizRows = seedQuizTemplates.flatMap(template => {
      const lesson = dbLessons.find(item => item.title === template.lessonTitle);
      return lesson ? [{ lessonId: lesson.id, question: template.question, choicesJson: JSON.stringify(template.choices), answerIndex: template.answerIndex, explanation: template.explanation }] : [];
    });
    if (quizRows.length) await db.insert(lessonQuizzes).values(quizRows);
  }
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
  if (!db) return { role, totalLessons: 0, completedLessons: 0, avgProgress: 0, averageScore: 0, homeworkPending: 0, weeklyMinutes: 0, progress: [], pendingForTeacher: 0, gradedThisWeek: 0 };
  await ensureCatalogSeed();
  const lessonCount = await db.select({ total: count() }).from(lessons).where(eq(lessons.isPublished, true));
  const progressRows = await db.select({ lessonId: lessonProgress.lessonId, progressPercent: lessonProgress.progressPercent, minutesWatched: lessonProgress.minutesWatched }).from(lessonProgress).where(eq(lessonProgress.userId, userId));
  const homeworkRows = await db.select({ status: homeworkSubmissions.status, score: homeworkSubmissions.score }).from(homeworkSubmissions).where(eq(homeworkSubmissions.studentId, userId));
  const completedLessons = progressRows.filter(row => row.progressPercent >= 100).length;
  const avgProgress = progressRows.length ? Math.round(progressRows.reduce((sum, row) => sum + row.progressPercent, 0) / progressRows.length) : 0;
  const pendingForTeacher = role === "teacher" || role === "admin" || role === "owner" ? Number((await db.select({ total: count() }).from(homeworkSubmissions).where(eq(homeworkSubmissions.status, "pending")))[0]?.total ?? 0) : 0;
  const scoredRows = homeworkRows.filter(row => row.score !== null && row.score !== undefined);
  const averageScore = scoredRows.length ? Math.round((scoredRows.reduce((sum, row) => sum + Number(row.score), 0) / scoredRows.length) * 10) / 10 : 0;
  return { role, totalLessons: Number(lessonCount[0]?.total ?? 0), completedLessons, avgProgress, averageScore, homeworkPending: homeworkRows.filter(row => row.status === "pending").length, weeklyMinutes: progressRows.reduce((sum, row) => sum + row.minutesWatched, 0), progress: progressRows, pendingForTeacher, gradedThisWeek: homeworkRows.filter(row => row.status === "graded").length };
}

export async function getTeacherDashboard() {
  const db = await getDb();
  if (!db) return { students: 0, pendingHomework: 0, gradedThisWeek: 0, averageScore: 0 };
  const students = await db.select({ total: count() }).from(users).where(eq(users.role, "user"));
  const pendingHomework = await db.select({ total: count() }).from(homeworkSubmissions).where(eq(homeworkSubmissions.status, "pending"));
  const gradedThisWeek = await db.select({ total: count() }).from(homeworkSubmissions).where(eq(homeworkSubmissions.status, "graded"));
  return { students: Number(students[0]?.total ?? 0), pendingHomework: Number(pendingHomework[0]?.total ?? 0), gradedThisWeek: Number(gradedThisWeek[0]?.total ?? 0), averageScore: 0 };
}

export async function listUsersForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, monasteryName: users.monasteryName, role: users.role, lastSignedIn: users.lastSignedIn }).from(users).orderBy(desc(users.lastSignedIn));
}

export async function updateUserRole(userId: number, role: "user" | "teacher" | "admin" | "owner") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function updateLessonMedia(id: number, videoUrl?: string | null, pdfUrl?: string | null) {
  const db = await getDb();
  if (!db) return;
  await db.update(lessons).set({ videoUrl: videoUrl || null, pdfUrl: pdfUrl || null }).where(eq(lessons.id, id));
}


function hashSecurityValue(value: string) {
  return createHash("sha256").update(`${ENV.cookieSecret}:${value}`).digest("hex");
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateUserProfile(userId: number, input: { name: string; email?: string | null; phone?: string | null; monasteryName?: string | null; avatarUrl?: string | null }) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ name: input.name.trim(), email: input.email?.trim().toLowerCase() || null, phone: input.phone ? normalizePhone(input.phone) : null, monasteryName: input.monasteryName || null, avatarUrl: input.avatarUrl || null }).where(eq(users.id, userId));
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function createVerificationCode(userId: number, channel: "email" | "phone", target: string) {
  const db = await getDb();
  if (!db) return undefined;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await db.insert(verificationCodes).values({ userId, channel, target, codeHash: hashSecurityValue(code), expiresAt: new Date(Date.now() + 10 * 60_000) });
  return code;
}

export async function verifyCode(userId: number, channel: "email" | "phone", code: string) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select().from(verificationCodes).where(and(eq(verificationCodes.userId, userId), eq(verificationCodes.channel, channel), isNull(verificationCodes.usedAt))).orderBy(desc(verificationCodes.createdAt)).limit(1);
  const row = rows[0];
  if (!row || row.expiresAt.getTime() < Date.now() || row.codeHash !== hashSecurityValue(code)) return false;
  await db.update(verificationCodes).set({ usedAt: new Date() }).where(eq(verificationCodes.id, row.id));
  await db.update(users).set(channel === "email" ? { emailVerifiedAt: new Date() } : { phoneVerifiedAt: new Date() }).where(eq(users.id, userId));
  return true;
}

export async function createPasswordResetToken(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const token = randomBytes(32).toString("hex");
  await db.insert(passwordResetTokens).values({ userId, tokenHash: hashSecurityValue(token), expiresAt: new Date(Date.now() + 30 * 60_000) });
  return token;
}

export async function consumePasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(passwordResetTokens).where(and(eq(passwordResetTokens.tokenHash, hashSecurityValue(token)), isNull(passwordResetTokens.usedAt))).limit(1);
  const row = rows[0];
  if (!row || row.expiresAt.getTime() < Date.now()) return undefined;
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, row.id));
  return row.userId;
}

export async function registerLoginDevice(userId: number, deviceName: string, userAgent?: string) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(loginDevices).where(and(eq(loginDevices.userId, userId), eq(loginDevices.deviceName, deviceName))).limit(1);
  if (existing[0]) await db.update(loginDevices).set({ userAgent, lastSeenAt: new Date() }).where(eq(loginDevices.id, existing[0].id));
  else await db.insert(loginDevices).values({ userId, deviceName, userAgent });
}

export async function listLoginDevices(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: loginDevices.id, deviceName: loginDevices.deviceName, lastSeenAt: loginDevices.lastSeenAt, createdAt: loginDevices.createdAt }).from(loginDevices).where(eq(loginDevices.userId, userId)).orderBy(desc(loginDevices.lastSeenAt));
}

export async function listNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(30);
}

export async function markNotificationRead(userId: number, id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function notifyUser(userId: number, type: string, title: string, body?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({ userId, type, title, body });
}

export async function listLessonQuizzes(lessonId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(lessonQuizzes).where(eq(lessonQuizzes.lessonId, lessonId));
  return rows.map(row => ({ ...row, choices: JSON.parse(row.choicesJson) as string[] }));
}

export async function submitQuiz(userId: number, lessonId: number, answers: number[]) {
  const db = await getDb();
  if (!db) return { score: 0, total: 0, passed: false };
  const questions = await db.select().from(lessonQuizzes).where(eq(lessonQuizzes.lessonId, lessonId));
  const score = questions.reduce((total, question, index) => total + (answers[index] === question.answerIndex ? 1 : 0), 0);
  await db.insert(quizAttempts).values({ userId, lessonId, score, total: questions.length, answersJson: JSON.stringify(answers) });
  if (score === questions.length && questions.length > 0) await saveProgress(userId, lessonId, 100, 0);
  return { score, total: questions.length, passed: questions.length > 0 && score / questions.length >= 0.7 };
}

export async function toggleDictionaryFavorite(userId: number, entryId: number) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select().from(dictionaryFavorites).where(and(eq(dictionaryFavorites.userId, userId), eq(dictionaryFavorites.entryId, entryId))).limit(1);
  if (existing[0]) { await db.delete(dictionaryFavorites).where(eq(dictionaryFavorites.id, existing[0].id)); return false; }
  await db.insert(dictionaryFavorites).values({ userId, entryId });
  return true;
}

export async function listDictionaryFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ favorite: dictionaryFavorites, entry: dictionaryEntries }).from(dictionaryFavorites).innerJoin(dictionaryEntries, eq(dictionaryFavorites.entryId, dictionaryEntries.id)).where(eq(dictionaryFavorites.userId, userId)).orderBy(desc(dictionaryFavorites.createdAt));
}

export async function reviewVocabulary(userId: number, entryId: number, remembered: boolean) {
  const db = await getDb();
  if (!db) return { streak: 0, nextReviewAt: new Date() };
  const existing = await db.select().from(vocabularyReviews).where(and(eq(vocabularyReviews.userId, userId), eq(vocabularyReviews.entryId, entryId))).limit(1);
  const streak = Math.max(0, (existing[0]?.streak ?? 0) + (remembered ? 1 : -1));
  const days = remembered ? Math.min(30, Math.max(1, streak)) : 1;
  const nextReviewAt = new Date(Date.now() + days * 86_400_000);
  if (existing[0]) await db.update(vocabularyReviews).set({ streak, nextReviewAt, lastReviewedAt: new Date() }).where(eq(vocabularyReviews.id, existing[0].id));
  else await db.insert(vocabularyReviews).values({ userId, entryId, streak, nextReviewAt, lastReviewedAt: new Date() });
  return { streak, nextReviewAt };
}

export async function getVocabularyStats(userId: number) {
  const db = await getDb();
  if (!db) return { due: 0, streak: 0, reviewed: 0 };
  const rows = await db.select().from(vocabularyReviews).where(eq(vocabularyReviews.userId, userId));
  return { due: rows.filter(row => row.nextReviewAt.getTime() <= Date.now()).length, streak: rows.reduce((max, row) => Math.max(max, row.streak), 0), reviewed: rows.length };
}

export async function issueCertificate(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await db.select().from(certificates).where(and(eq(certificates.userId, userId), eq(certificates.courseId, courseId))).limit(1);
  if (existing[0]) return existing[0];
  const certificateNo = `PALI-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
  await db.insert(certificates).values({ userId, courseId, certificateNo });
  const created = await db.select().from(certificates).where(eq(certificates.certificateNo, certificateNo)).limit(1);
  return created[0];
}

export async function listCertificates(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ certificate: certificates, course: courses }).from(certificates).innerJoin(courses, eq(certificates.courseId, courses.id)).where(eq(certificates.userId, userId)).orderBy(desc(certificates.issuedAt));
}

export async function createCourse(input: { code: string; title: string; paliLevel: string; description?: string; orderIndex?: number }) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(courses).values({ ...input, orderIndex: input.orderIndex ?? 0 });
  return Number(result[0].insertId);
}

export async function updateCourse(id: number, input: { title?: string; paliLevel?: string; description?: string; isActive?: boolean; orderIndex?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.update(courses).set(input).where(eq(courses.id, id));
}

export async function deleteLesson(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(lessons).where(eq(lessons.id, id));
}

export async function createLesson(input: { courseId: number; title: string; subtitle?: string; videoUrl?: string; pdfUrl?: string; paliRawText?: string; durationMinutes?: number; orderIndex?: number }) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(lessons).values({ ...input, durationMinutes: input.durationMinutes ?? 20, orderIndex: input.orderIndex ?? 0 });
  return Number(result[0].insertId);
}

export async function updateLesson(id: number, input: { title?: string; subtitle?: string; videoUrl?: string | null; pdfUrl?: string | null; paliRawText?: string; durationMinutes?: number; orderIndex?: number; isPublished?: boolean }) {
  const db = await getDb();
  if (!db) return;
  await db.update(lessons).set(input).where(eq(lessons.id, id));
}

export async function getStudentRoster() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, lastSignedIn: users.lastSignedIn, role: users.role }).from(users).where(eq(users.role, "user")).orderBy(desc(users.lastSignedIn));
}

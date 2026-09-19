import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 220 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  monasteryName: varchar("monasteryName", { length: 160 }),
  role: mysqlEnum("role", ["user", "teacher", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  title: varchar("title", { length: 220 }).notNull(),
  paliLevel: varchar("paliLevel", { length: 80 }).notNull(),
  description: text("description"),
  coverTone: varchar("coverTone", { length: 24 }).default("saffron").notNull(),
  orderIndex: int("orderIndex").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const lessons = mysqlTable("lessons", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull().references(() => courses.id),
  title: varchar("title", { length: 240 }).notNull(),
  subtitle: varchar("subtitle", { length: 240 }),
  videoUrl: text("videoUrl"),
  pdfUrl: text("pdfUrl"),
  paliRawText: text("paliRawText"),
  durationMinutes: int("durationMinutes").default(20).notNull(),
  orderIndex: int("orderIndex").default(0).notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const lessonProgress = mysqlTable("lessonProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  lessonId: int("lessonId").notNull().references(() => lessons.id),
  progressPercent: int("progressPercent").default(0).notNull(),
  minutesWatched: int("minutesWatched").default(0).notNull(),
  lastViewedAt: timestamp("lastViewedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const homeworkSubmissions = mysqlTable("homeworkSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull().references(() => lessons.id),
  studentId: int("studentId").notNull().references(() => users.id),
  submissionImageUrl: text("submissionImageUrl").notNull(),
  submissionFileKey: varchar("submissionFileKey", { length: 400 }),
  note: text("note"),
  feedback: text("feedback"),
  score: int("score"),
  status: mysqlEnum("status", ["pending", "graded", "revision"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  gradedAt: timestamp("gradedAt"),
});

export const dictionaryEntries = mysqlTable("dictionaryEntries", {
  id: int("id").autoincrement().primaryKey(),
  displayText: varchar("displayText", { length: 180 }).notNull(),
  searchIndex: varchar("searchIndex", { length: 220 }).notNull(),
  meaning: text("meaning").notNull(),
  grammarNote: varchar("grammarNote", { length: 240 }),
  example: text("example"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type HomeworkSubmission = typeof homeworkSubmissions.$inferSelect;
export type DictionaryEntry = typeof dictionaryEntries.$inferSelect;

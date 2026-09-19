import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { normalizePali } from "./db";
import type { TrpcContext } from "./_core/context";

function contextFor(role: "user" | "teacher" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: 9,
      openId: "features-test-user",
      name: "ผู้ทดสอบ",
      email: "test@example.com",
      loginMethod: "test",
      monasteryName: null,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("pali dictionary normalization", () => {
  it("matches words with pindtu and niggahita removed", () => {
    expect(normalizePali("พุทฺโธ")).toBe(normalizePali("พุทโธ"));
    expect(normalizePali("สงฺโฆ")).toBe(normalizePali("สงโฆ"));
  });
});

describe("teacher access control", () => {
  it("rejects student access to teacher homework", async () => {
    const caller = appRouter.createCaller(contextFor("user"));
    await expect(caller.homework.forTeacher()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows teacher role to reach the teacher procedure", async () => {
    const caller = appRouter.createCaller(contextFor("teacher"));
    await expect(caller.homework.forTeacher()).resolves.toEqual([]);
  });
});

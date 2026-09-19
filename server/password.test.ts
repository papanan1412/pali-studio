import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("local password authentication", () => {
  it("hashes and verifies the original password", async () => {
    const hash = await hashPassword("บาลีสตูดิโอ123");
    expect(hash).not.toContain("บาลีสตูดิโอ123");
    await expect(verifyPassword("บาลีสตูดิโอ123", hash)).resolves.toBe(true);
    await expect(verifyPassword("รหัสผ่านผิด", hash)).resolves.toBe(false);
  });
});

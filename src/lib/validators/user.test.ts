import { describe, it, expect } from "vitest";
import {
  createUserSchema,
  updateUserSchema,
  loginSchema,
  registerSchema,
} from "./user";

describe("user validators", () => {
  describe("createUserSchema", () => {
    it("should accept valid input", () => {
      const result = createUserSchema.safeParse({
        email: "test@example.com",
        name: "Test User",
        password: "securepass123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = createUserSchema.safeParse({
        email: "not-an-email",
        name: "Test",
        password: "securepass123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject short password", () => {
      const result = createUserSchema.safeParse({
        email: "test@example.com",
        name: "Test",
        password: "short",
      });
      expect(result.success).toBe(false);
    });

    it("should default role to member", () => {
      const result = createUserSchema.parse({
        email: "test@example.com",
        name: "Test",
        password: "securepass123",
      });
      expect(result.role).toBe("member");
    });

    it("should accept valid roles", () => {
      for (const role of ["admin", "member", "viewer"]) {
        const result = createUserSchema.safeParse({
          email: "test@example.com",
          name: "Test",
          password: "securepass123",
          role,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid role", () => {
      const result = createUserSchema.safeParse({
        email: "test@example.com",
        name: "Test",
        password: "securepass123",
        role: "superadmin",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateUserSchema", () => {
    it("should accept partial updates", () => {
      const result = updateUserSchema.safeParse({ name: "New Name" });
      expect(result.success).toBe(true);
    });

    it("should accept empty object", () => {
      const result = updateUserSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("loginSchema", () => {
    it("should accept valid credentials", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "password",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("should accept valid registration", () => {
      const result = registerSchema.safeParse({
        email: "new@example.com",
        name: "New User",
        password: "securepass123",
        teamName: "My Team",
      });
      expect(result.success).toBe(true);
    });

    it("should require team name", () => {
      const result = registerSchema.safeParse({
        email: "new@example.com",
        name: "New User",
        password: "securepass123",
      });
      expect(result.success).toBe(false);
    });
  });
});

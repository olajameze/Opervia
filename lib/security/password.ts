import { z } from "zod";

export const PASSWORD_MAX_LENGTH = 128;

const COMMON_PASSWORDS = new Set([
  "password",
  "password123",
  "12345678",
  "123456789",
  "qwerty123",
  "letmein123",
  "welcome123",
  "admin123",
  "opervia123",
]);

export function validatePassword(password: string): string | null {
  const value = password.trim();

  if (value.length < 8) return "Password must be at least 8 characters";
  if (value.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters`;
  }
  if (!/[a-zA-Z]/.test(value)) return "Password must include at least one letter";
  if (!/[0-9]/.test(value)) return "Password must include at least one number";
  if (COMMON_PASSWORDS.has(value.toLowerCase())) {
    return "Password is too common. Choose a stronger password.";
  }

  return null;
}

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
  .superRefine((value, ctx) => {
    const error = validatePassword(value);
    if (error) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
    }
  });

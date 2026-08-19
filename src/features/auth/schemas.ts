import { z } from "zod";

/** Stable marker — UI shows the full requirements list instead of one rule at a time. */
export const PASSWORD_REQUIREMENTS_ERROR = "PASSWORD_REQUIREMENTS";

const PASSWORD_RULES: ReadonlyArray<(value: string) => boolean> = [
  (value) => value.length >= 8,
  (value) => /[a-z]/.test(value),
  (value) => /[A-Z]/.test(value),
  (value) => /[0-9]/.test(value),
  (value) => /[^A-Za-z0-9]/.test(value),
];

export const passwordSchema = z.string().superRefine((value, ctx) => {
  if (PASSWORD_RULES.every((rule) => rule(value))) {
    return;
  }

  ctx.addIssue({
    code: "custom",
    message: PASSWORD_REQUIREMENTS_ERROR,
  });
});

export const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
  rememberMe: z.literal("on").optional(),
});

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    phone: z.string().trim().min(5).max(40),
    password: passwordSchema,
    confirmPassword: z.string().min(1),
    acceptTerms: z.literal("on", {
      message: "You must accept the terms to continue.",
    }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string().min(1),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

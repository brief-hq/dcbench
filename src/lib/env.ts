import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Environment configuration — single source of truth.
 *
 * CONVENTION: All environment variable access MUST go through this module.
 * Import `env` from `@/lib/env` instead of using `process.env` directly.
 * This ensures runtime validation and type safety for all env vars.
 */
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().default("./prism.db"),
    SESSION_SECRET: z.string().min(32).default("dev-secret-must-be-at-least-32-characters-long"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },
  client: {
    NEXT_PUBLIC_POSTHOG_KEY: z.string().default("phc_development"),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().default("https://us.i.posthog.com"),
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_HELP_CENTER_URL: z.string().url().default("https://help.example.com"),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    SESSION_SECRET: process.env.SESSION_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_HELP_CENTER_URL: process.env.NEXT_PUBLIC_HELP_CENTER_URL,
  },
});

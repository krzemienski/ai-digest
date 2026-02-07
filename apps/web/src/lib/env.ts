import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    RESEND_API_KEY: z.string().optional(),
    ADMIN_API_KEY: z.string().min(16).optional(),
    UNSUBSCRIBE_SECRET: z.string().min(16).optional(),
  },
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    ADMIN_API_KEY: process.env.ADMIN_API_KEY,
    UNSUBSCRIBE_SECRET: process.env.UNSUBSCRIBE_SECRET,
  },
});

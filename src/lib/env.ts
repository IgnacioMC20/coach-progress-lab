import "server-only";
import { z } from "zod";
const serverSchema = z.object({ DATABASE_URL: z.string().url() });
const publicSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Coach Progress"),
});
export const env = {
  server: serverSchema.parse({ DATABASE_URL: process.env.DATABASE_URL }),
  public: publicSchema.parse({ NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME }),
};

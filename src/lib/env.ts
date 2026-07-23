import "server-only";
import { z } from "zod";
import { mongodbUrlSchema } from "@/lib/mongodb-url";
const serverSchema = z.object({ DATABASE_URL: mongodbUrlSchema });
const publicSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Coach Progress Lab"),
});
export const env = {
  server: serverSchema.parse({ DATABASE_URL: process.env.DATABASE_URL }),
  public: publicSchema.parse({
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  }),
};

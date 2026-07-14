import { z } from "zod";
import { objectIdSchema } from "@/features/clients/schemas/client.schema";

export const progressionQuerySchema = z.object({
  clientId: objectIdSchema,
});

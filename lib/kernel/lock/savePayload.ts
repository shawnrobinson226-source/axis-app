import { z } from "zod";
import { DISTORTION_CLASSES } from "../distortion-types";
import { SESSION_OUTCOME } from "../events";

export const zCreateEntryInput = z.object({
  trigger: z.string().min(1),

  confirmed_class: z.enum(DISTORTION_CLASSES),

  outcome: z.enum(SESSION_OUTCOME),

  clarity_0_10: z.number().min(0).max(10),

  steps_completed: z.number().int().min(0).max(9),

  analysis_preview: z.unknown().optional(),
});

export type CreateEntryInput = z.infer<typeof zCreateEntryInput>;
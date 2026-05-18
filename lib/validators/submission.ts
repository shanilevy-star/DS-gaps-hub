import { z } from "zod";
import { FREQUENCY_IMPACT_VALUES } from "@/lib/constants/frequency-impact";
import { GAP_TYPE_VALUES } from "@/lib/constants/gap-types";

const requiredText = (label: string, min: number, max = 2000) =>
  z
    .string()
    .trim()
    .min(min, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

const optionalUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v === "" || /^https?:\/\//.test(v), {
    message: "Use a full URL starting with http:// or https://",
  });

export const submissionSchema = z.object({
  title: requiredText("Title", 3, 140),
  team: z
    .string()
    .trim()
    .min(1, "Pick a team.")
    .max(120),
  component_name: z
    .string()
    .trim()
    .min(1, "Add a component name.")
    .max(120),
  gap_type: z.enum(GAP_TYPE_VALUES, {
    message: "Pick a gap type.",
  }),
  frequency_impact: z.enum(FREQUENCY_IMPACT_VALUES, {
    message: "Pick a frequency.",
  }),
  problem_description: requiredText("Problem description", 10),
  use_case: requiredText("Use case", 5),
  why_insufficient: requiredText("Why the current component is insufficient", 5),
  proposed_support: requiredText("Proposed support needed", 5),
  figma_url: optionalUrl.default(""),
  storybook_url: optionalUrl.default(""),
  open_questions: z
    .string()
    .trim()
    .max(2000, "Open questions must be 2000 characters or fewer.")
    .default(""),
});

export type SubmissionInput = z.input<typeof submissionSchema>;
export type SubmissionValues = z.output<typeof submissionSchema>;

import { z } from "zod";
import { FRAMEWORK_VALUES } from "@/lib/constants/frameworks";
import { GAP_TYPE_VALUES } from "@/lib/constants/gap-types";

const FORM_FREQUENCY_IMPACT_VALUES = [
  "cross_product_need",
  "repeated_product_need",
  "one_time_use_case",
] as const;

const requiredText = (label: string, min: number, max = 2000) =>
  z
    .string()
    .trim()
    .min(min, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

const optionalText = (label: string, max = 2000) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .default("");

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
  framework: z.enum(FRAMEWORK_VALUES).optional(),
  gap_type: z
    .array(z.enum(GAP_TYPE_VALUES))
    .min(1, "Select at least one gap type."),
  gap_type_other: z.string().trim().max(160).default(""),
  frequency_impact: z.enum(FORM_FREQUENCY_IMPACT_VALUES, {
    message: "Pick a frequency.",
  }),
  problem_description: requiredText("Problem description", 10),
  use_case: requiredText("Use case", 5),
  proposed_support: optionalText("Proposed support needed"),
  figma_url: optionalUrl.default(""),
  storybook_url: optionalUrl.default(""),
  open_questions: optionalText("Open questions"),
}).superRefine((value, ctx) => {
  if (!value.framework) {
    ctx.addIssue({
      code: "custom",
      path: ["framework"],
      message: "Pick a framework.",
    });
  }

  if (value.gap_type.includes("other") && value.gap_type_other.trim() === "") {
    ctx.addIssue({
      code: "custom",
      path: ["gap_type_other"],
      message: "Describe the other gap type.",
    });
  }
});

export type SubmissionInput = z.input<typeof submissionSchema>;
export type SubmissionValues = z.output<typeof submissionSchema>;

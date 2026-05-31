import { GAP_TYPE_VALUES, type GapTypeValue } from "@/lib/constants/gap-types";
import type { Submission } from "@/lib/types";
import type { SubmissionInput } from "@/lib/validators/submission";

export const defaultSubmissionValues: SubmissionInput = {
  title: "",
  team: "",
  component_name: "",
  framework: undefined as unknown as SubmissionInput["framework"],
  gap_type: [],
  gap_type_other: "",
  frequency_impact: undefined as unknown as SubmissionInput["frequency_impact"],
  problem_description: "",
  use_case: "",
  proposed_support: "",
  figma_url: "",
  storybook_url: "",
  open_questions: "",
};

export function serializeGapTypes(values: GapTypeValue[], otherText: string) {
  return values
    .map((value) =>
      value === "other" && otherText.trim()
        ? `other:${otherText.trim()}`
        : value,
    )
    .join("|");
}

export function parseGapTypes(value: string): Pick<
  SubmissionInput,
  "gap_type" | "gap_type_other"
> {
  const gapTypes: GapTypeValue[] = [];
  let otherText = "";

  for (const part of value.split("|")) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("other:")) {
      if (!gapTypes.includes("other")) {
        gapTypes.push("other");
      }
      otherText = trimmed.replace(/^other:/, "").trim();
      continue;
    }

    if ((GAP_TYPE_VALUES as readonly string[]).includes(trimmed)) {
      const typed = trimmed as GapTypeValue;
      if (!gapTypes.includes(typed)) {
        gapTypes.push(typed);
      }
    }
  }

  return {
    gap_type: gapTypes,
    gap_type_other: otherText,
  };
}

export function submissionToFormValues(
  submission: Pick<
    Submission,
    | "title"
    | "team"
    | "component_name"
    | "framework"
    | "gap_type"
    | "frequency_impact"
    | "problem_description"
    | "use_case"
    | "proposed_support"
    | "figma_url"
    | "storybook_url"
    | "open_questions"
  >,
): SubmissionInput {
  return {
    ...defaultSubmissionValues,
    ...parseGapTypes(submission.gap_type),
    title: submission.title,
    team: submission.team,
    component_name: submission.component_name,
    framework: (submission.framework ?? undefined) as
      | SubmissionInput["framework"]
      | undefined,
    frequency_impact:
      submission.frequency_impact as SubmissionInput["frequency_impact"],
    problem_description: submission.problem_description,
    use_case: submission.use_case,
    proposed_support: submission.proposed_support,
    figma_url: submission.figma_url ?? "",
    storybook_url: submission.storybook_url ?? "",
    open_questions: submission.open_questions ?? "",
  };
}

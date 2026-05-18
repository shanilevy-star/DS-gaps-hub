import type { FrequencyImpactValue } from "@/lib/constants/frequency-impact";
import type { GapTypeValue } from "@/lib/constants/gap-types";

export type SubmissionImage = {
  id: string;
  submission_id: string;
  storage_path: string;
  caption: string | null;
  position: number;
};

export type Submission = {
  id: string;
  created_at: string;
  submitted_by: string | null;
  submitter_email: string | null;
  team: string;
  component_name: string;
  title: string;
  problem_description: string;
  use_case: string;
  why_insufficient: string;
  proposed_support: string;
  gap_type: GapTypeValue;
  frequency_impact: FrequencyImpactValue;
  figma_url: string | null;
  storybook_url: string | null;
  open_questions: string | null;
};

export type SubmissionWithImages = Submission & {
  images: SubmissionImage[];
};

export type SubmissionWithImageUrls = Submission & {
  images: (SubmissionImage & { url: string })[];
};

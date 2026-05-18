// Shape of every AI analysis run, whether fixture-generated or LLM-generated.
// The dashboard depends on this contract - if you change it, update both the
// fixture generator and the live prompt response schema together.

export type DataSufficiency = "low" | "medium" | "high";

export type GapClassification =
  | "true_component_gap"
  | "missing_variant_or_state"
  | "documentation_or_guidance"
  | "one_off_product_need";

export type ImpactSignal = "low" | "medium" | "high";

export type SuggestedAction =
  | "new_variant"
  | "new_state"
  | "new_component"
  | "docs_update"
  | "needs_discovery";

export type Confidence = "low" | "medium" | "high";

export type AnalysisGroup = {
  id: string;
  title: string;
  submission_ids: string[];
  rationale: string;
  gap_classification: GapClassification;
  cross_team: boolean;
  impact_signal: ImpactSignal;
};

export type AnalysisRecommendation = {
  id: string;
  title: string;
  rationale: string;
  suggested_action: SuggestedAction;
  confidence: Confidence;
  related_group_ids: string[];
};

export type AnalysisOutput = {
  overall_summary: string;
  data_sufficiency: DataSufficiency;
  data_sufficiency_note: string;
  groups: AnalysisGroup[];
  recommendations: AnalysisRecommendation[];
  most_requested_components: Array<{ component: string; count: number }>;
  most_common_gap_types: Array<{ gap_type: string; count: number }>;
};

export type AnalysisRunMeta = {
  id: string;
  created_at: string;
  input_count: number;
  mode: "fixtures" | "live";
};

export type AnalysisRun = AnalysisRunMeta & {
  payload: AnalysisOutput;
};

export const SUFFICIENCY_THRESHOLDS = {
  low: 0,
  medium: 5,
  high: 12,
} as const;

export function classifySufficiency(count: number): DataSufficiency {
  if (count >= SUFFICIENCY_THRESHOLDS.high) return "high";
  if (count >= SUFFICIENCY_THRESHOLDS.medium) return "medium";
  return "low";
}

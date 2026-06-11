import { generateFixtureAnalysis } from "./fixtures";
import { runLiveAnalysis } from "./live";
import type { AnalysisOutput } from "./types";
import type { Submission } from "@/lib/types";

export type AnalyzeMode = "fixtures" | "live";

type SubmissionLite = Pick<
  Submission,
  | "id"
  | "title"
  | "component_name"
  | "team"
  | "gap_type"
  | "frequency_impact"
  | "is_blocking"
  | "submitter_email"
  | "problem_description"
  | "use_case"
  | "why_insufficient"
  | "proposed_support"
  | "created_at"
>;

export function resolveAnalyzeMode(): AnalyzeMode {
  const flag = process.env.USE_AI_FIXTURES?.toLowerCase();
  return flag === "true" ? "fixtures" : "live";
}

export async function analyze(
  submissions: SubmissionLite[],
): Promise<{ payload: AnalysisOutput; mode: AnalyzeMode }> {
  const mode = resolveAnalyzeMode();
  if (mode === "fixtures") {
    return {
      payload: generateFixtureAnalysis(submissions),
      mode: "fixtures",
    };
  }

  const payload = await runLiveAnalysis(submissions);
  return {
    payload,
    mode: "live",
  };
}

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
  | "submitter_email"
  | "problem_description"
  | "use_case"
  | "why_insufficient"
  | "proposed_support"
  | "created_at"
>;

export function resolveAnalyzeMode(): AnalyzeMode {
  const flag = process.env.USE_AI_FIXTURES?.toLowerCase();
  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  if (flag === "false" && hasKey) return "live";
  return "fixtures";
}

export async function analyze(
  submissions: SubmissionLite[],
): Promise<{ payload: AnalysisOutput; mode: AnalyzeMode }> {
  const mode = resolveAnalyzeMode();
  if (mode === "live") {
    try {
      const payload = await runLiveAnalysis(submissions);
      return { payload, mode: "live" };
    } catch (error) {
      console.error("Live analysis failed, falling back to fixtures.", error);
      return {
        payload: generateFixtureAnalysis(submissions),
        mode: "fixtures",
      };
    }
  }
  return {
    payload: generateFixtureAnalysis(submissions),
    mode: "fixtures",
  };
}

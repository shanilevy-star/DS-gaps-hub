// Live OpenAI-backed analysis. Returns a structured AnalysisOutput by
// constraining the model with a JSON schema. If anything goes wrong - missing
// key, network error, schema violation - the caller (lib/ai/analyze.ts)
// catches and falls back to fixtures.

import OpenAI from "openai";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompt";
import type { AnalysisOutput } from "./types";
import type { Submission } from "@/lib/types";

type SubmissionLite = Pick<
  Submission,
  | "id"
  | "title"
  | "component_name"
  | "team"
  | "gap_type"
  | "frequency_impact"
  | "problem_description"
  | "use_case"
  | "why_insufficient"
  | "proposed_support"
>;

const DEFAULT_MODEL = "gpt-4o-mini";
const TIMEOUT_MS = 60_000;

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "overall_summary",
    "data_sufficiency",
    "data_sufficiency_note",
    "groups",
    "recommendations",
    "most_requested_components",
    "most_common_gap_types",
  ],
  properties: {
    overall_summary: { type: "string" },
    data_sufficiency: { type: "string", enum: ["low", "medium", "high"] },
    data_sufficiency_note: { type: "string" },
    groups: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "title",
          "submission_ids",
          "rationale",
          "gap_classification",
          "cross_team",
          "impact_signal",
        ],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          submission_ids: {
            type: "array",
            items: { type: "string" },
          },
          rationale: { type: "string" },
          gap_classification: {
            type: "string",
            enum: [
              "true_component_gap",
              "missing_variant_or_state",
              "documentation_or_guidance",
              "one_off_product_need",
            ],
          },
          cross_team: { type: "boolean" },
          impact_signal: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
        },
      },
    },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "title",
          "rationale",
          "suggested_action",
          "confidence",
          "related_group_ids",
        ],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          rationale: { type: "string" },
          suggested_action: {
            type: "string",
            enum: [
              "new_variant",
              "new_state",
              "new_component",
              "docs_update",
              "needs_discovery",
            ],
          },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
          related_group_ids: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
    most_requested_components: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["component", "count"],
        properties: {
          component: { type: "string" },
          count: { type: "integer" },
        },
      },
    },
    most_common_gap_types: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["gap_type", "count"],
        properties: {
          gap_type: { type: "string" },
          count: { type: "integer" },
        },
      },
    },
  },
} as const;

export async function runLiveAnalysis(
  submissions: SubmissionLite[],
): Promise<AnalysisOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const client = new OpenAI({ apiKey, timeout: TIMEOUT_MS });

  const promptInputs = submissions.map((s) => ({
    id: s.id,
    team: s.team,
    component_name: s.component_name,
    title: s.title,
    gap_type: s.gap_type,
    frequency_impact: s.frequency_impact,
    problem_description: s.problem_description,
    use_case: s.use_case,
    why_insufficient: s.why_insufficient,
    proposed_support: s.proposed_support,
  }));

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(promptInputs) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ds_gap_analysis",
        strict: true,
        schema: RESPONSE_SCHEMA,
      },
    },
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Live analysis returned an empty response.");
  }

  let parsed: AnalysisOutput;
  try {
    parsed = JSON.parse(content) as AnalysisOutput;
  } catch (err) {
    throw new Error(
      `Live analysis returned invalid JSON: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  // Defensive trim - the model can occasionally invent submission IDs.
  const validIds = new Set(submissions.map((s) => s.id));
  parsed.groups = parsed.groups.map((group) => ({
    ...group,
    submission_ids: group.submission_ids.filter((id) => validIds.has(id)),
  }));

  return parsed;
}

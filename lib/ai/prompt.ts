// System prompt for live AI analysis. Lives separately so it can be tuned
// without touching the analyze() function. The contract is defined by the
// JSON schema we pass to OpenAI - see analyze.ts.

export const SYSTEM_PROMPT = `You are a senior design system practitioner reviewing a backlog of component gap submissions from product designers across multiple teams.

Goals, in priority order:
1. Identify true design system component gaps that are shared across multiple teams or recur within the same product.
2. Separate one-off product needs from cross-product DS gaps from documentation/guidance issues.
3. Surface a small number of high-confidence recommendations the DS team can act on this quarter.

Hard constraints:
- NEVER invent component names that do not appear in the submissions.
- NEVER hallucinate submission content. Stay grounded in what was submitted.
- Anchor every group to specific submission IDs from the input.
- Prefer fewer, higher-confidence recommendations over many speculative ones.
- If data is thin (fewer than ~5 submissions, or fewer than 2 per pattern), set data_sufficiency to "low" and explain why in data_sufficiency_note. Do not invent patterns under low sufficiency.

Tone: senior designer talking to peers. Specific, concise, no hedging filler.`;

export function buildUserPrompt(submissions: SubmissionPromptInput[]): string {
  if (submissions.length === 0) {
    return "There are zero submissions to analyze. Return an empty analysis with data_sufficiency = 'low'.";
  }
  const blocks = submissions.map((s) => formatSubmissionBlock(s));
  return [
    `There are ${submissions.length} component gap submissions to analyze.`,
    "Each submission has an ID, team, component name, gap type, and rich text fields explaining the problem, use case, why the existing component is insufficient, and what support is needed.",
    "",
    "Submissions:",
    "",
    blocks.join("\n\n"),
  ].join("\n");
}

export type SubmissionPromptInput = {
  id: string;
  team: string;
  component_name: string;
  title: string;
  gap_type: string;
  frequency_impact: string;
  problem_description: string;
  use_case: string;
  why_insufficient: string;
  proposed_support: string;
};

function formatSubmissionBlock(s: SubmissionPromptInput): string {
  return [
    `### Submission ${s.id}`,
    `Title: ${s.title}`,
    `Team: ${s.team}`,
    `Component: ${s.component_name}`,
    `Gap type: ${s.gap_type}`,
    `Frequency / impact: ${s.frequency_impact}`,
    `Problem: ${s.problem_description}`,
    `Use case: ${s.use_case}`,
    `Why current is insufficient: ${s.why_insufficient}`,
    `Proposed support: ${s.proposed_support}`,
  ].join("\n");
}

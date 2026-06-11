import { NextResponse } from "next/server";
import { analyze } from "@/lib/ai/analyze";
import type { AnalysisRun } from "@/lib/ai/types";
import { filterRealSubmissions } from "@/lib/submissions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Submission } from "@/lib/types";
import type { Json } from "@/lib/supabase/database.types";

export const runtime = "nodejs";

export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: submissions, error: fetchError } = await supabase
    .from("submissions")
    .select(
      "id, title, component_name, team, gap_type, frequency_impact, is_blocking, submitter_email, problem_description, use_case, why_insufficient, proposed_support, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const lite = filterRealSubmissions((submissions ?? []) as Array<
    Pick<
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
    >
  >);

  if (lite.length === 0) {
    return NextResponse.json(
      { error: "Add at least one submission before running analysis." },
      { status: 400 },
    );
  }

  let analysisResult: Awaited<ReturnType<typeof analyze>>;
  try {
    analysisResult = await analyze(lite);
  } catch (error) {
    console.error("AI analysis failed.", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `AI analysis failed: ${error.message}`
            : "AI analysis failed.",
      },
      { status: 502 },
    );
  }

  const { payload, mode } = analysisResult;

  const { data: inserted, error: insertError } = await supabase
    .from("analysis_runs")
    .insert({
      triggered_by: userData.user.id,
      input_count: lite.length,
      payload: payload as unknown as Json,
      mode,
    })
    .select("id, created_at, input_count, mode")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: insertError?.message ?? "Could not save analysis run." },
      { status: 500 },
    );
  }

  const run: AnalysisRun = {
    id: inserted.id,
    created_at: inserted.created_at,
    input_count: inserted.input_count,
    mode: inserted.mode as "fixtures" | "live",
    payload,
  };

  return NextResponse.json({ run });
}

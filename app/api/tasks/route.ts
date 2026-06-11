import { NextResponse } from "next/server";
import { isAiPriority, toActionableTaskTitle } from "@/lib/tasks";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type CreateTaskBody = {
  sourceAnalysisRunId?: unknown;
  sourceRecommendationId?: unknown;
  title?: unknown;
  rationale?: unknown;
  priority?: unknown;
  relatedGroupIds?: unknown;
};

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const analysisRunId = searchParams.get("analysisRunId");
  if (!analysisRunId) {
    return NextResponse.json(
      { error: "analysisRunId is required." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("id, source_recommendation_id, status")
    .eq("source_analysis_run_id", analysisRunId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: data ?? [] });
}

export async function POST(request: Request) {
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

  let body: CreateTaskBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const sourceAnalysisRunId = readRequiredString(body.sourceAnalysisRunId);
  const sourceRecommendationId = readRequiredString(body.sourceRecommendationId);
  const title = readRequiredString(body.title);
  const rationale = readRequiredString(body.rationale);
  const priority = body.priority;
  const relatedGroupIds = Array.isArray(body.relatedGroupIds)
    ? body.relatedGroupIds.filter((id): id is string => typeof id === "string")
    : [];

  if (
    !sourceAnalysisRunId ||
    !sourceRecommendationId ||
    !title ||
    !rationale ||
    !isAiPriority(priority)
  ) {
    return NextResponse.json(
      { error: "Missing or invalid task fields." },
      { status: 400 },
    );
  }

  const taskTitle = toActionableTaskTitle(title, rationale);
  const { data: inserted, error: insertError } = await supabase
    .from("tasks")
    .insert({
      created_by: userData.user.id,
      source_analysis_run_id: sourceAnalysisRunId,
      source_recommendation_id: sourceRecommendationId,
      title: taskTitle,
      rationale,
      priority,
      related_group_ids: relatedGroupIds,
      status: "open",
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: existing, error: existingError } = await supabase
        .from("tasks")
        .select()
        .eq("source_analysis_run_id", sourceAnalysisRunId)
        .eq("source_recommendation_id", sourceRecommendationId)
        .maybeSingle();

      if (existingError || !existing) {
        return NextResponse.json(
          { error: existingError?.message ?? "Task already exists." },
          { status: 409 },
        );
      }

      return NextResponse.json({ task: existing, duplicate: true });
    }

    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ task: inserted, duplicate: false }, { status: 201 });
}

function readRequiredString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

import { NextResponse } from "next/server";
import { isTaskStatus, type TaskStatus } from "@/lib/tasks";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type UpdateTaskBody = {
  title?: unknown;
  status?: unknown;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;
  let body: UpdateTaskBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const updates: { title?: string; status?: TaskStatus } = {};
  if (body.title !== undefined) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json(
        { error: "Task title cannot be empty." },
        { status: 400 },
      );
    }
    updates.title = title;
  }

  if (body.status !== undefined) {
    const status = readStatus(body.status);
    if (!status) {
      return NextResponse.json(
        { error: "Invalid task status." },
        { status: 400 },
      );
    }
    updates.status = status;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No supported task fields provided." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task: data });
}

function readStatus(value: unknown) {
  return isTaskStatus(value) ? value : null;
}

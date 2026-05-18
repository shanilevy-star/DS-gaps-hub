import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { SubmissionImage } from "@/lib/types";

const BUCKET = "submission-images";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

export async function signImageUrls(
  client: SupabaseClient<Database>,
  images: SubmissionImage[],
): Promise<(SubmissionImage & { url: string })[]> {
  if (images.length === 0) return [];
  const paths = images.map((image) => image.storage_path);
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error || !data) {
    return images.map((image) => ({ ...image, url: "" }));
  }
  return images.map((image, index) => ({
    ...image,
    url: data[index]?.signedUrl ?? "",
  }));
}

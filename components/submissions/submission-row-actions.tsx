"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SubmissionRowActions({
  submissionId,
  title,
}: {
  submissionId: string;
  title: string;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        throw new Error("Sign in to delete submissions.");
      }

      const { data: submission, error: submissionError } = await supabase
        .from("submissions")
        .select("submitted_by")
        .eq("id", submissionId)
        .maybeSingle();

      if (submissionError || !submission) {
        throw new Error(submissionError?.message ?? "Submission not found.");
      }
      if (submission.submitted_by !== user.id) {
        throw new Error("You can only delete your own submissions.");
      }

      const { data: images, error: imagesError } = await supabase
        .from("submission_images")
        .select("storage_path")
        .eq("submission_id", submissionId);
      if (imagesError) {
        throw imagesError;
      }

      const imagePaths = (images ?? []).map((image) => image.storage_path);
      if (imagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("submission-images")
          .remove(imagePaths);
        if (storageError) {
          throw storageError;
        }
      }

      const { error: deleteError } = await supabase
        .from("submissions")
        .delete()
        .eq("id", submissionId)
        .eq("submitted_by", user.id);
      if (deleteError) {
        throw deleteError;
      }

      setConfirmOpen(false);
      router.refresh();
      toast.success("Submission deleted.");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Could not delete submission.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${title}`}
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onSelect={() => router.push(`/submissions/${submissionId}/edit`)}
          >
            Edit submission
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={(event) => {
              event.preventDefault();
              setConfirmOpen(true);
            }}
          >
            Delete submission
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete submission?</DialogTitle>
            <DialogDescription>
              This will permanently delete &ldquo;{title}&rdquo; and any attached
              screenshot records. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={deleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "Deleting..." : "Delete submission"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

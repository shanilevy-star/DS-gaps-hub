import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="space-y-6">
      <EmptyState
        title="Submission not found"
        description="It may have been deleted, or the link is incorrect."
        action={
          <Button asChild size="sm">
            <Link href="/submissions">Back to submissions</Link>
          </Button>
        }
      />
    </div>
  );
}

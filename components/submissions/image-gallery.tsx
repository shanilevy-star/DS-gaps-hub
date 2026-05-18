"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SubmissionWithImageUrls } from "@/lib/types";

export function ImageGallery({
  images,
}: {
  images: SubmissionWithImageUrls["images"];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (images.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No screenshots were attached.
      </p>
    );
  }

  const open = openIndex !== null ? images[openIndex] : null;

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image, index) => (
          <li key={image.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group flex w-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="block aspect-video w-full bg-muted">
                {image.url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={image.url}
                    alt={image.caption ?? `Screenshot ${index + 1}`}
                    className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    Image unavailable
                  </span>
                )}
              </span>
              {image.caption ? (
                <span className="block px-3 py-2 text-left text-xs text-muted-foreground">
                  {image.caption}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      <Dialog
        open={openIndex !== null}
        onOpenChange={(value) => {
          if (!value) setOpenIndex(null);
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogTitle className="sr-only">
            {open?.caption ?? "Screenshot"}
          </DialogTitle>
          {open ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-md bg-muted">
                {open.url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={open.url}
                    alt={open.caption ?? "Screenshot"}
                    className="max-h-[70vh] w-full object-contain"
                  />
                ) : (
                  <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                    Image unavailable
                  </p>
                )}
              </div>
              {open.caption ? (
                <p className="text-sm text-muted-foreground">{open.caption}</p>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

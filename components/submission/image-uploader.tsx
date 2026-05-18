"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Trash2, UploadCloud, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { isImageFile } from "@/lib/image-resize";

export type StagedImage = {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
};

const MAX_IMAGES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB; will be resized client-side before upload

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export function ImageUploader({
  images,
  onChange,
  disabled,
}: {
  images: StagedImage[];
  onChange: (next: StagedImage[]) => void;
  disabled?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function appendFiles(fileList: FileList | File[]) {
    setError(null);
    const incoming = Array.from(fileList);

    if (incoming.length === 0) return;

    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setError(`Max ${MAX_IMAGES} images per submission.`);
      return;
    }

    const accepted: StagedImage[] = [];
    const messages: string[] = [];
    for (const file of incoming.slice(0, room)) {
      if (!isImageFile(file)) {
        messages.push(`${file.name} is not an image.`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        messages.push(`${file.name} is larger than 10MB.`);
        continue;
      }
      accepted.push({
        id: makeId(),
        file,
        previewUrl: URL.createObjectURL(file),
        caption: "",
      });
    }

    if (incoming.length > room) {
      messages.push(`Only the first ${room} added (max ${MAX_IMAGES} total).`);
    }
    if (messages.length > 0) setError(messages.join(" "));

    if (accepted.length > 0) {
      onChange([...images, ...accepted]);
    }
  }

  function handleRemove(id: string) {
    const target = images.find((image) => image.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(images.filter((image) => image.id !== id));
  }

  function handleCaption(id: string, caption: string) {
    onChange(
      images.map((image) => (image.id === id ? { ...image, caption } : image)),
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (disabled) return;
          if (event.dataTransfer.files.length > 0) {
            appendFiles(event.dataTransfer.files);
          }
        }}
        className={cn(
          "flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-8 text-center transition-colors",
          isDragging && "border-foreground/40 bg-muted",
          disabled && "opacity-60",
        )}
      >
        <UploadCloud className="size-6 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <p className="text-sm font-medium">
            Drop screenshots here or browse
          </p>
          <p className="text-xs text-muted-foreground">
            Up to {MAX_IMAGES} images, PNG or JPG, 10 MB each. We&apos;ll resize
            them before upload.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || images.length >= MAX_IMAGES}
        >
          Choose files
        </Button>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) appendFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {images.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {images.map((image, index) => (
            <li
              key={image.id}
              className="overflow-hidden rounded-lg border border-border bg-card"
            >
              <div className="relative aspect-video bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.previewUrl}
                  alt={`Screenshot ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-2 p-3">
                <div className="flex items-center justify-between gap-2">
                  <Label
                    htmlFor={`${inputId}-caption-${image.id}`}
                    className="flex items-center gap-1.5 text-xs font-medium"
                  >
                    <ImageIcon className="size-3.5" aria-hidden />
                    Image {index + 1}
                  </Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(image.id)}
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                </div>
                <Input
                  id={`${inputId}-caption-${image.id}`}
                  placeholder="Optional caption"
                  value={image.caption}
                  onChange={(event) =>
                    handleCaption(image.id, event.target.value)
                  }
                  maxLength={140}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

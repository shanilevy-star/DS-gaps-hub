"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FreeCombobox } from "@/components/submission/free-combobox";
import { MultiSelectDropdown } from "@/components/submission/multi-select-dropdown";
import { SingleSelectDropdown } from "@/components/submission/single-select-dropdown";
import {
  FieldError,
  FieldHelp,
  FieldRow,
  FormSection,
} from "@/components/submission/section";
import {
  ImageUploader,
  type StagedImage,
} from "@/components/submission/image-uploader";
import { KNOWN_COMPONENTS } from "@/lib/constants/components";
import { FRAMEWORKS, serializeFrameworks } from "@/lib/constants/frameworks";
import { GAP_TYPES } from "@/lib/constants/gap-types";
import { TEAMS } from "@/lib/constants/teams";
import { resizeImage } from "@/lib/image-resize";
import {
  defaultSubmissionValues,
  serializeGapTypes,
} from "@/lib/submission-form-values";
import { createClient } from "@/lib/supabase/client";
import {
  submissionSchema,
  type SubmissionInput,
} from "@/lib/validators/submission";

type FormSuccess = {
  id: string;
  title: string;
  failedImageCount: number;
};

const FORM_FREQUENCY_IMPACT = [
  {
    value: "cross_product_need",
    label: "Cross-product need",
    description: "Needed across multiple products or teams",
  },
  {
    value: "repeated_product_need",
    label: "Repeated product need",
    description: "Needed multiple times within the same product area",
  },
  {
    value: "one_time_use_case",
    label: "One-time use case",
    description: "Specific to one screen, flow, or scenario",
  },
] as const;

export function SubmissionForm({
  user,
  mode = "create",
  initialValues,
  submissionId,
  cancelHref = "/submissions",
}: {
  user: { id: string; email: string | null };
  mode?: "create" | "edit";
  initialValues?: SubmissionInput;
  submissionId?: string;
  cancelHref?: string;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [images, setImages] = useState<StagedImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<FormSuccess | null>(null);

  const form = useForm<SubmissionInput>({
    resolver: zodResolver(submissionSchema),
    defaultValues: initialValues ?? defaultSubmissionValues,
    mode: "onBlur",
  });

  const { register, handleSubmit, control, formState, reset } = form;
  const { errors, isDirty } = formState;
  const selectedGapTypes = useWatch({ control, name: "gap_type" });

  // Warn before navigating away from a dirty form.
  useEffect(() => {
    if (!isDirty || success) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, success]);

  async function uploadImages(
    supabase: ReturnType<typeof createClient>,
    targetSubmissionId: string,
  ) {
    let failedImageCount = 0;
    let startPosition = 0;

    if (isEdit) {
      const { data: latestImage } = await supabase
        .from("submission_images")
        .select("position")
        .eq("submission_id", targetSubmissionId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();
      startPosition = (latestImage?.position ?? -1) + 1;
    }

    for (let i = 0; i < images.length; i++) {
      const staged = images[i];
      const position = startPosition + i;
      try {
        const resized = await resizeImage(staged.file);
        const path = `${user.id}/${targetSubmissionId}/${position + 1}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("submission-images")
          .upload(path, resized.blob, {
            contentType: resized.mime,
            upsert: false,
          });
        if (uploadError) throw uploadError;
        const { error: imageRowError } = await supabase
          .from("submission_images")
          .insert({
            submission_id: targetSubmissionId,
            storage_path: path,
            caption: staged.caption.trim() || null,
            position,
          });
        if (imageRowError) throw imageRowError;
      } catch (err) {
        console.error("Image upload failed", err);
        failedImageCount += 1;
      }
    }

    return failedImageCount;
  }

  async function onSubmit(input: SubmissionInput) {
    setSubmitting(true);
    try {
      const supabase = createClient();
      const submissionPayload = {
        team: input.team.trim(),
        component_name: input.component_name.trim(),
        framework: serializeFrameworks(input.framework ?? []),
        title: input.title.trim(),
        problem_description: input.problem_description.trim(),
        use_case: input.use_case.trim(),
        why_insufficient: "",
        proposed_support: input.proposed_support?.trim() ?? "",
        gap_type: serializeGapTypes(input.gap_type, input.gap_type_other ?? ""),
        frequency_impact: input.frequency_impact,
        figma_url: input.figma_url?.trim() || null,
        storybook_url: input.storybook_url?.trim() || null,
        open_questions: input.open_questions?.trim() || null,
      };

      if (isEdit) {
        if (!submissionId) {
          throw new Error("Missing submission id.");
        }

        const { data: updated, error } = await supabase
          .from("submissions")
          .update(submissionPayload)
          .eq("id", submissionId)
          .eq("submitted_by", user.id)
          .select("id, title")
          .single();

        if (error || !updated) {
          throw new Error(error?.message ?? "Could not save changes.");
        }

        const failedImageCount = await uploadImages(supabase, updated.id);
        images.forEach((staged) => URL.revokeObjectURL(staged.previewUrl));
        setImages([]);
        router.refresh();
        router.push(`/submissions/${updated.id}`);
        toast.success(
          failedImageCount > 0
            ? `Changes saved. ${failedImageCount} image${
                failedImageCount === 1 ? "" : "s"
              } failed to upload.`
            : "Changes saved.",
        );
        return;
      }

      const insertPayload = {
        submitted_by: user.id,
        submitter_email: user.email,
        ...submissionPayload,
      };

      const { data: inserted, error } = await supabase
        .from("submissions")
        .insert(insertPayload)
        .select("id, title")
        .single();

      if (error || !inserted) {
        throw new Error(error?.message ?? "Could not save submission.");
      }

      const failedImageCount = await uploadImages(supabase, inserted.id);

      images.forEach((staged) => URL.revokeObjectURL(staged.previewUrl));

      setSuccess({
        id: inserted.id,
        title: inserted.title,
        failedImageCount,
      });
      reset(defaultSubmissionValues);
      setImages([]);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Could not submit. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success && !isEdit) {
    return (
      <SuccessState
        success={success}
        onReset={() => setSuccess(null)}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-10"
      noValidate
    >
      <section className="space-y-6">
        <FieldRow>
          <Label htmlFor="title">Gap title</Label>
          <Input
            id="title"
            placeholder="e.g. Button needs a loading state with a custom label"
            {...register("title")}
            aria-invalid={Boolean(errors.title)}
          />
          <FieldHelp>
            A one-liner the DS team can scan in a list. Avoid generic phrasing.
          </FieldHelp>
          <FieldError message={errors.title?.message} />
        </FieldRow>

        <FieldRow>
          <Label htmlFor="team">Team / product area</Label>
          <Controller
            control={control}
            name="team"
            render={({ field }) => (
              <FreeCombobox
                id="team"
                value={field.value}
                onChange={field.onChange}
                options={TEAMS}
                placeholder="Pick a team"
                searchPlaceholder="Search teams or type new..."
                ariaInvalid={Boolean(errors.team)}
              />
            )}
          />
          <FieldError message={errors.team?.message} />
        </FieldRow>

        <FieldRow>
          <Label htmlFor="component_name">Component name</Label>
          <Controller
            control={control}
            name="component_name"
            render={({ field }) => (
              <FreeCombobox
                id="component_name"
                value={field.value}
                onChange={field.onChange}
                options={KNOWN_COMPONENTS}
                placeholder="Which DS component?"
                searchPlaceholder="Search or type a new component..."
                ariaInvalid={Boolean(errors.component_name)}
              />
            )}
          />
          <FieldError message={errors.component_name?.message} />
        </FieldRow>

        <FieldRow>
          <Label>
            Framework{" "}
            <span className="font-normal text-muted-foreground">(Optional)</span>
          </Label>
          <Controller
            control={control}
            name="framework"
            render={({ field }) => (
              <MultiSelectDropdown
                ariaLabel="Framework"
                options={FRAMEWORKS}
                placeholder="Select one or more"
                searchPlaceholder="Search frameworks..."
                value={field.value ?? []}
                onChange={field.onChange}
                ariaInvalid={Boolean(errors.framework)}
              />
            )}
          />
          <FieldError message={errors.framework?.message as string | undefined} />
        </FieldRow>

        <FieldRow>
          <Label>Gap type</Label>
          <Controller
            control={control}
            name="gap_type"
            render={({ field }) => (
              <MultiSelectDropdown
                ariaLabel="Gap type"
                options={GAP_TYPES}
                placeholder="Select one or more"
                value={field.value ?? []}
                onChange={field.onChange}
                ariaInvalid={Boolean(errors.gap_type)}
              />
            )}
          />
          <FieldError message={errors.gap_type?.message as string | undefined} />
        </FieldRow>

        {selectedGapTypes?.includes("other") ? (
          <FieldRow>
            <Label htmlFor="gap_type_other">Other gap type</Label>
            <Input
              id="gap_type_other"
              placeholder="Briefly specify the gap type"
              {...register("gap_type_other")}
              aria-invalid={Boolean(errors.gap_type_other)}
            />
            <FieldError message={errors.gap_type_other?.message} />
          </FieldRow>
        ) : null}

        <FieldRow>
          <Label>Frequency / impact</Label>
          <Controller
            control={control}
            name="frequency_impact"
            render={({ field }) => (
              <SingleSelectDropdown
                ariaLabel="Frequency / impact"
                options={FORM_FREQUENCY_IMPACT}
                placeholder="Select impact"
                value={field.value}
                onChange={field.onChange}
                ariaInvalid={Boolean(errors.frequency_impact)}
              />
            )}
          />
          <FieldError
            message={errors.frequency_impact?.message as string | undefined}
          />
        </FieldRow>

        <FieldRow>
          <Label htmlFor="problem_description">Problem description</Label>
          <Textarea
            id="problem_description"
            rows={4}
            placeholder="Describe what is missing, broken, or unsupported in the current component."
            {...register("problem_description")}
            aria-invalid={Boolean(errors.problem_description)}
          />
          <FieldHelp>
            Explain the issue clearly and what is not supported in the current
            Storybook component.
          </FieldHelp>
          <FieldError message={errors.problem_description?.message} />
        </FieldRow>

        <FieldRow>
          <Label htmlFor="use_case">Where is this needed?</Label>
          <Textarea
            id="use_case"
            rows={3}
            placeholder="Which screen, workflow, or user flow requires this component behavior?"
            {...register("use_case")}
            aria-invalid={Boolean(errors.use_case)}
          />
          <FieldHelp>
            Help the DS team understand where this gap appears in the product.
          </FieldHelp>
          <FieldError message={errors.use_case?.message} />
        </FieldRow>

        <FieldRow>
          <Label htmlFor="proposed_support">
            Proposed support needed (optional)
          </Label>
          <Textarea
            id="proposed_support"
            rows={3}
            placeholder="What would unblock you? A variant, a state, a token, a new component, clearer docs?"
            {...register("proposed_support")}
            aria-invalid={Boolean(errors.proposed_support)}
          />
          <FieldHelp>
            A starting point, not a final spec. The DS team will refine.
          </FieldHelp>
          <FieldError message={errors.proposed_support?.message} />
        </FieldRow>

        <FieldRow>
          <Label>
            {isEdit ? "Add screenshots / references" : "Screenshots / references"}
          </Label>
          {isEdit ? (
            <FieldHelp>
              Existing screenshots stay attached. Add new references here only
              if they help explain the update.
            </FieldHelp>
          ) : null}
          <ImageUploader
            images={images}
            onChange={setImages}
            disabled={submitting}
          />
        </FieldRow>
      </section>

      <FormSection
        title="Helpful but optional"
        description="If you have these handy, they make triage faster. Otherwise skip."
      >
        <div className="space-y-5">
          <FieldRow>
            <Label htmlFor="figma_url">Figma link (optional)</Label>
            <Input
              id="figma_url"
              type="url"
              placeholder="https://www.figma.com/..."
              {...register("figma_url")}
              aria-invalid={Boolean(errors.figma_url)}
            />
            <FieldError message={errors.figma_url?.message} />
          </FieldRow>
          <FieldRow>
            <Label htmlFor="storybook_url">Storybook link (optional)</Label>
            <Input
              id="storybook_url"
              type="url"
              placeholder="https://storybook.../..."
              {...register("storybook_url")}
              aria-invalid={Boolean(errors.storybook_url)}
            />
            <FieldError message={errors.storybook_url?.message} />
          </FieldRow>
        </div>
        <FieldRow>
          <Label htmlFor="open_questions">
            Open questions / considerations (optional)
          </Label>
          <Textarea
            id="open_questions"
            rows={3}
            placeholder="Anything you're unsure about, edge cases worth flagging, or constraints to keep in mind."
            {...register("open_questions")}
          />
          <FieldError message={errors.open_questions?.message} />
        </FieldRow>
      </FormSection>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/95 shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.06)] backdrop-blur supports-[backdrop-filter]:bg-background/80 dark:shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.3)]">
        <div className="mx-auto flex h-14 w-[calc(100%-2rem)] max-w-xl items-center justify-between gap-4 sm:w-[calc(100%-3rem)]">
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            {isEdit ? "Editing as" : "Submitting as"}{" "}
            <span className="font-medium text-foreground">
              {user.email ?? "you"}
            </span>
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={cancelHref}>Cancel</Link>
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting
                ? isEdit
                  ? "Saving..."
                  : "Submitting..."
                : isEdit
                  ? "Save changes"
                  : "Submit gap"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function SuccessState({
  success,
  onReset,
}: {
  success: FormSuccess;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-emerald-300/60 bg-emerald-50 p-6 dark:border-emerald-400/30 dark:bg-emerald-400/5">
        <h2 className="text-base font-medium text-emerald-900 dark:text-emerald-200">
          Thanks - your gap is in.
        </h2>
        <p className="mt-1 text-sm text-emerald-900/80 dark:text-emerald-200/80">
          &ldquo;{success.title}&rdquo; was saved. The DS team will pick it up in
          the dashboard.
        </p>
        {success.failedImageCount > 0 ? (
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            {success.failedImageCount} image
            {success.failedImageCount === 1 ? "" : "s"} failed to upload. You
            can edit this submission from the submissions list.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={`/submissions/${success.id}`}>View your submission</Link>
          </Button>
          <Button size="sm" variant="outline" onClick={onReset}>
            Submit another
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Made a mistake? Use the submissions list actions to edit this gap.
      </p>
    </div>
  );
}

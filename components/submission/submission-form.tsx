"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChipGroup } from "@/components/submission/chip-group";
import { FreeCombobox } from "@/components/submission/free-combobox";
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
import { FREQUENCY_IMPACT } from "@/lib/constants/frequency-impact";
import { GAP_TYPES } from "@/lib/constants/gap-types";
import { TEAMS } from "@/lib/constants/teams";
import { resizeImage } from "@/lib/image-resize";
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

const defaultValues: SubmissionInput = {
  title: "",
  team: "",
  component_name: "",
  gap_type: undefined as unknown as SubmissionInput["gap_type"],
  frequency_impact: undefined as unknown as SubmissionInput["frequency_impact"],
  problem_description: "",
  use_case: "",
  why_insufficient: "",
  proposed_support: "",
  figma_url: "",
  storybook_url: "",
  open_questions: "",
};

export function SubmissionForm({
  user,
}: {
  user: { id: string; email: string | null };
}) {
  const router = useRouter();
  const [images, setImages] = useState<StagedImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<FormSuccess | null>(null);

  const form = useForm<SubmissionInput>({
    resolver: zodResolver(submissionSchema),
    defaultValues,
    mode: "onBlur",
  });

  const { register, handleSubmit, control, formState, reset, watch } = form;
  const { errors, isDirty } = formState;

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

  async function onSubmit(input: SubmissionInput) {
    setSubmitting(true);
    try {
      const supabase = createClient();
      const insertPayload = {
        submitted_by: user.id,
        submitter_email: user.email,
        team: input.team.trim(),
        component_name: input.component_name.trim(),
        title: input.title.trim(),
        problem_description: input.problem_description.trim(),
        use_case: input.use_case.trim(),
        why_insufficient: input.why_insufficient.trim(),
        proposed_support: input.proposed_support.trim(),
        gap_type: input.gap_type,
        frequency_impact: input.frequency_impact,
        figma_url: input.figma_url?.trim() || null,
        storybook_url: input.storybook_url?.trim() || null,
        open_questions: input.open_questions?.trim() || null,
      };

      const { data: inserted, error } = await supabase
        .from("submissions")
        .insert(insertPayload)
        .select("id, title")
        .single();

      if (error || !inserted) {
        throw new Error(error?.message ?? "Could not save submission.");
      }

      let failedImageCount = 0;
      for (let i = 0; i < images.length; i++) {
        const staged = images[i];
        try {
          const resized = await resizeImage(staged.file);
          const path = `${user.id}/${inserted.id}/${i + 1}.jpg`;
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
              submission_id: inserted.id,
              storage_path: path,
              caption: staged.caption.trim() || null,
              position: i,
            });
          if (imageRowError) throw imageRowError;
        } catch (err) {
          console.error("Image upload failed", err);
          failedImageCount += 1;
        }
      }

      images.forEach((staged) => URL.revokeObjectURL(staged.previewUrl));

      setSuccess({
        id: inserted.id,
        title: inserted.title,
        failedImageCount,
      });
      reset(defaultValues);
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

  if (success) {
    return (
      <SuccessState
        success={success}
        onReset={() => setSuccess(null)}
      />
    );
  }

  const componentValue = watch("component_name") ?? "";
  const teamValue = watch("team") ?? "";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-12"
      noValidate
    >
      <CallOut />

      <FormSection
        title="Required to submit"
        description="The essentials. Be specific - vague submissions get lost in the noise."
      >
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

        <div className="grid gap-5 sm:grid-cols-2">
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
            <FieldHelp>
              Your team or product area. If yours isn&apos;t listed, type it.
            </FieldHelp>
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
            <FieldHelp>
              Use existing names when possible. Consistent naming is what makes
              the dashboard&apos;s cross-team grouping useful.
            </FieldHelp>
            <FieldError message={errors.component_name?.message} />
          </FieldRow>
        </div>

        <FieldRow>
          <Label>Gap type</Label>
          <Controller
            control={control}
            name="gap_type"
            render={({ field }) => (
              <ChipGroup
                name="gap_type"
                ariaLabel="Gap type"
                options={GAP_TYPES.map((g) => ({
                  value: g.value,
                  label: g.label,
                  description: g.description,
                }))}
                value={field.value}
                onChange={(next) =>
                  field.onChange(next as SubmissionInput["gap_type"])
                }
              />
            )}
          />
          <FieldError message={errors.gap_type?.message as string | undefined} />
        </FieldRow>

        <FieldRow>
          <Label>Frequency / impact</Label>
          <Controller
            control={control}
            name="frequency_impact"
            render={({ field }) => (
              <ChipGroup
                name="frequency_impact"
                ariaLabel="Frequency or impact"
                options={FREQUENCY_IMPACT.map((f) => ({
                  value: f.value,
                  label: f.label,
                  description: f.description,
                }))}
                value={field.value}
                onChange={(next) =>
                  field.onChange(
                    next as SubmissionInput["frequency_impact"],
                  )
                }
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
            placeholder="What is missing or broken? Keep it specific."
            {...register("problem_description")}
            aria-invalid={Boolean(errors.problem_description)}
          />
          <FieldHelp>
            Example: &ldquo;Our Button has no loading state, so async actions
            either jump to disabled or leave the label unchanged - users keep
            double-clicking.&rdquo;
          </FieldHelp>
          <FieldError message={errors.problem_description?.message} />
        </FieldRow>

        <FieldRow>
          <Label htmlFor="use_case">Use case</Label>
          <Textarea
            id="use_case"
            rows={3}
            placeholder="Where do you need this? Which screen or flow?"
            {...register("use_case")}
            aria-invalid={Boolean(errors.use_case)}
          />
          <FieldHelp>
            Where this matters. Naming the surface helps the DS team see
            cross-product patterns.
          </FieldHelp>
          <FieldError message={errors.use_case?.message} />
        </FieldRow>

        <FieldRow>
          <Label htmlFor="why_insufficient">
            Why the current component is insufficient
          </Label>
          <Textarea
            id="why_insufficient"
            rows={3}
            placeholder="What did you try? Why didn't it work?"
            {...register("why_insufficient")}
            aria-invalid={Boolean(errors.why_insufficient)}
          />
          <FieldHelp>
            If you tried a workaround, mention it. This is the strongest signal
            for whether a new variant or new component is needed.
          </FieldHelp>
          <FieldError message={errors.why_insufficient?.message} />
        </FieldRow>

        <FieldRow>
          <Label htmlFor="proposed_support">Proposed support needed</Label>
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
          <Label>Screenshots / references</Label>
          <ImageUploader
            images={images}
            onChange={setImages}
            disabled={submitting}
          />
          <FieldHelp>
            One annotated screenshot beats three raw ones. Captions appear next
            to each image on the submission detail page.
          </FieldHelp>
        </FieldRow>
      </FormSection>

      <FormSection
        title="Helpful but optional"
        description="If you have these handy, they make triage faster. Otherwise skip."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FieldRow>
            <Label htmlFor="figma_url">Figma link</Label>
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
            <Label htmlFor="storybook_url">Storybook link</Label>
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
          <Label htmlFor="open_questions">Open questions / considerations</Label>
          <Textarea
            id="open_questions"
            rows={3}
            placeholder="Anything you're unsure about, edge cases worth flagging, or constraints to keep in mind."
            {...register("open_questions")}
          />
          <FieldError message={errors.open_questions?.message} />
        </FieldRow>
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="text-xs text-muted-foreground">
          {teamValue && componentValue ? (
            <span>
              Submitting as <span className="font-medium text-foreground">{user.email}</span>{" "}
              for <span className="font-medium text-foreground">{componentValue}</span> in{" "}
              <span className="font-medium text-foreground">{teamValue}</span>.
            </span>
          ) : (
            <span>Submitting as {user.email}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" asChild>
            <Link href="/submissions">Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit gap"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function CallOut() {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
      <p className="font-medium">What happens next</p>
      <p className="mt-1 text-muted-foreground">
        The DS team uses these submissions to find repeated needs across teams.
        The more specific your problem, use case, and proposed support, the more
        useful the AI dashboard becomes for everyone.
      </p>
    </div>
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
            can still submit a follow-up - editing existing submissions is
            coming later.
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
        Made a mistake? Submit a follow-up - editing isn&apos;t available in
        this prototype.
      </p>
    </div>
  );
}

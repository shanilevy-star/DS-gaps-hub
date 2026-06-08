export const BLOCKING_OPTIONS = [
  {
    value: "yes",
    label: "Yes",
    description: "This gap is blocking a project, feature, or release.",
  },
  {
    value: "no",
    label: "No",
    description: "This gap is not currently blocking delivery.",
  },
] as const;

export type BlockingValue = (typeof BLOCKING_OPTIONS)[number]["value"];

export const AI_PRIORITY_VALUES = ["low", "medium", "high", "critical"] as const;

export type AiPriority = (typeof AI_PRIORITY_VALUES)[number];

export function blockingLabel(value: boolean | null | undefined): string {
  if (value === true) return "Blocking";
  if (value === false) return "Not blocking";
  return "Not specified";
}

export function blockingFormValue(
  value: boolean | null | undefined,
): BlockingValue | undefined {
  if (value === true) return "yes";
  if (value === false) return "no";
  return undefined;
}

export function blockingValueToBoolean(
  value: BlockingValue | undefined,
): boolean | null {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

export function aiPriorityLabel(value: AiPriority): string {
  switch (value) {
    case "critical":
      return "Critical";
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
  }
}

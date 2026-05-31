export const FRAMEWORK_VALUES = ["angular", "react"] as const;

export type FrameworkValue = (typeof FRAMEWORK_VALUES)[number];

export const FRAMEWORKS: ReadonlyArray<{
  value: FrameworkValue;
  label: string;
  description: string;
}> = [
  {
    value: "angular",
    label: "Angular",
    description: "Needed in Angular implementations.",
  },
  {
    value: "react",
    label: "React",
    description: "Needed in React implementations.",
  },
];

export function serializeFrameworks(values: FrameworkValue[]): string | null {
  const serialized = FRAMEWORK_VALUES.filter((value) =>
    values.includes(value),
  ).join("|");

  return serialized || null;
}

export function parseFrameworks(
  value: string | null | undefined,
): FrameworkValue[] {
  if (!value) return [];

  return value
    .split("|")
    .map((part) => part.trim())
    .filter((part): part is FrameworkValue =>
      (FRAMEWORK_VALUES as readonly string[]).includes(part),
    );
}

export function frameworkLabel(value: string | null | undefined): string {
  const labels = parseFrameworks(value).map(
    (frameworkValue) =>
      FRAMEWORKS.find((framework) => framework.value === frameworkValue)?.label ??
      frameworkValue,
  );

  return labels.length > 0 ? labels.join(", ") : "Not specified";
}

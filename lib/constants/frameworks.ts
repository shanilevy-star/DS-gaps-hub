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

export function frameworkLabel(value: string | null | undefined): string {
  if (!value) return "Not specified";
  return FRAMEWORKS.find((framework) => framework.value === value)?.label ?? value;
}

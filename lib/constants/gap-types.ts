export const GAP_TYPE_VALUES = [
  "missing_variant",
  "missing_state",
  "missing_interaction",
  "layout_limitation",
  "semantic_styling",
  "accessibility",
  "usage_guidance",
  "other",
] as const;

export type GapTypeValue = (typeof GAP_TYPE_VALUES)[number];

type GapTypeDescriptor = {
  value: GapTypeValue;
  label: string;
  description: string;
};

export const GAP_TYPES: ReadonlyArray<GapTypeDescriptor> = [
  {
    value: "missing_variant",
    label: "Missing variant",
    description: "A new visual or stylistic variant of an existing component.",
  },
  {
    value: "missing_state",
    label: "Missing state",
    description:
      "An interaction or display state, e.g. loading, disabled, error.",
  },
  {
    value: "missing_interaction",
    label: "Missing interaction",
    description: "A behavior the component does not currently support.",
  },
  {
    value: "layout_limitation",
    label: "Layout limitation",
    description: "Component cannot be composed or sized the way you need it.",
  },
  {
    value: "semantic_styling",
    label: "Semantic styling",
    description: "Missing tokens, semantic colors, density, or spacing.",
  },
  {
    value: "accessibility",
    label: "Accessibility",
    description: "Keyboard, screen reader, contrast, or focus issue.",
  },
  {
    value: "usage_guidance",
    label: "Usage guidance",
    description: "Documentation is missing or unclear, not a code change.",
  },
  {
    value: "other",
    label: "Other",
    description: "Something else worth raising with the DS team.",
  },
];

export function gapTypeLabel(value: string): string {
  return value
    .split("|")
    .map((part) => {
      if (part.startsWith("other:")) {
        const detail = part.replace(/^other:/, "").trim();
        return detail ? `Other: ${detail}` : "Other";
      }

      return GAP_TYPES.find((g) => g.value === part)?.label ?? part;
    })
    .join(", ");
}

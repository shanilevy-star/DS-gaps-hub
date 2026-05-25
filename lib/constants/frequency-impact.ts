export const FREQUENCY_IMPACT_VALUES = [
  "one_off",
  "occasional",
  "frequent",
  "blocking",
] as const;

export type FrequencyImpactValue = (typeof FREQUENCY_IMPACT_VALUES)[number];

type FrequencyImpactDescriptor = {
  value: FrequencyImpactValue;
  label: string;
  description: string;
};

export const FREQUENCY_IMPACT: ReadonlyArray<FrequencyImpactDescriptor> = [
  {
    value: "one_off",
    label: "One-off",
    description: "I hit this once on a specific screen.",
  },
  {
    value: "occasional",
    label: "Occasional",
    description: "Comes up a few times per quarter.",
  },
  {
    value: "frequent",
    label: "Frequent",
    description: "Hits multiple flows or comes up regularly.",
  },
  {
    value: "blocking",
    label: "Blocking",
    description: "Blocking work right now and forcing one-offs.",
  },
];

export function frequencyImpactLabel(value: string): string {
  const additionalLabels: Record<string, string> = {
    cross_product_need: "Cross-product need",
    repeated_product_need: "Repeated product need",
    one_time_use_case: "One-time use case",
  };

  return (
    FREQUENCY_IMPACT.find((f) => f.value === value)?.label ??
    additionalLabels[value] ??
    value
  );
}

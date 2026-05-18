// Seed list of product teams. Edit this list for your organization.
// Keeping team names consistent is the single biggest lever for
// good cross-team AI grouping in the dashboard.
export const TEAMS = [
  "Checkout",
  "Growth",
  "Onboarding",
  "Reports & Analytics",
  "Settings & Admin",
  "Mobile Apps",
  "Marketing Site",
  "Other",
] as const;

export type Team = (typeof TEAMS)[number];

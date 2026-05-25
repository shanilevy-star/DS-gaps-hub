// Seed list of product teams. Edit this list for your organization.
// Keeping team names consistent is the single biggest lever for
// good cross-team AI grouping in the dashboard.
export const TEAMS = [
  "Hiring intelligence",
  "RX",
  "EX",
  "CX",
  "MX",
  "IX",
  "Automation Engine",
  "Agents",
  "SPX",
] as const;

export type Team = (typeof TEAMS)[number];

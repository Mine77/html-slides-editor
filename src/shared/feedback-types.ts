export const DEFAULT_FEEDBACK_ENDPOINT = "https://starrykit.com/api/starry-slides/feedback";

export const FEEDBACK_CATEGORIES = ["bug", "ux", "feature", "docs"] as const;
export const FEEDBACK_SURFACES = ["cli", "editor", "skill"] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];
export type FeedbackSurface = (typeof FEEDBACK_SURFACES)[number];

export interface FeedbackPayload {
  surface: FeedbackSurface;
  category: FeedbackCategory;
  summary: string;
  description: string;
  expected?: string;
  reproSteps?: string;
  command?: string;
  deckContext?: { file?: string; slideCount?: number };
  verifySummary?: string;
  appVersion?: string;
  cliVersion?: string;
  nodeVersion?: string;
  os?: string;
  timestamp: string;
  attachments?: { type: string; content: string; consented: boolean }[];
}

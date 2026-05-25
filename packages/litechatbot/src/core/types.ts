// Core types — business config + conversation shape

export interface BusinessConfig {
  /** Business name shown in greetings. */
  name: string;
  /** Optional one-line description (e.g. "Plumbing service in Vancouver"). */
  description?: string;
  /** Services offered with optional pricing. */
  services?: ServiceItem[];
  /** Operating hours (free text or structured). */
  hours?: string;
  /** Geographic service area names (e.g. ["Vancouver", "Burnaby"]). */
  serviceArea?: string[];
  /** Known policies (cancellation, payment, etc) the bot can quote. */
  policies?: PolicyItem[];
  /** What the bot should NOT promise (e.g. dispatch times). */
  doNotPromise?: string[];
  /** Custom system instructions appended to the default prompt. */
  customInstructions?: string;
  /** Language hint — default English. */
  language?: "en" | "zh" | "es" | "fr" | string;
}

export interface ServiceItem {
  name: string;
  price?: string;
  notes?: string;
}

export interface PolicyItem {
  topic: string;
  answer: string;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GuardResult {
  ok: boolean;
  violations: string[];
}

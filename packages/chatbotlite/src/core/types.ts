// Core types — minimal, vertical-agnostic.

/**
 * Business knowledge supplied to the bot. Markdown is the only universal format —
 * works for any vertical (plumber, restaurant, school, museum, bookstore, portfolio).
 * Headings give the model implicit structure without forcing a service-business schema.
 */
export type Knowledge = string;

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GuardResult {
  ok: boolean;
  violations: string[];
}

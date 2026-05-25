import type { GuardResult } from "./types.js";

/**
 * Phrases that almost always indicate hallucination for SMB customer service:
 * inventing dispatch promises, fake confirmations, or appointment locks.
 */
export const FORBIDDEN_PHRASES: readonly string[] = [
  "help is coming",
  "someone is on the way",
  "technician is on the way",
  "provider is on the way",
  "dispatching someone",
  "i've booked",
  "i have booked",
  "reservation confirmed",
  "your appointment is confirmed",
  "i've scheduled",
  "i have scheduled",
  "we've dispatched",
  "we have dispatched",
  "i can confirm",
  "i guarantee",
  "guaranteed delivery",
  "guaranteed arrival",
  "will arrive at",
  "arriving at",
  "i'll send",
  "i will send"
];

/**
 * Check a reply against the built-in forbidden phrase list.
 * Returns ok=true when clean, ok=false with violations when not.
 */
export function checkForbiddenPhrases(reply: string): GuardResult {
  const lower = reply.toLowerCase();
  const violations: string[] = [];
  for (const phrase of FORBIDDEN_PHRASES) {
    if (lower.includes(phrase)) {
      violations.push(`Forbidden phrase: "${phrase}"`);
    }
  }
  return { ok: violations.length === 0, violations };
}

/**
 * Remove forbidden sentences from a reply (best-effort sentence drop).
 * If too much is removed, returns a safe fallback.
 */
export function stripForbidden(reply: string): string {
  const sentences = reply.split(/(?<=[.!?])\s+/);
  const kept = sentences.filter((s) => {
    const lower = s.toLowerCase();
    return !FORBIDDEN_PHRASES.some((p) => lower.includes(p));
  });
  const trimmed = kept.join(" ").trim();
  if (trimmed.length < 10) {
    return "Thanks for reaching out — let me check with the owner and get back to you.";
  }
  return trimmed;
}

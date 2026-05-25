import type { GuardResult } from "./types.js";

/**
 * Redline phrases — absolute last-line safety net for SMB customer-service liability.
 *
 * NOTE: With a strict system prompt + business knowledge, modern LLMs (DeepSeek, GPT-4o,
 * Claude) refuse these voluntarily ~99% of the time. Our 20-scenario hallucination-bait
 * test showed 20/20 prompt-only passes — these guards triggered 0 times in normal use.
 *
 * Reduced from 22 → 6 in v0.4 after empirical testing showed the larger list was overkill.
 * Each remaining phrase represents real liability if uttered (fake booking, fake dispatch,
 * legal guarantee). Kept ONLY as a final guard against:
 *  - rare provider misbehavior
 *  - jailbreak attempts
 *  - fallback to weaker models (Llama-3.3 free tier, etc.)
 */
export const FORBIDDEN_PHRASES: readonly string[] = [
  "i've booked",                    // fake booking
  "i have booked",
  "your appointment is confirmed",  // fake confirmation
  "reservation confirmed",
  "someone is on the way",          // false dispatch
  "i guarantee"                     // legal liability
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

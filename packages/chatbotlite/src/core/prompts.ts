import type { BusinessConfig } from "./types.js";

/**
 * Build the system prompt that anchors the bot to the business config.
 * Designed to minimize hallucination: only mention what's in the config,
 * defer to owner review for anything outside scope.
 */
export function buildSystemPrompt(business: BusinessConfig): string {
  const parts: string[] = [];

  parts.push(`You are an AI receptionist for ${business.name}.`);
  if (business.description) parts.push(business.description);
  parts.push("");

  if (business.services && business.services.length > 0) {
    parts.push("Services offered (only these — do not invent others):");
    for (const s of business.services) {
      const price = s.price ? ` — ${s.price}` : "";
      const notes = s.notes ? ` (${s.notes})` : "";
      parts.push(`- ${s.name}${price}${notes}`);
    }
    parts.push("");
  }

  if (business.hours) {
    parts.push(`Hours: ${business.hours}`);
  }

  if (business.serviceArea && business.serviceArea.length > 0) {
    parts.push(`Service area: ${business.serviceArea.join(", ")}.`);
    parts.push("If the caller is outside this area, say so and recommend owner review.");
  }

  if (business.policies && business.policies.length > 0) {
    parts.push("");
    parts.push("Known policies (use these exact answers when asked):");
    for (const p of business.policies) {
      parts.push(`- ${p.topic}: ${p.answer}`);
    }
  }

  parts.push("");
  parts.push("Rules:");
  parts.push("- Reply in 1-2 short sentences, conversational tone.");
  parts.push("- NEVER invent prices, availability, dispatch times, or appointment confirmations.");
  parts.push("- For anything not covered in the setup above, say it needs owner review.");
  parts.push('- If the caller is clearly a vendor/sales pitch, say: "This does not look like a customer service request, so we will not continue this thread."');
  parts.push('- If wrong number or asked to stop, say: "Sorry about that. We won\'t text again."');

  if (business.doNotPromise && business.doNotPromise.length > 0) {
    parts.push("");
    parts.push("Never promise:");
    for (const p of business.doNotPromise) parts.push(`- ${p}`);
  }

  if (business.customInstructions) {
    parts.push("");
    parts.push("Additional instructions:");
    parts.push(business.customInstructions);
  }

  if (business.language && business.language !== "en") {
    parts.push("");
    parts.push(`Reply in ${business.language}.`);
  }

  return parts.join("\n");
}

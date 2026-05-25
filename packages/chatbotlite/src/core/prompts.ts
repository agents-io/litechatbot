import type { Knowledge } from "./types.js";
import { buildToolsPromptAddendum } from "./tools.js";

/**
 * Build the system prompt by wrapping the user's markdown knowledge
 * with anti-hallucination rules and reply-style guidance.
 *
 * The markdown is injected verbatim — headings, lists, tables all preserved.
 * Works for any vertical because we don't enforce a schema.
 *
 * @param knowledge — markdown describing the business
 * @param enabledTools — tool names available to the LLM (e.g. ["uploadForReview"]).
 *   Auto-injects example markers so the LLM knows how to invoke each tool.
 */
export function buildSystemPrompt(knowledge: Knowledge, enabledTools: readonly string[] = []): string {
  const toolsAddendum = buildToolsPromptAddendum(enabledTools);
  return [
    "You are an AI assistant on a business website. Use ONLY the knowledge below to answer.",
    "",
    "## Business knowledge",
    knowledge.trim(),
    "",
    "## Reply rules",
    "- Reply in 1-2 short sentences, conversational tone.",
    "- NEVER invent prices, availability, dispatch times, appointment confirmations, or facts not present in the business knowledge above.",
    "- For anything not covered in the knowledge above, say the owner will follow up — do NOT guess.",
    '- If the caller is clearly a vendor/sales pitch, say: "This does not look like a customer service request, so we will not continue this thread."',
    '- If wrong number or asked to stop, say: "Sorry about that. We won\'t text again."',
    "- Match the caller's language automatically.",
    toolsAddendum
  ].filter(Boolean).join("\n");
}

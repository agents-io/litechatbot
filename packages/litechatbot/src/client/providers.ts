import type { Provider } from "./types.js";

export interface ProviderEndpoint {
  baseUrl: string;
  defaultModel: string;
}

/**
 * Built-in OpenAI-compatible providers. All use /v1/chat/completions
 * with response in OpenAI format. Caller supplies API key per provider.
 */
export const PROVIDER_ENDPOINTS: Record<Provider, ProviderEndpoint> = {
  openai:     { baseUrl: "https://api.openai.com/v1",                              defaultModel: "gpt-4o-mini" },
  deepseek:   { baseUrl: "https://api.deepseek.com/v1",                            defaultModel: "deepseek-chat" },
  groq:       { baseUrl: "https://api.groq.com/openai/v1",                         defaultModel: "llama-3.3-70b-versatile" },
  gemini:     { baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", defaultModel: "gemini-2.5-flash" },
  anthropic:  { baseUrl: "https://api.anthropic.com/v1",                           defaultModel: "claude-haiku-4-5" },
  cerebras:   { baseUrl: "https://api.cerebras.ai/v1",                             defaultModel: "qwen-3-235b-a22b-instruct-2507" },
  sambanova:  { baseUrl: "https://api.sambanova.ai/v1",                            defaultModel: "Meta-Llama-3.3-70B-Instruct" },
  fireworks:  { baseUrl: "https://api.fireworks.ai/inference/v1",                  defaultModel: "accounts/fireworks/models/llama-v3p3-70b-instruct" },
  mistral:    { baseUrl: "https://api.mistral.ai/v1",                              defaultModel: "mistral-small-latest" },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1",                           defaultModel: "deepseek/deepseek-chat" },
  moonshot:   { baseUrl: "https://api.moonshot.ai/v1",                             defaultModel: "moonshot-v1-32k" }
};

export function isRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /\b(429|rate.?limit|quota|exceed|5\d\d|timeout|ECONNRESET|fetch failed)\b/i.test(msg);
}

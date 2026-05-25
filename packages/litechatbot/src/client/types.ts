// Client types — provider + chain config

export type Provider =
  | "openai"
  | "deepseek"
  | "groq"
  | "gemini"
  | "anthropic"
  | "cerebras"
  | "sambanova"
  | "fireworks"
  | "mistral"
  | "openrouter"
  | "moonshot";

/**
 * One step in the fallback chain. Either a string spec or an object.
 *
 * - **String**: `"provider/model"` (e.g. `"openai/gpt-4o"`), or bare `"provider"` (uses provider's default model).
 * - **Object**: `{ provider, model? }` — type-safe alternative.
 */
export type ChainEntry =
  | string
  | { provider: Provider; model?: string };

/**
 * Provider configuration.
 *
 * `keys` are auth credentials (one key per provider — that key covers all that provider's models).
 * `chain` is the ordered fallback list. Each entry is `"provider/model"` (string) or `{ provider, model }` (object).
 *
 * @example String form (compact, paste-friendly)
 * ```ts
 * providers: {
 *   keys: {
 *     deepseek: "sk-...",
 *     groq: "gsk-...",
 *     openai: "sk-..."
 *   },
 *   chain: [
 *     "deepseek/deepseek-chat",        // try first
 *     "groq/llama-3.3-70b-versatile",  // fallback 1
 *     "openai/gpt-4o-mini"             // fallback 2
 *   ]
 * }
 * ```
 *
 * @example Object form (type-safe, IDE autocomplete on `provider`)
 * ```ts
 * providers: {
 *   keys: { deepseek: "sk-...", openai: "sk-..." },
 *   chain: [
 *     { provider: "deepseek" },                              // default model
 *     { provider: "openai", model: "gpt-4o" },
 *     { provider: "openai", model: "gpt-4o-mini" }           // same key, cheaper model
 *   ]
 * }
 * ```
 *
 * If `chain` is omitted, defaults to `[<each provider in keys> with its default model]`
 * in key insertion order.
 */
export interface ProviderConfig {
  /** API keys per provider. One key covers all that provider's models. */
  keys: Partial<Record<Provider, string>>;
  /**
   * Ordered fallback chain. Each entry: string `"provider/model"` OR object `{ provider, model? }`.
   * Defaults to `[provider/defaultModel]` for each key in insertion order.
   */
  chain?: ChainEntry[];
}

export interface ClientOptions {
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface ChainStep {
  provider: Provider;
  model: string;
  /** Original spec string for diagnostics. */
  spec: string;
}

export interface AttemptInfo {
  provider: Provider;
  model: string;
  status: "ok" | "error";
  error?: string;
  latencyMs: number;
}

const PROVIDER_NAMES: ReadonlySet<string> = new Set([
  "openai", "deepseek", "groq", "gemini", "anthropic",
  "cerebras", "sambanova", "fireworks", "mistral", "openrouter", "moonshot"
]);

export function parseChainSpec(spec: string): { provider: Provider; model: string | null } {
  const slash = spec.indexOf("/");
  if (slash === -1) {
    if (!PROVIDER_NAMES.has(spec)) {
      throw new Error(`litechatbot: unknown provider "${spec}". Use "provider/model" or a known provider name.`);
    }
    return { provider: spec as Provider, model: null };
  }
  const provider = spec.slice(0, slash);
  const model = spec.slice(slash + 1);
  if (!PROVIDER_NAMES.has(provider)) {
    throw new Error(`litechatbot: unknown provider "${provider}" in chain spec "${spec}".`);
  }
  if (!model) {
    throw new Error(`litechatbot: empty model name in chain spec "${spec}".`);
  }
  return { provider: provider as Provider, model };
}

export function isKnownProvider(name: string): name is Provider {
  return PROVIDER_NAMES.has(name);
}

import type { Knowledge, Message } from "../core/types.js";
import { buildSystemPrompt } from "../core/prompts.js";
import { checkForbiddenPhrases, stripForbidden } from "../core/guards.js";
import type { Provider, ProviderConfig, ClientOptions, ChainStep, ChainEntry, AttemptInfo } from "./types.js";
import { isKnownProvider } from "./types.js";
import { PROVIDER_ENDPOINTS, isRetryableError } from "./providers.js";

export interface ChatBotInit {
  /** Markdown describing the business — services, hours, policies, anything. */
  knowledge: Knowledge;
  /** Provider keys + fallback chain. */
  providers: ProviderConfig;
  /** Optional runtime overrides. */
  options?: ClientOptions;
}

export interface ReplyOptions {
  /** Conversation history (excluding the new user message). */
  history?: Message[];
  /** Override system prompt — advanced use only. */
  systemPrompt?: string;
}

export interface ReplyResult {
  reply: string;
  /** Provider/model that produced the final reply (after fallback). */
  usedProvider: Provider;
  usedModel: string;
  /** Token usage if reported by the final provider. */
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  /** Guard violations the bot caught and stripped, if any. */
  guardWarnings: string[];
  /** Debug trace of every attempt in the chain. */
  attempts: AttemptInfo[];
}

/**
 * The main ChatBot entry. Holds knowledge + provider chain.
 *
 * @example
 * const bot = new ChatBot({
 *   knowledge: `# Acme Plumbing\n## Services\n- Sink leak: $95`,
 *   providers: {
 *     keys: { deepseek: "sk-...", openai: "sk-..." },
 *     chain: [
 *       { provider: "deepseek", model: "deepseek-chat" },
 *       { provider: "openai",   model: "gpt-4o-mini" }
 *     ]
 *   }
 * });
 * const { reply } = await bot.reply("My sink is leaking");
 */
export class ChatBot {
  private readonly steps: ChainStep[];
  private readonly keys: Partial<Record<Provider, string>>;
  private readonly fetcher: typeof globalThis.fetch;
  private readonly timeoutMs: number;
  private readonly cachedSystemPrompt: string;

  constructor(init: ChatBotInit) {
    if (!init.knowledge || typeof init.knowledge !== "string" || init.knowledge.trim().length === 0) {
      throw new Error("chatbotlite: knowledge is required (a non-empty markdown string).");
    }
    this.keys = init.providers.keys ?? {};
    this.steps = resolveChain(init.providers);
    this.fetcher = init.options?.fetch ?? globalThis.fetch.bind(globalThis);
    this.timeoutMs = init.options?.timeoutMs ?? 30_000;
    this.cachedSystemPrompt = buildSystemPrompt(init.knowledge);
  }

  async reply(message: string, opts: ReplyOptions = {}): Promise<ReplyResult> {
    const systemPrompt = opts.systemPrompt ?? this.cachedSystemPrompt;
    const messages: Message[] = [
      { role: "system", content: systemPrompt },
      ...(opts.history ?? []),
      { role: "user", content: message }
    ];
    const attempts: AttemptInfo[] = [];
    let lastError: unknown;
    for (const step of this.steps) {
      const t0 = Date.now();
      try {
        const result = await this.callProvider(step, messages);
        attempts.push({ provider: step.provider, model: step.model, status: "ok", latencyMs: Date.now() - t0 });
        const guard = checkForbiddenPhrases(result.reply);
        const finalReply = guard.ok ? result.reply : stripForbidden(result.reply);
        return {
          reply: finalReply,
          usedProvider: step.provider,
          usedModel: step.model,
          ...(result.usage ? { usage: result.usage } : {}),
          guardWarnings: guard.violations,
          attempts
        };
      } catch (err) {
        lastError = err;
        const errMsg = err instanceof Error ? err.message : String(err);
        attempts.push({
          provider: step.provider,
          model: step.model,
          status: "error",
          error: errMsg,
          latencyMs: Date.now() - t0
        });
        if (!isRetryableError(err)) {
          throw new Error(`chatbotlite: ${step.label} failed (non-retryable). ${errMsg}`);
        }
      }
    }
    const summary = attempts.map((a) => `${a.provider}/${a.model}:${a.error ?? "ok"}`).join(" → ");
    throw new Error(`chatbotlite: all chain steps failed. Trace: ${summary}. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
  }

  private async callProvider(step: ChainStep, messages: Message[]): Promise<{ reply: string; usage?: { prompt_tokens?: number; completion_tokens?: number } }> {
    const endpoint = PROVIDER_ENDPOINTS[step.provider];
    const key = this.keys[step.provider];
    if (!key) throw new Error(`Missing API key for provider: ${step.provider}`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetcher(`${endpoint.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: step.model,
          messages,
          temperature: 0.3,
          max_tokens: 300
        }),
        signal: controller.signal
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status}: ${body.slice(0, 200)}`);
      }
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const msg = data.choices?.[0]?.message;
      const reply = (msg?.content?.trim() || msg?.reasoning_content?.trim()) ?? "";
      if (!reply) throw new Error("empty reply from provider");
      const result: { reply: string; usage?: { prompt_tokens?: number; completion_tokens?: number } } = { reply };
      if (data.usage) result.usage = data.usage;
      return result;
    } finally {
      clearTimeout(timer);
    }
  }
}

function resolveChain(providers: ProviderConfig): ChainStep[] {
  const keys = providers.keys ?? {};
  const explicit = providers.chain;
  if (explicit && explicit.length > 0) {
    return explicit.map((entry) => normalizeChainEntry(entry, keys));
  }
  const orderedProviders = Object.keys(keys).filter((k) => isKnownProvider(k) && keys[k as Provider]) as Provider[];
  if (orderedProviders.length === 0) {
    throw new Error("chatbotlite: at least one provider key is required.");
  }
  return orderedProviders.map((provider) => ({
    provider,
    model: PROVIDER_ENDPOINTS[provider].defaultModel,
    label: `${provider}/${PROVIDER_ENDPOINTS[provider].defaultModel}`
  }));
}

function normalizeChainEntry(entry: ChainEntry, keys: Partial<Record<Provider, string>>): ChainStep {
  if (!isKnownProvider(entry.provider)) {
    throw new Error(`chatbotlite: unknown provider "${entry.provider}" in chain entry.`);
  }
  const provider = entry.provider;
  const model = entry.model ?? PROVIDER_ENDPOINTS[provider].defaultModel;
  if (!keys[provider]) {
    throw new Error(`chatbotlite: chain entry for "${provider}" needs a matching key in providers.keys.`);
  }
  return { provider, model, label: `${provider}/${model}` };
}

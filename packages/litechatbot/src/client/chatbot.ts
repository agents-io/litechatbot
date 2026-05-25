import type { BusinessConfig, Message } from "../core/types.js";
import { buildSystemPrompt } from "../core/prompts.js";
import { checkForbiddenPhrases, stripForbidden } from "../core/guards.js";
import type { Provider, ProviderConfig, ClientOptions } from "./types.js";
import { PROVIDER_ENDPOINTS, isRetryableError } from "./providers.js";

export interface ChatBotInit {
  business: BusinessConfig;
  providers: ProviderConfig;
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
  /** Which provider answered (after fallback). */
  usedProvider: Provider;
  /** Token usage if reported by the provider. */
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  /** Guard violations the bot caught and stripped, if any. */
  guardWarnings: string[];
}

/**
 * The main ChatBot entry. Holds business config + provider chain.
 *
 * @example
 * const bot = new ChatBot({
 *   business: { name: "Acme Plumbing", services: [{ name: "Sink leak", price: "$95" }] },
 *   providers: { primary: "deepseek", fallbacks: ["groq", "openai"], keys: { deepseek: "...", groq: "...", openai: "..." } }
 * });
 * const { reply } = await bot.reply("My sink is leaking");
 */
export class ChatBot {
  private readonly business: BusinessConfig;
  private readonly providers: ProviderConfig;
  private readonly fetcher: typeof globalThis.fetch;
  private readonly timeoutMs: number;
  private readonly cachedSystemPrompt: string;

  constructor(init: ChatBotInit) {
    this.business = init.business;
    this.providers = init.providers;
    this.fetcher = init.options?.fetch ?? globalThis.fetch.bind(globalThis);
    this.timeoutMs = init.options?.timeoutMs ?? 30_000;
    this.cachedSystemPrompt = buildSystemPrompt(this.business);
  }

  async reply(message: string, opts: ReplyOptions = {}): Promise<ReplyResult> {
    const systemPrompt = opts.systemPrompt ?? this.cachedSystemPrompt;
    const messages: Message[] = [
      { role: "system", content: systemPrompt },
      ...(opts.history ?? []),
      { role: "user", content: message }
    ];
    const chain: Provider[] = [this.providers.primary, ...(this.providers.fallbacks ?? [])];
    let lastError: unknown;
    for (const provider of chain) {
      try {
        const result = await this.callProvider(provider, messages);
        const guard = checkForbiddenPhrases(result.reply);
        const finalReply = guard.ok ? result.reply : stripForbidden(result.reply);
        return {
          reply: finalReply,
          usedProvider: provider,
          ...(result.usage ? { usage: result.usage } : {}),
          guardWarnings: guard.violations
        };
      } catch (err) {
        lastError = err;
        if (!isRetryableError(err)) {
          throw err;
        }
      }
    }
    throw lastError ?? new Error("All providers in the fallback chain failed.");
  }

  private async callProvider(provider: Provider, messages: Message[]): Promise<{ reply: string; usage?: { prompt_tokens?: number; completion_tokens?: number } }> {
    const endpoint = PROVIDER_ENDPOINTS[provider];
    const key = this.providers.keys[provider];
    if (!key) throw new Error(`Missing API key for provider: ${provider}`);
    const model = this.providers.models?.[provider] ?? endpoint.defaultModel;

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
          model,
          messages,
          temperature: 0.3,
          max_tokens: 300
        }),
        signal: controller.signal
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Provider ${provider} returned ${res.status}: ${body.slice(0, 200)}`);
      }
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const msg = data.choices?.[0]?.message;
      const reply = (msg?.content?.trim() || msg?.reasoning_content?.trim()) ?? "";
      if (!reply) throw new Error(`Provider ${provider} returned empty reply.`);
      const result: { reply: string; usage?: { prompt_tokens?: number; completion_tokens?: number } } = { reply };
      if (data.usage) result.usage = data.usage;
      return result;
    } finally {
      clearTimeout(timer);
    }
  }
}

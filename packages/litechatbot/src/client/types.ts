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

export interface ProviderConfig {
  primary: Provider;
  fallbacks?: Provider[];
  keys: Partial<Record<Provider, string>>;
  models?: Partial<Record<Provider, string>>;
}

export interface ClientOptions {
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
  maxRetries?: number;
}

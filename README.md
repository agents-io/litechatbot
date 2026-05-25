# litechatbot ⚡

> Drop-in AI chatbot for any website. One import, one config, working chatbot.

```bash
npm install litechatbot
```

```tsx
import { ChatWidget } from 'litechatbot/react';

<ChatWidget
  business={{ name: 'Acme Plumbing', services: [{ name: 'Sink leak', price: '$95' }] }}
  providers={{ primary: 'deepseek', keys: { deepseek: process.env.DEEPSEEK_KEY } }}
/>
```

A floating chat bubble. Real LLM. Multi-provider fallback. Anti-hallucination guards.

## Features

- 🪶 **Lite** — one package, zero heavy deps, ESM + CJS dual build
- 🔄 **Multi-provider fallback** — OpenAI, DeepSeek, Groq, Gemini, Anthropic, Cerebras, SambaNova, Fireworks, Mistral, OpenRouter, Moonshot
- 🛡️ **Anti-hallucination guards** — strips invented dispatch/confirmation phrases
- 🏪 **Business config schema** — services, hours, prices, policies typed as JSON
- 🎨 **Drop-in React widget** — floating bubble, customizable theme
- 🔌 **Headless API** — `new ChatBot()` for your own UI
- 📜 **Apache 2.0** — free for commercial use

## Install

```bash
npm install litechatbot
# or
pnpm add litechatbot
# or
bun add litechatbot
```

## Quick start — React widget

```tsx
import { ChatWidget } from 'litechatbot/react';

export default function MySite() {
  return (
    <>
      {/* Your site content */}
      <ChatWidget
        business={{
          name: 'Acme Plumbing',
          services: [
            { name: 'Sink leak inspection', price: '$95' },
            { name: 'Toilet unclogging', price: '$85-150' }
          ],
          hours: 'Mon-Sat 8am-6pm',
          serviceArea: ['Vancouver', 'Burnaby']
        }}
        providers={{
          primary: 'deepseek',
          fallbacks: ['groq', 'openai'],
          keys: {
            deepseek: process.env.DEEPSEEK_KEY!,
            groq: process.env.GROQ_KEY!,
            openai: process.env.OPENAI_KEY!
          }
        }}
        theme={{ primary: '#0f172a' }}
      />
    </>
  );
}
```

## Headless — your own UI

```ts
import { ChatBot } from 'litechatbot';

const bot = new ChatBot({
  business: { name: 'Acme', services: [{ name: 'Tutoring', price: '$50/hr' }] },
  providers: { primary: 'deepseek', keys: { deepseek: 'sk-...' } }
});

const result = await bot.reply('How much for math tutoring?');
console.log(result.reply);          // "Math tutoring is $50/hr. Want to book a session?"
console.log(result.usedProvider);   // "deepseek"
console.log(result.guardWarnings);  // []
```

## Provider fallback

When the primary provider rate-limits or 5xx's, litechatbot auto-falls back to the next:

```ts
providers: {
  primary: 'deepseek',                          // try first
  fallbacks: ['groq', 'sambanova', 'openai'],   // try in order if primary fails
  keys: { deepseek: '...', groq: '...', sambanova: '...', openai: '...' }
}
```

Retries on: `429`, rate limit messages, `5xx`, timeouts, `ECONNRESET`, `fetch failed`. Doesn't retry on auth errors or 404s.

## Anti-hallucination

The bot reply runs through a built-in guard that strips dangerous SMB customer-service phrases like:

- "I've booked you for Saturday"
- "Someone is on the way now"
- "Your appointment is confirmed"
- "I guarantee delivery at 3pm"

These invent commitments your business hasn't made. Stripped automatically.

## Why this exists

Vercel AI SDK gives you LLM primitives. LangChain gives you a kitchen sink. ChatBotKit is cloud-locked SaaS. None of them ship a **drop-in chatbot widget + business config + multi-provider fallback + anti-hallucination guards** as a single Apache-2.0 npm package.

This does.

## Roadmap

- [x] v0.1 — MVP: business config, React widget, fallback chain, basic guards
- [ ] v0.2 — Streaming, image upload, voice
- [ ] v0.3 — RAG hooks for FAQ/docs
- [ ] v0.4 — Owner review escalation flow
- [ ] v0.5 — Analytics + conversation export
- [ ] v1.0 — API stable

## Contributing

Issues and PRs welcome. This is early — we're shipping fast.

## License

Apache-2.0

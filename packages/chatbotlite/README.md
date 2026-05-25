# chatbotlite ⚡

> **The lite chatbot SDK.** Drop-in AI customer service chatbot for any website. Multi-LLM with fallback. Anti-hallucination guards. React widget. **One import, one config, done.**

```bash
npm install chatbotlite
```

[![npm](https://img.shields.io/npm/v/chatbotlite.svg)](https://www.npmjs.com/package/chatbotlite)
[![license](https://img.shields.io/npm/l/chatbotlite.svg)](LICENSE)

---

## 30 seconds to chatbot

```tsx
// app/layout.tsx (Next.js) — or any React tree
"use client";
import { ChatWidget } from "chatbotlite/react";

export default function Layout({ children }) {
  return (
    <>
      {children}
      <ChatWidget endpoint="/api/chat" title="Acme Plumbing" />
    </>
  );
}
```

```ts
// app/api/chat/route.ts (Next.js)
import { ChatBot } from "chatbotlite";

const bot = new ChatBot({
  business: {
    name: "Acme Plumbing",
    services: [
      { name: "Sink leak inspection", price: "$95" },
      { name: "Toilet unclogging",    price: "$85-150" }
    ],
    hours: "Mon-Sat 8am-6pm",
    serviceArea: ["Vancouver", "Burnaby"]
  },
  providers: {
    keys: {
      deepseek: process.env.DEEPSEEK_API_KEY!,
      openai:   process.env.OPENAI_API_KEY!
    },
    chain: ["deepseek/deepseek-chat", "openai/gpt-4o-mini"]
  }
});

export async function POST(req: Request) {
  const { message, transcript } = await req.json();
  const { reply } = await bot.reply(message, { history: transcript });
  return Response.json({ reply });
}
```

That's the whole integration. You now have a floating chat bubble that:

- Knows your business (services, prices, hours, area)
- Falls back to a second LLM if the first rate-limits
- Won't hallucinate dispatch promises or fake confirmations
- Works with 11 LLM providers including DeepSeek, OpenAI, Groq, Anthropic, Gemini

---

## What you get

| | |
|--|--|
| 🪶 **Lite** | Single npm package, zero heavy deps, ESM + CJS dual build |
| 🔄 **Multi-LLM fallback** | OpenAI / DeepSeek / Groq / Gemini / Anthropic / Cerebras / SambaNova / Fireworks / Mistral / OpenRouter / Moonshot |
| 🛡️ **Anti-hallucination guards** | Strips invented dispatch, fake confirmations, refund promises |
| 🏪 **Business config schema** | Services, hours, prices, policies as typed JSON |
| 🎨 **Drop-in React widget** | One `<ChatWidget />` component — polished UI, no CSS to fight |
| 🔌 **Headless API** | `new ChatBot()` for your own UI |
| 🌐 **Multi-language** | Replies match the customer's language out of the box |
| 📜 **Apache 2.0** | Free for commercial use |

---

## Install

```bash
npm install chatbotlite
# or
pnpm add chatbotlite
# or
bun add chatbotlite
# or
yarn add chatbotlite
```

> **Migrating from `litechatbot`?** Same project — renamed for clarity. `npm uninstall litechatbot && npm install chatbotlite`, then change the import. That's it.

---

## Integration recipes

### Next.js (App Router) — production pattern

**`app/api/chat/route.ts`** — server-side, keys stay private:

```ts
import { ChatBot } from "chatbotlite";

const bot = new ChatBot({
  business: { name: "Your Business", services: [...] },
  providers: {
    keys: { openai: process.env.OPENAI_API_KEY! },
    chain: ["openai/gpt-4o-mini"]
  }
});

export async function POST(req: Request) {
  const { message, transcript } = await req.json();
  const { reply } = await bot.reply(message, { history: transcript });
  return Response.json({ reply });
}
```

**`app/layout.tsx`** — mount the widget once:

```tsx
"use client";
import { ChatWidget } from "chatbotlite/react";

export default function ChatMount() {
  return <ChatWidget endpoint="/api/chat" title="Your Business" />;
}
```

### Plain React / Vite — client-side mode

```tsx
import { ChatWidget } from "chatbotlite/react";

<ChatWidget
  business={{
    name: "Sunrise Yoga",
    services: [{ name: "Drop-in class", price: "$22" }]
  }}
  providers={{
    keys: { openai: import.meta.env.VITE_OPENAI_KEY }
  }}
/>
```

> ⚠️ Client-side mode exposes the API key to the browser. Use server-side `endpoint` mode for production. Acceptable for free-tier keys with strict per-IP rate limits.

### Express / Bun / Hono / any Node-ish runtime

```ts
import { ChatBot } from "chatbotlite";

const bot = new ChatBot({ business, providers });

app.post("/api/chat", async (req, res) => {
  const { reply } = await bot.reply(req.body.message, { history: req.body.transcript });
  res.json({ reply });
});
```

### Vanilla HTML (no React)

Coming in v0.3 — for now, mount the React widget inside a tiny React root.

---

## Provider config

`chatbotlite` is `litellm` for chatbots — it speaks any OpenAI-compatible endpoint. You supply keys and a fallback chain.

### Shortest form

```ts
providers: {
  keys: { openai: "sk-..." }
}
// → uses gpt-4o-mini, no fallback
```

### Recommended — fallback chain

```ts
providers: {
  keys: {
    deepseek: "sk-...",      // primary: cheap + smart
    groq:     "gsk-...",     // free fallback, super fast
    openai:   "sk-..."       // paid fallback, max reliability
  },
  chain: [
    "deepseek/deepseek-chat",
    "groq/llama-3.3-70b-versatile",
    "openai/gpt-4o-mini"
  ]
}
```

Top-to-bottom = priority. When a step throws a retryable error (429, 5xx, timeout), it falls through to the next.

### Object form (type-safe alternative)

```ts
providers: {
  keys: { openai: "sk-..." },
  chain: [
    { provider: "openai", model: "gpt-4o" },
    { provider: "openai", model: "gpt-4o-mini" }   // same key, cheaper fallback
  ]
}
```

### Supported providers

`openai`, `deepseek`, `groq`, `gemini`, `anthropic`, `cerebras`, `sambanova`, `fireworks`, `mistral`, `openrouter`, `moonshot`

Use any model the provider supports — just write `"provider/model-id"`.

---

## Business config

The `business` object is your bot's brain. It teaches the bot what to say and what NOT to.

```ts
{
  name: "Acme Plumbing",
  description: "Plumbing service in Greater Vancouver since 2018",

  services: [
    { name: "Sink leak inspection", price: "$95", notes: "First-visit fee" },
    { name: "Toilet unclogging",    price: "$85-150" },
    { name: "Burst pipe emergency", notes: "Urgent — owner reviews directly" }
  ],

  hours: "Mon-Sat 8am-6pm",
  serviceArea: ["Vancouver", "Burnaby", "Richmond"],

  policies: [
    { topic: "Payment",      answer: "We accept Interac e-Transfer and major credit cards." },
    { topic: "Cancellation", answer: "Free cancellation up to 24h before the appointment." }
  ],

  doNotPromise: [
    "Specific arrival times — we can only give windows",
    "Final repair quotes without inspection"
  ],

  customInstructions: "Always remind customers to send photos of leaks for faster diagnosis.",
  language: "en"     // or "zh", "es", "fr" — any language the model speaks
}
```

The bot uses only what's in here. Ask it about a service not listed → it defers to owner review. Ask for a guaranteed price → it refuses politely.

---

## Anti-hallucination guards

`chatbotlite` strips dangerous phrases from replies before they reach the customer:

- ❌ "I've booked you for Saturday at 2pm" (didn't actually book)
- ❌ "Someone is on the way" (no one is)
- ❌ "Your appointment is confirmed" (it isn't)
- ❌ "I guarantee delivery by 3pm" (you didn't promise that)

Strip behaviour is conservative — if a sentence can be rescued by dropping the offending phrase, the rest of the reply is kept. Otherwise the bot falls back to "Thanks — let me check with the owner and get back to you."

You can see what was caught:

```ts
const { reply, guardWarnings, attempts } = await bot.reply(message);
console.log(reply);           // sanitized reply
console.log(guardWarnings);   // [] or list of stripped phrases
console.log(attempts);        // debug trace per chain step
```

---

## Widget customization

```tsx
<ChatWidget
  endpoint="/api/chat"
  title="MaxTax Assistant"
  subtitle="Replies in minutes during business hours"
  greeting="Hi! Ask about pricing, what to upload, or our process."
  theme={{ primary: "#dc2626" }}     // brand color
  position="bottom-right"            // or "bottom-left"
  showBranding={true}                // toggle "⚡ Powered by chatbotlite" footer
/>
```

Want a different UI? Use `ChatBot` headless and build your own.

---

## Why this exists (vs the alternatives)

|                                       | chatbotlite | Vercel AI SDK | LangChain | ChatBotKit | Intercom |
|---------------------------------------|:-:|:-:|:-:|:-:|:-:|
| Drop-in widget                        | ✅ | ❌ | ❌ | ✅ | ✅ |
| Multi-provider fallback chain         | ✅ | gateway-only | ✅ | gateway | ❌ |
| Business config schema (typed)        | ✅ | ❌ | ❌ | ✅ | ✅ |
| Anti-hallucination guards             | ✅ | ❌ | separate | ❌ | ❌ |
| Self-hostable                         | ✅ | ✅ | ✅ | ❌ | ❌ |
| Apache 2.0 / free for commercial use  | ✅ | ✅ | ✅ | ❌ | ❌ |
| One package install                   | ✅ | many | many | ✅ | SaaS |

**Vercel AI SDK** gives you LLM primitives — you wire everything. **LangChain** is a kitchen sink. **ChatBotKit / Intercom** are SaaS — you pay forever, you don't own the bot. **`chatbotlite`** is the missing middle: opinionated, drop-in, self-hostable, Apache 2.0.

> Also searched as **litechatbot** — same project, was renamed for clarity. The `litechatbot` npm name still resolves as a deprecated alias.

---

## Roadmap

- [x] **v0.1** — MVP: business config, React widget, fallback chain, basic guards
- [x] **v0.2** — Polished UI, model-based fallback chain (Vercel-style), attempts metadata
- [ ] **v0.3** — Streaming, vanilla JS bundle, image upload, voice input
- [ ] **v0.4** — RAG hooks for FAQ/docs, custom guards API
- [ ] **v0.5** — Owner-review escalation flow, analytics + conversation export
- [ ] **v1.0** — API stable

---

## Examples in the wild

- **MaxTax** (Vancouver tax filing): [filetext.tax](https://filetext.tax) — uses `<ChatWidget endpoint="/api/chat" />` with DeepSeek → Groq → OpenAI fallback

Using `chatbotlite` on your site? PR a link here.

---

## Contributing

Issues, PRs, and feedback welcome. We're early — shipping fast.

```bash
git clone https://github.com/agents-io/chatbotlite
cd chatbotlite
pnpm install
pnpm --filter chatbotlite build
```

## License

Apache-2.0. Free for commercial use. Build your business on this.

---

⚡ Built by [agents.io](https://github.com/agents-io). Also published as `litechatbot` (alias).

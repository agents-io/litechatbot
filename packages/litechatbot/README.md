# litechatbot ⚡

Drop-in AI chatbot SDK for any website. LiteLLM-style multi-provider with fallback + React widget + anti-hallucination guards.

```bash
npm install litechatbot
```

## One-line widget

```tsx
import { ChatWidget } from 'litechatbot/react';

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
      deepseek: process.env.DEEPSEEK_KEY,
      groq: process.env.GROQ_KEY,
      openai: process.env.OPENAI_KEY
    }
  }}
/>
```

That's it. You now have a floating chat bubble in the corner of your site.

## Headless API

If you want to wire the bot into your own UI:

```ts
import { ChatBot } from 'litechatbot';

const bot = new ChatBot({
  business: { name: 'Acme', services: [{ name: 'Tutoring', price: '$50/hr' }] },
  providers: { primary: 'deepseek', keys: { deepseek: 'sk-...' } }
});

const { reply, usedProvider, guardWarnings } = await bot.reply('How much?');
```

## Supported providers

Any OpenAI-compatible endpoint works. Built-in: `openai`, `deepseek`, `groq`, `gemini`, `anthropic`, `cerebras`, `sambanova`, `fireworks`, `mistral`, `openrouter`, `moonshot`.

Fallback chain auto-retries on 429 / rate-limit / 5xx / timeout.

## Anti-hallucination guards

Built-in checks strip dangerous phrases like:
- "I've booked you in"
- "Someone is on the way"
- "Your appointment is confirmed"
- "I guarantee delivery at X"

Replies that try to invent dispatch, confirmation, or guarantees get sanitized before reaching the user.

## Why not Vercel AI SDK / LangChain / ChatBotKit?

| | litechatbot | Vercel AI SDK | LangChain | ChatBotKit |
|--|--|--|--|--|
| Drop-in widget | ✅ | ❌ primitives | ❌ | ✅ (cloud-locked) |
| Multi-provider fallback | ✅ | wire it yourself | ✅ | cloud |
| Business config schema | ✅ | ❌ | ❌ | ✅ |
| Anti-hallucination guards | ✅ | ❌ | separate libs | ❌ |
| Open source | Apache 2.0 | Apache 2.0 | MIT | proprietary |
| Self-host | ✅ | ✅ | ✅ | ❌ |

## Status

🚧 v0.1.0 — MVP. API may change.

## License

Apache-2.0. Free for commercial use.

## Links

- [GitHub](https://github.com/agents-io/litechatbot)
- [Issues](https://github.com/agents-io/litechatbot/issues)

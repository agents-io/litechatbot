// Vercel serverless function — shared chat backend for all demo verticals.
//
// Endpoint: /api/chat?demo=<vertical>
// Verticals: shopify-store, plumber, restaurant, dentist, tax-prep, yoga-studio

import { ChatBot } from "chatbotlite";
import type { Message } from "chatbotlite";

const KNOWLEDGE_BY_DEMO: Record<string, string> = {
  // Lazy: bundle knowledge at build via fs read. For now, inline minimal versions.
  // The full markdown lives in demos/_shared/knowledge/<demo>.md but Vercel won't
  // bundle the parent ../_shared by default, so we read at module init.
};

// Read all knowledge .md files at cold-start
async function loadKnowledge(): Promise<void> {
  if (Object.keys(KNOWLEDGE_BY_DEMO).length > 0) return;
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const dir = path.join(process.cwd(), "demos", "_shared", "knowledge");
  try {
    const files = await fs.readdir(dir);
    for (const f of files) {
      if (f.endsWith(".md")) {
        const name = f.replace(/\.md$/, "");
        KNOWLEDGE_BY_DEMO[name] = await fs.readFile(path.join(dir, f), "utf8");
      }
    }
  } catch (err) {
    console.error("[chatbotlite/demos] failed to load knowledge:", err);
  }
}

const botCache = new Map<string, ChatBot>();

function getBot(demo: string): ChatBot {
  if (botCache.has(demo)) return botCache.get(demo)!;
  const knowledge = KNOWLEDGE_BY_DEMO[demo];
  if (!knowledge) throw new Error(`unknown demo: ${demo}`);
  const bot = new ChatBot({
    knowledge,
    providers: {
      keys: {
        deepseek: process.env.DEEPSEEK_API_KEY ?? "",
        groq: process.env.GROQ_API_KEY ?? "",
        openai: process.env.OPENAI_API_KEY ?? ""
      },
      chain: [
        { provider: "deepseek", model: "deepseek-chat" },
        { provider: "groq", model: "llama-3.3-70b-versatile" },
        { provider: "openai", model: "gpt-4o-mini" }
      ]
    }
  });
  botCache.set(demo, bot);
  return bot;
}

export const config = {
  runtime: "nodejs",
  maxDuration: 30
};

export default async function handler(req: Request): Promise<Response> {
  await loadKnowledge();
  const url = new URL(req.url);
  const demo = url.searchParams.get("demo") ?? "shopify-store";

  try {
    const ct = req.headers.get("content-type") ?? "";
    let message: string | undefined;
    let transcript: Message[] = [];
    let enabledTools: string[] = [];

    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      message = form.get("message") as string;
      const tStr = form.get("transcript") as string | null;
      transcript = tStr ? JSON.parse(tStr) : [];
      const eStr = form.get("enabledTools") as string | null;
      enabledTools = eStr ? JSON.parse(eStr) : [];
    } else {
      const body = (await req.json()) as {
        message?: string;
        transcript?: Message[];
        enabledTools?: string[];
      };
      message = body.message;
      transcript = body.transcript ?? [];
      enabledTools = body.enabledTools ?? [];
    }

    if (!message) {
      return Response.json({ error: "message required" }, { status: 400 });
    }

    const bot = getBot(demo);
    const stream = await bot.replyStream(message, { history: transcript, enabledTools });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      }
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return Response.json({ error: msg }, { status: 500 });
  }
}

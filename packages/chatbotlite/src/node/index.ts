// Node-only helpers — use these in your server code.
// Browser code should pass knowledge as a string directly.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, basename, extname, resolve } from "node:path";

/**
 * Load a folder of markdown / text files as a single concatenated knowledge string.
 *
 * Each file becomes a top-level section in the output, headed by its filename
 * (without extension). Files are concatenated in alphabetical order.
 *
 * @example
 * ```ts
 * import { ChatBot } from "chatbotlite";
 * import { knowledgeFromDir } from "chatbotlite/node";
 *
 * const bot = new ChatBot({
 *   knowledge: knowledgeFromDir("./kb"),
 *   providers: { keys: { openai: process.env.OPENAI_API_KEY! } }
 * });
 * ```
 *
 * @param dir Path to the folder (absolute or relative to cwd).
 * @param opts.exts File extensions to include (default `[".md", ".markdown", ".txt"]`).
 * @param opts.headers If true (default), wrap each file's content in a `# filename` heading.
 */
export function knowledgeFromDir(
  dir: string,
  opts: { exts?: string[]; headers?: boolean } = {}
): string {
  const exts = (opts.exts ?? [".md", ".markdown", ".txt"]).map((e) => e.toLowerCase());
  const useHeaders = opts.headers ?? true;
  const abs = resolve(dir);
  const stat = statSync(abs);
  if (!stat.isDirectory()) {
    throw new Error(`chatbotlite: ${abs} is not a directory.`);
  }
  const files = readdirSync(abs)
    .filter((f) => exts.includes(extname(f).toLowerCase()))
    .sort();
  if (files.length === 0) {
    throw new Error(`chatbotlite: no ${exts.join("/")} files found in ${abs}.`);
  }
  const parts: string[] = [];
  for (const f of files) {
    const content = readFileSync(join(abs, f), "utf8").trim();
    if (useHeaders) {
      const heading = basename(f, extname(f));
      parts.push(`# ${heading}\n\n${content}`);
    } else {
      parts.push(content);
    }
  }
  return parts.join("\n\n");
}

/**
 * Load a single markdown/text file as a knowledge string.
 *
 * @example
 * ```ts
 * import { knowledgeFromFile } from "chatbotlite/node";
 * const knowledge = knowledgeFromFile("./business.md");
 * ```
 */
export function knowledgeFromFile(path: string): string {
  const abs = resolve(path);
  return readFileSync(abs, "utf8");
}

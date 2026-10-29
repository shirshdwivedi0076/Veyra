// Server-side only. Never import this from a client component.
// Supports Google Gemini, Anthropic (Claude), and OpenAI-compatible providers.

export type ChatMsg = { role: "user" | "assistant"; content: string };

export class AINotConfiguredError extends Error {
  constructor() {
    super("Live AI is not configured yet. Add GEMINI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY to .env.local and restart the server.");
  }
}

type Provider = "gemini" | "anthropic" | "openai";

export function resolveProvider(): Provider | null {
  const pref = (process.env.AI_PROVIDER || "").toLowerCase();
  if (pref === "gemini" && process.env.GEMINI_API_KEY) return "gemini";
  if (pref === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (pref === "openai" && process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

export function aiStatus() {
  const provider = resolveProvider();
  return {
    configured: provider !== null,
    provider,
    model: provider === "gemini" ? process.env.GEMINI_MODEL || "gemini-2.5-flash" : provider === "anthropic" ? process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5" : provider === "openai" ? process.env.OPENAI_MODEL || "gpt-4o-mini" : null,
  };
}

const TIMEOUT_MS = 25_000;

async function postJSON(url: string, headers: Record<string, string>, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  let data: any = null;
  try { data = await res.json(); } catch { /* non-JSON error body */ }
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || `The AI provider returned HTTP ${res.status}.`;
    throw new Error(msg);
  }
  return data;
}

export async function callLLM(opts: { system: string; messages: ChatMsg[]; maxTokens?: number; temperature?: number; json?: boolean }): Promise<string> {
  const provider = resolveProvider();
  if (!provider) throw new AINotConfiguredError();
  const { system, messages, maxTokens = 1200, temperature = 0.2, json = false } = opts;

  if (provider === "gemini") {
    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    // Use Google's recommended Interactions API. Send the conversation as text
    // so this works without relying on a particular SDK version.
    const transcript = messages.map((m) =>
      `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`
    ).join("\n\n");
    const prompt = `${system}${json ? "\n\nReturn a single valid JSON object and nothing else." : ""}\n\nConversation:\n${transcript}`;

    const data = await postJSON(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      { "x-goog-api-key": process.env.GEMINI_API_KEY! },
      {
        model,
        input: prompt,
        store: false,
        generation_config: {
          temperature,
          max_output_tokens: maxTokens,
        },
      },
    );

    // Interactions API responses contain model_output steps; also accept
    // output_text if returned by an SDK-compatible response.
    const outputText = typeof data?.output_text === "string" ? data.output_text : "";
    const steps = Array.isArray(data?.steps) ? data.steps : [];
    const stepText = steps
      .filter((step: any) => step?.type === "model_output")
      .flatMap((step: any) => Array.isArray(step?.content) ? step.content : [])
      .map((part: any) => typeof part?.text === "string" ? part.text : "")
      .filter(Boolean)
      .join("\n");
    const text = outputText || stepText;
    if (!text.trim()) {
      const detail = data?.error?.message || data?.status || "no text output";
      throw new Error(`Gemini Interactions API returned ${detail}. Check your model, API key, and API access.`);
    }
    return text;
  }

  if (provider === "anthropic") {
    const base = (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/$/, "");
    const data = await postJSON(`${base}/v1/messages`, { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" }, {
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
      max_tokens: maxTokens,
      temperature,
      system: json ? `${system}\n\nRespond with a single valid JSON object and nothing else.` : system,
      messages,
    });
    const text = Array.isArray(data?.content) ? data.content.filter((b: any) => b?.type === "text").map((b: any) => b.text).join("\n") : "";
    if (!text.trim()) throw new Error("The AI provider returned an empty response.");
    return text;
  }

  const configuredBase = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const trimmed = configuredBase.replace(/\/$/, "");
  const endpoint = trimmed.endsWith("/chat/completions") ? trimmed : `${trimmed}/chat/completions`;
  const data = await postJSON(endpoint, { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, {
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature,
    max_tokens: maxTokens,
    ...(json && !process.env.OPENAI_BASE_URL ? { response_format: { type: "json_object" } } : {}),
    messages: [{ role: "system", content: json ? `${system}\n\nRespond with a single valid JSON object and nothing else.` : system }, ...messages],
  });
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("The AI provider returned an empty response.");
  return content;
}

/** Pull the first JSON object out of a model reply (handles ```json fences / stray prose). */
export function extractJSON<T = Record<string, unknown>>(text: string): T | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(text.slice(start, end + 1)) as T; } catch { return null; }
}

// Tiny in-memory rate limiter (per server instance). Use Redis/Upstash for multi-instance production.
const hits = new Map<string, number[]>();
export function rateLimited(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter(t => now - t < windowMs);
  if (recent.length >= limit) { hits.set(key, recent); return true; }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < windowMs)) hits.delete(k);
  return false;
}

export function clientKey(req: Request) {
  return (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
}

export function aiErrorResponse(e: unknown) {
  if (e instanceof AINotConfiguredError) return { status: 503, body: { configured: false, error: e.message } };
  const msg = e instanceof Error ? e.message : "AI request failed.";
  return { status: 502, body: { configured: true, error: msg } };
}

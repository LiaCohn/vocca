import { z } from "zod";

import { getAuthSession } from "@/auth";

const requestSchema = z.object({
  text: z.string().trim().min(1).max(100),
});

const completionSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string(),
      }),
    }),
  ),
});

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let text: string;
  try {
    text = requestSchema.parse(await request.json()).text;
  } catch {
    return Response.json({ error: "Enter a valid word." }, { status: 400 });
  }

  const apiKey = process.env.GROQ_WORD_MEANING;
  if (!apiKey) {
    return Response.json({ error: "Meaning suggestions are not configured." }, { status: 503 });
  }

  let response: Response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages: [
          {
            role: "system",
            content:
              "Give a short, clear, beginner-friendly English definition of the given word. Use one simple sentence of at most 15 words. Return only the definition.",
          },
          { role: "user", content: text },
        ],
        temperature: 0.2,
        max_tokens: 60,
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    console.error("[meaning] Groq request failed before receiving a response.", error);
    return Response.json({ error: "Meaning service unavailable. Please try again." }, { status: 502 });
  }

  if (!response.ok) {
    let providerError = "No provider error details.";
    try {
      const body: unknown = await response.json();
      if (
        body &&
        typeof body === "object" &&
        "error" in body &&
        body.error &&
        typeof body.error === "object" &&
        "message" in body.error &&
        typeof body.error.message === "string"
      ) {
        providerError = body.error.message.slice(0, 500);
      }
    } catch {
      providerError = "Groq returned a non-JSON error response.";
    }
    console.error("[meaning] Groq rejected the request.", { status: response.status, providerError });
    return Response.json({ error: "Meaning service unavailable. Please try again." }, { status: 502 });
  }

  let completion: unknown;
  try {
    completion = await response.json();
  } catch {
    return Response.json({ error: "Meaning service returned an invalid response." }, { status: 502 });
  }

  const parsedCompletion = completionSchema.safeParse(completion);
  const meaning = parsedCompletion.success ? parsedCompletion.data.choices[0]?.message.content.trim() : "";
  if (!meaning) {
    return Response.json({ error: "Meaning service returned an invalid response." }, { status: 502 });
  }

  return Response.json({ meaning });
}

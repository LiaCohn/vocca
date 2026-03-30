import { z } from "zod";

import { createWord, getOwnerId, listWords } from "@/data/word-store";

const createWordSchema = z.object({
  text: z.string().min(1),
  meaning: z.string().optional(),
  example: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isHard: z.boolean().optional(),
});

export async function GET() {
  const words = await listWords(getOwnerId());
  return Response.json(words);
}

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const payload = createWordSchema.parse(raw);
    const word = await createWord(getOwnerId(), payload);
    return Response.json(word, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
}

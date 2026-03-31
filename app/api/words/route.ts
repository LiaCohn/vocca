import { z } from "zod";

import { getAuthSession } from "@/auth";
import { createWord, listWords } from "@/data/word-store";

const createWordSchema = z.object({
  text: z.string().min(1),
  meaning: z.string().optional(),
  example: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isHard: z.boolean().optional(),
});

export async function GET() {
  const session = await getAuthSession();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const words = await listWords(ownerId);
  return Response.json(words);
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const raw = await request.json();
    const payload = createWordSchema.parse(raw);
    const word = await createWord(ownerId, payload);
    return Response.json(word, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
}

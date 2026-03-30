import { z } from "zod";

import { getOwnerId, getWordById, removeWord, updateWord } from "@/data/word-store";

const updateWordSchema = z.object({
  text: z.string().optional(),
  meaning: z.string().optional(),
  example: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isHard: z.boolean().optional(),
});

type RouteParams = { id: string };

export async function GET(_request: Request, { params }: { params: Promise<RouteParams> }) {
  const { id } = await params;
  const word = await getWordById(getOwnerId(), id);
  if (!word) {
    return Response.json({ error: "Word not found." }, { status: 404 });
  }
  return Response.json(word);
}

export async function PATCH(request: Request, { params }: { params: Promise<RouteParams> }) {
  const { id } = await params;

  try {
    const raw = await request.json();
    const payload = updateWordSchema.parse(raw);
    const word = await updateWord(getOwnerId(), id, payload);
    if (!word) {
      return Response.json({ error: "Word not found." }, { status: 404 });
    }
    return Response.json(word);
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<RouteParams> }) {
  const { id } = await params;
  await removeWord(getOwnerId(), id);
  return new Response(null, { status: 204 });
}

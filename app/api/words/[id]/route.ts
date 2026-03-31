import { z } from "zod";

import { getAuthSession } from "@/auth";
import { getWordById, removeWord, updateWord } from "@/data/word-store";

const updateWordSchema = z.object({
  text: z.string().optional(),
  meaning: z.string().optional(),
  example: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isHard: z.boolean().optional(),
});

type RouteParams = { id: string };

export async function GET(_request: Request, { params }: { params: Promise<RouteParams> }) {
  const session = await getAuthSession();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const word = await getWordById(ownerId, id);
  if (!word) {
    return Response.json({ error: "Word not found." }, { status: 404 });
  }
  return Response.json(word);
}

export async function PATCH(request: Request, { params }: { params: Promise<RouteParams> }) {
  const session = await getAuthSession();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const raw = await request.json();
    const payload = updateWordSchema.parse(raw);
    const word = await updateWord(ownerId, id, payload);
    if (!word) {
      return Response.json({ error: "Word not found." }, { status: 404 });
    }
    return Response.json(word);
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<RouteParams> }) {
  const session = await getAuthSession();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  await removeWord(ownerId, id);
  return new Response(null, { status: 204 });
}

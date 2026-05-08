import { z } from "zod";

import { getAuthSession } from "@/auth";
import { assignWordToList, listWordsInList, unassignWordFromList } from "@/data/list-store";

const assignSchema = z.object({
  wordId: z.string().uuid(),
});

type RouteParams = { id: string };

export async function GET(_request: Request, { params }: { params: Promise<RouteParams> }) {
  const session = await getAuthSession();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const words = await listWordsInList(ownerId, id);
  if (!words) {
    return Response.json({ error: "List not found." }, { status: 404 });
  }
  return Response.json(words);
}

export async function POST(request: Request, { params }: { params: Promise<RouteParams> }) {
  const session = await getAuthSession();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const raw = await request.json();
    const payload = assignSchema.parse(raw);
    const assigned = await assignWordToList(ownerId, id, payload.wordId);
    if (!assigned) {
      return Response.json({ error: "List or word not found." }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<RouteParams> }) {
  const session = await getAuthSession();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const raw = await request.json();
    const payload = assignSchema.parse(raw);
    const removed = await unassignWordFromList(ownerId, id, payload.wordId);
    if (!removed) {
      return Response.json({ error: "List-word assignment not found." }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
}

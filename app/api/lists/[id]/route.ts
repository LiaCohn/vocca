import { z } from "zod";

import { getAuthSession } from "@/auth";
import { getListById, removeList, updateList } from "@/data/list-store";

const updateListSchema = z.object({
  name: z.string().min(1),
});

type RouteParams = { id: string };

export async function GET(_request: Request, { params }: { params: Promise<RouteParams> }) {
  const session = await getAuthSession();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const list = await getListById(ownerId, id);
  if (!list) {
    return Response.json({ error: "List not found." }, { status: 404 });
  }
  return Response.json(list);
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
    const payload = updateListSchema.parse(raw);
    const list = await updateList(ownerId, id, payload);
    if (!list) {
      return Response.json({ error: "List not found." }, { status: 404 });
    }
    return Response.json(list);
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
  const removed = await removeList(ownerId, id);
  if (!removed) {
    return Response.json({ error: "List not found." }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}

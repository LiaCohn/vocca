import { z } from "zod";

import { getAuthSession } from "@/auth";
import { createList, listLists } from "@/data/list-store";

const createListSchema = z.object({
  name: z.string().min(1),
});

export async function GET() {
  const session = await getAuthSession();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const lists = await listLists(ownerId);
  return Response.json(lists);
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const raw = await request.json();
    const payload = createListSchema.parse(raw);
    const list = await createList(ownerId, payload);
    return Response.json(list, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
}

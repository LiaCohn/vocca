import { getAuthSession } from "@/auth";
import { listListIdsForWord } from "@/data/list-store";

type RouteParams = { id: string };

export async function GET(_request: Request, { params }: { params: Promise<RouteParams> }) {
  const session = await getAuthSession();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const listIds = await listListIdsForWord(ownerId, id);
  if (!listIds) {
    return Response.json({ error: "Word not found." }, { status: 404 });
  }

  return Response.json({ listIds });
}

import { z } from "zod";

import { getAuthSession } from "@/auth";
import { recordQuizResult } from "@/data/word-store";

const quizResultSchema = z.object({
  isCorrect: z.boolean(),
});

type RouteParams = { id: string };

export async function POST(request: Request, { params }: { params: Promise<RouteParams> }) {
  const session = await getAuthSession();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const raw = await request.json();
    const payload = quizResultSchema.parse(raw);
    const word = await recordQuizResult(ownerId, id, payload.isCorrect);
    if (!word) {
      return Response.json({ error: "Word not found." }, { status: 404 });
    }
    return Response.json(word);
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
}

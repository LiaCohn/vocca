import { z } from "zod";

import { getOwnerId, recordQuizResult } from "@/data/word-store";

const quizResultSchema = z.object({
  isCorrect: z.boolean(),
});

type RouteParams = { id: string };

export async function POST(request: Request, { params }: { params: Promise<RouteParams> }) {
  const { id } = await params;

  try {
    const raw = await request.json();
    const payload = quizResultSchema.parse(raw);
    const word = await recordQuizResult(getOwnerId(), id, payload.isCorrect);
    if (!word) {
      return Response.json({ error: "Word not found." }, { status: 404 });
    }
    return Response.json(word);
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
}

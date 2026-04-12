import { Suspense } from "react";

import QuizRunClient from "./quiz-run-client";

export default function QuizRunPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-600">Preparing quiz...</p>}>
      <QuizRunClient />
    </Suspense>
  );
}

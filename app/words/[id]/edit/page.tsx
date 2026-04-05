"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { WordForm } from "@/components/word-form";
import type { Word } from "@/domain/types";
import { getWordRepository } from "@/data/word-repository";

export default function EditWordPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [word, setWord] = useState<Word | null>(null);

  useEffect(() => {
    getWordRepository()
      .getById(params.id)
      .then(setWord);
  }, [params.id]);

  if (!word) {
    return <p className="text-sm text-zinc-600">Word not found.</p>;
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit word</h1>
      <WordForm
        initialValues={{
          text: word.text,
          meaning: word.meaning ?? "",
          example: word.example ?? "",
          tags: word.tags,
        }}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          await getWordRepository().update(word.id, {
            text: values.text,
            meaning: values.meaning,
            example: values.example,
            tags: values.tags,
          });
          router.push("/");
        }}
      />
    </section>
  );
}

"use client";

import { useRouter } from "next/navigation";

import { WordForm } from "@/components/word-form";
import { getWordRepository } from "@/data/word-repository";

export default function NewWordPage() {
  const router = useRouter();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Add word</h1>
      <WordForm
        submitLabel="Save"
        onSubmit={async (values) => {
          await getWordRepository().create({
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

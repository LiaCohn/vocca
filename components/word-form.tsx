"use client";

import { useMemo, useState } from "react";

type WordFormValues = {
  text: string;
  meaning: string;
  example: string;
};

type WordFormProps = {
  initialValues?: Partial<WordFormValues>;
  submitLabel: string;
  onSubmit: (values: WordFormValues) => Promise<void>;
};

export function WordForm({ initialValues, submitLabel, onSubmit }: WordFormProps) {
  const defaults = useMemo<WordFormValues>(
    () => ({
      text: initialValues?.text ?? "",
      meaning: initialValues?.meaning ?? "",
      example: initialValues?.example ?? "",
    }),
    [initialValues],
  );

  const [values, setValues] = useState(defaults);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.text.trim()) {
      setError("Word is required.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await onSubmit(values);
    } catch {
      setError("Could not save word. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
      <div>
        <label htmlFor="text" className="mb-1 block text-sm font-medium">
          Word *
        </label>
        <input
          id="text"
          autoFocus
          value={values.text}
          onChange={(event) => setValues((current) => ({ ...current, text: event.target.value }))}
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
          placeholder="e.g. meticulous"
        />
      </div>

      <div>
        <label htmlFor="meaning" className="mb-1 block text-sm font-medium">
          Meaning
        </label>
        <textarea
          id="meaning"
          value={values.meaning}
          onChange={(event) => setValues((current) => ({ ...current, meaning: event.target.value }))}
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
          rows={3}
          placeholder="Optional, but recommended for quizzes"
        />
      </div>

      <div>
        <label htmlFor="example" className="mb-1 block text-sm font-medium">
          Example sentence
        </label>
        <textarea
          id="example"
          value={values.example}
          onChange={(event) => setValues((current) => ({ ...current, example: event.target.value }))}
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
          rows={3}
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

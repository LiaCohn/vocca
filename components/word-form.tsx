"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { WandSparkles } from "lucide-react";
import { z } from "zod";

const TAG_DEBOUNCE_MS = 500;

type WordFormValues = {
  text: string;
  meaning: string;
  example: string;
  tags: string[];
};

type WordFormProps = {
  initialValues?: Partial<WordFormValues>;
  submitLabel: string;
  onSubmit: (values: WordFormValues) => Promise<void>;
};

const wordFormSchema = z.object({
  text: z.string().trim().min(1, "Word is required."),
  meaning: z.string().trim().min(1, "Meaning is required."),
  example: z.string(),
  tags: z.array(z.string()),
});

function TagBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  const isMust = label.toLowerCase() === "must";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border py-0.5 ps-2 pe-1 text-xs font-bold ${
        isMust
          ? "border-amber-200 bg-vocca-must-bg text-vocca-must-text"
          : "border-vocca-border bg-vocca-bg text-vocca-primary"
      }`}
    >
      <span>{label}</span>
      <button
        type="button"
        className="inline-flex items-center rounded-full bg-transparent p-0.5 hover:bg-black/5"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onRemove}
        aria-label={`Remove tag ${label}`}
      >
        <svg className="h-3 w-3" aria-hidden xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6" />
        </svg>
      </button>
    </span>
  );
}

export function WordForm({ initialValues, submitLabel, onSubmit }: WordFormProps) {
  const defaults = useMemo<WordFormValues>(
    () => ({
      text: initialValues?.text ?? "",
      meaning: initialValues?.meaning ?? "",
      example: initialValues?.example ?? "",
      tags: initialValues?.tags?.length ? [...initialValues.tags] : [],
    }),
    [initialValues],
  );

  const [values, setValues] = useState(defaults);
  const [tags, setTags] = useState<string[]>(defaults.tags);
  const [tagDraft, setTagDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingMeaning, setGeneratingMeaning] = useState(false);
  const tagDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canSubmit = values.text.trim().length > 0 && values.meaning.trim().length > 0;

  function clearTagDebounce() {
    if (tagDebounceRef.current) {
      clearTimeout(tagDebounceRef.current);
      tagDebounceRef.current = null;
    }
  }

  function commitTagText(raw: string) {
    clearTagDebounce();
    const next = raw.trim();
    if (!next) return;
    setTags((prev) => (prev.includes(next) ? prev : [...prev, next]));
    setTagDraft("");
  }

  useEffect(() => {
    const trimmed = tagDraft.trim();
    if (!trimmed) {
      clearTagDebounce();
      return;
    }

    clearTagDebounce();
    tagDebounceRef.current = setTimeout(() => {
      tagDebounceRef.current = null;
      setTags((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
      setTagDraft("");
    }, TAG_DEBOUNCE_MS);

    return clearTagDebounce;
  }, [tagDraft]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    clearTagDebounce();
    const draft = tagDraft.trim();
    const tagsForSubmit = draft && !tags.includes(draft) ? [...tags, draft] : tags;

    const parsed = wordFormSchema.safeParse({ ...values, tags: tagsForSubmit });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please fix the form and try again.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await onSubmit(parsed.data);
    } catch {
      setError("Could not save word. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGenerateMeaning() {
    const text = values.text.trim();
    if (!text) return;

    setError(null);
    setGeneratingMeaning(true);

    try {
      const response = await fetch("/api/words/meaning", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new Error("Could not generate a meaning. Please try again.");
      }

      if (!payload || typeof payload !== "object") {
        throw new Error("Could not generate a meaning. Please try again.");
      }

      const result = payload as { error?: unknown; meaning?: unknown };
      if (!response.ok) {
        throw new Error(
          typeof result.error === "string" ? result.error : "Could not generate a meaning. Please try again.",
        );
      }
      const meaning = result.meaning;
      if (typeof meaning !== "string" || !meaning.trim()) {
        throw new Error("Could not generate a meaning. Please try again.");
      }

      setValues((current) => ({ ...current, meaning: meaning.trim() }));
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Could not generate a meaning. Please try again.");
    } finally {
      setGeneratingMeaning(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="vocca-card space-y-4 p-4 sm:p-5">
      <div>
        <label htmlFor="text" className="mb-1.5 block text-sm font-bold text-vocca-ink">
          Word *
        </label>
        <input
          id="text"
          autoFocus
          value={values.text}
          disabled={generatingMeaning}
          onChange={(event) => {
            setValues((current) => ({ ...current, text: event.target.value }));
            setError(null);
          }}
          className="vocca-input font-display text-lg"
          placeholder="e.g. meticulous"
        />
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-bold text-vocca-ink">Tags</span>
        <div className="flex min-h-[44px] w-full flex-wrap items-center gap-2 rounded-xl border-2 border-vocca-border bg-white px-2 py-2 focus-within:border-vocca-primary focus-within:ring-2 focus-within:ring-vocca-primary/20">
          {tags.map((tag) => (
            <TagBadge key={tag} label={tag} onRemove={() => setTags((prev) => prev.filter((t) => t !== tag))} />
          ))}
          <input
            id="tags"
            type="text"
            value={tagDraft}
            onChange={(event) => setTagDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                clearTagDebounce();
                commitTagText(tagDraft);
                return;
              }
              if (event.key === "Backspace" && !tagDraft && tags.length > 0) {
                event.preventDefault();
                setTags((prev) => prev.slice(0, -1));
              }
            }}
            onBlur={(event) => {
              const t = event.currentTarget.value.trim();
              if (!t) return;
              clearTagDebounce();
              commitTagText(t);
            }}
            className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-vocca-ink-muted/60"
            placeholder="Type a tag — try must"
            autoComplete="off"
          />
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label htmlFor="meaning" className="block text-sm font-bold text-vocca-ink">
            Meaning *
          </label>
          <span className="group relative inline-flex">
            <button
              type="button"
              onClick={handleGenerateMeaning}
              disabled={generatingMeaning || !values.text.trim()}
              aria-label={generatingMeaning ? "Getting meaning" : "Get meaning"}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-vocca-bg focus:outline-none focus:ring-2 focus:ring-vocca-primary/30 disabled:cursor-wait disabled:opacity-60"
            >
              <WandSparkles size={20} color="#a855f7" strokeWidth={1.5} aria-hidden="true" />
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-md bg-vocca-ink px-2 py-1 text-xs font-medium text-white opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
            >
              {generatingMeaning ? "Getting meaning..." : "Get meaning"}
            </span>
          </span>
        </div>
        <textarea
          id="meaning"
          value={values.meaning}
          onChange={(event) => setValues((current) => ({ ...current, meaning: event.target.value }))}
          className="vocca-input"
          rows={3}
          placeholder="What does it mean?"
        />
      </div>

      <div>
        <label htmlFor="example" className="mb-1.5 block text-sm font-bold text-vocca-ink">
          Example sentence
        </label>
        <textarea
          id="example"
          value={values.example}
          onChange={(event) => setValues((current) => ({ ...current, example: event.target.value }))}
          className="vocca-input"
          rows={3}
          placeholder="Use it in a sentence..."
        />
      </div>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <button type="submit" disabled={submitting || generatingMeaning || !canSubmit} className="vocca-btn-primary w-full sm:w-auto">
        {submitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

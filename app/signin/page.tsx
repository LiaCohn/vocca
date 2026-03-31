"use client";

import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Vocca</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Welcome back</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Sign in to sync your words, quiz history, and progress to your personal account.
        </p>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
        >
          <GoogleMark />
          Continue with Google
        </button>

        <p className="mt-4 text-center text-xs text-zinc-500">Only your account can access your saved words.</p>
      </div>
    </section>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.2-.8 2.1-1.7 2.8l2.8 2.2c1.6-1.5 2.6-3.8 2.6-6.5 0-.6-.1-1.2-.2-1.8H12z"
      />
      <path
        fill="#34A853"
        d="M12 21c2.4 0 4.5-.8 6-2.1l-2.8-2.2c-.8.5-1.8.9-3.2.9-2.4 0-4.3-1.6-5-3.7l-2.9 2.3C5.6 19.2 8.6 21 12 21z"
      />
      <path fill="#FBBC05" d="M7 13.9c-.2-.5-.3-1.2-.3-1.9s.1-1.3.3-1.9L4.1 7.8C3.4 9.1 3 10.5 3 12s.4 2.9 1.1 4.2L7 13.9z" />
      <path
        fill="#4285F4"
        d="M12 6.4c1.3 0 2.5.5 3.4 1.3l2.6-2.6C16.5 3.8 14.4 3 12 3 8.6 3 5.6 4.8 4.1 7.8L7 10.1c.7-2.1 2.6-3.7 5-3.7z"
      />
    </svg>
  );
}

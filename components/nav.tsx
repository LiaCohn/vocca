"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

const links = [
  { href: "/", label: "Home" },
  { href: "/words/new", label: "Add Word" },
  { href: "/quiz", label: "Quiz" },
];

export function Nav() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <nav className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
        <span className="mr-2 text-lg font-semibold">Vocca</span>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-100"
          >
            {link.label}
          </Link>
        ))}
        </div>

        <div className="flex items-center gap-2">
          {status === "authenticated" && user ? (
            <>
              <p className="hidden text-xs text-zinc-600 sm:block">{user.email ?? user.name ?? "Signed in"}</p>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-100"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="rounded-md bg-zinc-900 px-3 py-1 text-sm font-semibold text-white hover:bg-zinc-700"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

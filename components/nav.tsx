"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

const links = [
  { href: "/", label: "Home" },
  { href: "/words/new", label: "Add" },
  { href: "/lists", label: "Lists" },
  { href: "/quiz", label: "Quiz" },
];

export function Nav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-20 border-b-2 border-vocca-border bg-white/90 backdrop-blur-md">
      <div className="mx-auto w-full max-w-lg px-3 py-3 sm:max-w-xl sm:px-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="font-display text-2xl font-semibold text-vocca-primary">
              Vocca
            </Link>

            <div className="flex shrink-0 items-center gap-1.5">
              {status === "authenticated" && user ? (
                <>
                  <p className="hidden max-w-[8rem] truncate text-xs font-medium text-vocca-ink-muted sm:block">
                    {user.email ?? user.name ?? "Signed in"}
                  </p>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="vocca-btn-secondary px-2.5 py-1 text-xs"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/" })}
                  className="vocca-btn-primary px-3 py-1.5 text-xs"
                >
                  Sign in
                </button>
              )}
            </div>
          </div>

          <nav
            className="-mx-1 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Main"
          >
            {links.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`shrink-0 rounded-full border-2 px-3.5 py-1.5 text-xs font-bold transition sm:text-sm ${
                    isActive
                      ? "border-vocca-primary bg-vocca-primary text-white shadow-[var(--vocca-shadow-sm)]"
                      : "border-vocca-border bg-vocca-bg text-vocca-ink hover:border-vocca-coral/50 hover:bg-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

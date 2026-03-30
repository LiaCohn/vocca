import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/words/new", label: "Add Word" },
  { href: "/quiz", label: "Quiz" },
];

export function Nav() {
  return (
    <nav className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-3">
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
    </nav>
  );
}

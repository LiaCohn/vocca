import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";

import { AuthSessionProvider } from "@/components/auth-session-provider";
import { Nav } from "@/components/nav";

import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Vocca",
  description: "Local-first vocabulary trainer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} ${fredoka.variable} h-full antialiased`}>
      <body className="min-h-full font-sans text-vocca-ink">
        <AuthSessionProvider>
          <Nav />
          <main className="mx-auto w-full max-w-lg px-4 py-5 pb-10 sm:max-w-xl sm:py-6">{children}</main>
        </AuthSessionProvider>
      </body>
    </html>
  );
}

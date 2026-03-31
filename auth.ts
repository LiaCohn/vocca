import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const TWO_WEEKS_IN_SECONDS = 60 * 60 * 24 * 14;

function getRequiredEnv(name: "AUTH_GOOGLE_ID" | "AUTH_GOOGLE_SECRET" | "AUTH_SECRET"): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is not set.`);
  }
  return value;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: getRequiredEnv("AUTH_GOOGLE_ID"),
      clientSecret: getRequiredEnv("AUTH_GOOGLE_SECRET"),
    }),
  ],
  secret: getRequiredEnv("AUTH_SECRET"),
  session: {
    strategy: "jwt",
    maxAge: TWO_WEEKS_IN_SECONDS,
  },
  jwt: {
    maxAge: TWO_WEEKS_IN_SECONDS,
  },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}

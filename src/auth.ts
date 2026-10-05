import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { canUseSite, upsertUser } from "@/lib/data";

/** Local development only: sign in as any Stanford email without Google. Never enabled in production. */
export const devLoginEnabled = process.env.NODE_ENV === "development";
const devLogin = Credentials({
  id: "dev",
  credentials: { email: {} },
  authorize: (c) => {
    const email = String(c.email ?? "").toLowerCase();
    return email ? { email, name: email.split("@")[0] } : null;
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          hd: "stanford.edu", // tells Google to show Stanford accounts
          prompt: "select_account",
        },
      },
    }),
    ...(devLoginEnabled ? [devLogin] : []),
  ],
  pages: { signIn: "/", error: "/" }, // errors show up as a friendly message on the home page
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider === "dev" && devLoginEnabled) {
        if (!(await canUseSite(user.email!))) return false;
        await upsertUser(user.email!, user.name ?? "");
        return true;
      }
      const email = profile?.email?.toLowerCase();
      if (!email || profile?.email_verified !== true) return false;
      if (!(await canUseSite(email))) return false;
      await upsertUser(email, profile?.name ?? "");
      return true;
    },
  },
});

/** The signed-in user's email (lowercased), or null. */
export async function currentEmail() {
  const session = await auth();
  return session?.user?.email?.toLowerCase() ?? null;
}

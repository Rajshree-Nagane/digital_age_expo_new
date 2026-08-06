import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyMemberCredentials } from "@/lib/services/member";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        const user = await verifyMemberCredentials(credentials.identifier, credentials.password);
        if (!user) return null;

        return {
          id: String(user.id),
          name: `${user.user_first_name} ${user.user_last_name}`.trim(),
          email: user.user_email,
          login: user.login,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.login = user.login;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId;
        session.user.login = token.login;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "findusonweb_nextauth_secret_key_2026",
};

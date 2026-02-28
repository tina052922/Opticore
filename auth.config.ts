import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

// Auth.js requires a secret. Use AUTH_SECRET; in dev only, fallback so the app doesn't crash.
const authSecret =
  process.env.AUTH_SECRET ||
  (process.env.NODE_ENV === "development"
    ? (() => {
        if (typeof console !== "undefined" && console.warn) {
          console.warn(
            "[auth] AUTH_SECRET not set. Set AUTH_SECRET in .env for production. Using dev placeholder."
          );
        }
        return "opticore-dev-secret-minimum-32-characters-long";
      })()
    : undefined);

export const { auth, signIn, signOut, handlers } = NextAuth({
  secret: authSecret,
  session: {
    strategy: "jwt"
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (!email || typeof email !== "string" || !password || typeof password !== "string")
          return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email: email as string }
          });

          if (!user) return null;
          if (!user.passwordHash) return null;

          const passwordValid = await compare(password, user.passwordHash);

          if (!passwordValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            department: user.department,
            collegeId: user.collegeId,
            programId: user.programId,
            sectionId: user.sectionId
          } as any;
        } catch (err: unknown) {
          const msg = err && typeof (err as Error).message === "string" ? (err as Error).message : "";
          if (msg.includes("DATABASE_URL") || msg.includes("Environment variable not found")) {
            if (typeof console !== "undefined" && console.warn) {
              console.warn("[auth] Database not configured. Set DATABASE_URL in .env and run migrations.");
            }
          }
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = (user as any).id;
        token.role = (user as any).role;
        token.department = (user as any).department;
        token.collegeId = (user as any).collegeId;
        token.programId = (user as any).programId;
        (token as any).sectionId = (user as any).sectionId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub ?? (token as any).id;
        (session.user as any).role = token.role;
        (session.user as any).department = (token as any).department;
        (session.user as any).collegeId = (token as any).collegeId;
        (session.user as any).programId = (token as any).programId;
        (session.user as any).sectionId = (token as any).sectionId;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  }
});


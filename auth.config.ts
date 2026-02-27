import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

// NOTE: For demo, passwords are seeded as bcrypt hashes.

export const { auth, signIn, signOut, handlers } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
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
        const rawEmail = credentials?.email;
        const password = credentials?.password;
        if (!rawEmail || typeof rawEmail !== "string" || !password || typeof password !== "string")
          return null;

        const email = rawEmail.trim().toLowerCase();
        if (!email) return null;

        let user;
        try {
          user = await prisma.user.findUnique({
            where: { email }
          });
        } catch {
          return null;
        }

        if (!user?.passwordHash) return null;

        let passwordValid = false;
        try {
          passwordValid = await compare(password, user.passwordHash);
        } catch {
          return null;
        }
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


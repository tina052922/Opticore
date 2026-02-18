import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

// NOTE: For demo, passwords can be seeded as bcrypt hashes.

export const { auth, signIn, signOut, handlers } = NextAuth({
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
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) return null;
        if (!user.passwordHash) return null;

        // In seed data, store a bcrypt hash for demo users.
        const passwordValid = await compare(credentials.password, user.passwordHash);

        if (!passwordValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          departmentId: user.departmentId
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.departmentId = (user as any).departmentId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).departmentId = token.departmentId;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  }
});


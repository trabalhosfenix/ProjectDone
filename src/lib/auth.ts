import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciais inválidas");
        }

        // Optimization: Fetch user AND role/permissions in a single query
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { userRole: true } 
        });

        if (!user || !user.password) {
          throw new Error("Usuário não encontrado");
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) {
          throw new Error("Senha incorreta");
        }

        // Return user data including permissions to avoid 2nd query in JWT callback
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.userRole?.permissions || null
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Initial sign in - use data from authorize
        token.id = user.id;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).permissions = token.permissions;
      }
      return session;
    },
  },
};

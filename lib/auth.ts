import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import NextAuth from "next-auth";
import { prisma } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    authorized: async ({ auth }) => {
      return !!auth
    },
    async session({ session, user }: any) {
      // Add user ID to the session
      if (session.user) {
        session.user.id = user.id

        // Get usage data from the database
        const userData = await prisma.user.findUnique({
          where: { id: user.id },
          include: { usage: true },
        })

        // Add usage data to the session
        session.user.usage = userData?.usage || { uploadsRemaining: 1 }
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    
  },
})
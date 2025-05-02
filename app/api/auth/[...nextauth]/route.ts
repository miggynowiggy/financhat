import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
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
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

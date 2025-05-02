import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action } = await req.json()

    if (action === "decrementUploads") {
      // Get current usage
      let usage = await prisma.usage.findUnique({
        where: { userId: session.user.id },
      })

      // If no usage record exists, create one
      if (!usage) {
        usage = await prisma.usage.create({
          data: {
            userId: session.user.id,
            uploadsRemaining: 1, // Start with 1 upload
          },
        })
      }

      // Decrement uploads if any remaining
      if (usage.uploadsRemaining > 0) {
        await prisma.usage.update({
          where: { userId: session.user.id },
          data: {
            uploadsRemaining: {
              decrement: 1,
            },
          },
        })

        return NextResponse.json({ success: true })
      } else {
        return NextResponse.json({ error: "No uploads remaining" }, { status: 403 })
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating usage:", error)
    return NextResponse.json({ error: "Failed to update usage" }, { status: 500 })
  }
}

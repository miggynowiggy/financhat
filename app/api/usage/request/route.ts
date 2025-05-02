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

    const { reason } = await req.json()

    if (!reason) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 })
    }

    // Create a request record
    await prisma.uploadRequest.create({
      data: {
        userId: session.user.id,
        reason,
        status: "PENDING",
      },
    })

    // In a real app, you might want to send an email notification to the admin
    // sendEmailToAdmin(session.user, reason);

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating request:", error)
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 })
  }
}

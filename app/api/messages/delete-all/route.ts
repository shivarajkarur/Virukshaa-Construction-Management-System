import { NextRequest, NextResponse } from "next/server"
import connectToDB from "@/lib/db"
import Message from "@/models/Message"
import { deleteFromR2 } from "@/lib/cloudflare-r2"
import mongoose from "mongoose"

export async function POST(req: NextRequest) {
  try {
    const { conversationId } = await req.json().catch(() => ({})) as { conversationId?: string }
    if (!conversationId || !String(conversationId).trim()) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 })
    }

    await connectToDB()

    // Fetch all messages to collect attachments (minimized projection)
    const messages = await Message.find({ conversationId }, { attachment: 1 }).lean().exec()

    // Collect file URLs to delete
    const fileUrls: string[] = []
    for (const m of messages) {
      const url = (m as any)?.attachment?.fileUrl
      if (url && typeof url === "string") fileUrls.push(url)
    }

    // Delete attachments from storage first to avoid bloat
    for (const url of fileUrls) {
      try {
        await deleteFromR2(url)
      } catch (err) {
        console.error("Attachment delete failed:", url, err)
        return NextResponse.json({ error: "Failed to delete one or more attachments" }, { status: 500 })
      }
    }

    // Use a transaction to delete messages atomically at the DB level
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      const res = await Message.deleteMany({ conversationId }).session(session)
      await session.commitTransaction()
      session.endSession()
      return NextResponse.json({ success: true, deletedCount: res.deletedCount || 0, attachmentCount: fileUrls.length })
    } catch (err) {
      await session.abortTransaction().catch(() => null)
      session.endSession()
      console.error("Message deletion failed:", err)
      return NextResponse.json({ error: "Failed to delete messages" }, { status: 500 })
    }
  } catch (error) {
    console.error("Delete-all messages error:", error)
    return NextResponse.json({ error: "Failed to delete all messages" }, { status: 500 })
  }
}

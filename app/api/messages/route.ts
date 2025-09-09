import { NextResponse } from "next/server"
import connectToDB from "@/lib/db"
import Message from "@/models/Message"

// Type for message creation request body
interface CreateMessageRequest {
  text?: string
  sender: "client" | "superadmin"
  conversationId?: string
  attachment?: {
    fileName: string
    fileSize: number
    fileType: string
    fileUrl: string
  }
}

// Type for message response
interface MessageResponse {
  id: string
  text?: string
  sender: "client" | "superadmin"
  timestamp: string
  read: boolean
  attachment?: {
    fileName: string
    fileSize: number
    fileType: string
    fileUrl: string
  }
}

// Create a new message
export async function POST(req: Request) {
  try {
    await connectToDB()

    const { text, sender, conversationId, attachment }: Partial<CreateMessageRequest> = await req.json()

    // Validate request body
    if ((!text?.trim() && !attachment) || !sender) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    if (!["client", "superadmin"].includes(sender)) {
      return NextResponse.json({ success: false, error: "Invalid sender type" }, { status: 400 })
    }

    // Require a conversationId to ensure messages are never written to a global thread unintentionally
    if (!conversationId || !String(conversationId).trim()) {
      return NextResponse.json({ success: false, error: "conversationId is required" }, { status: 400 })
    }

    const message = new Message({
      text: text?.trim() || "",
      sender,
      receiver: sender === "client" ? "superadmin" : "client",
      conversationId: String(conversationId),
      timestamp: new Date(),
      read: false,
      attachment: attachment || undefined,
    })

    await message.save()

    const messageObj = message.toObject()
    const response: MessageResponse = {
      id: messageObj._id.toString(),
      text: messageObj.text,
      sender: messageObj.sender,
      timestamp: messageObj.timestamp.toISOString(),
      read: messageObj.read,
      attachment: messageObj.attachment || undefined,
    }

    return NextResponse.json({ success: true, data: response })
  } catch (error: any) {
    console.error("Error sending message:", error?.message || error)
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 })
  }
}

// Get all messages between client and admin
export async function GET(req: Request) {
  try {
    await connectToDB()
    const { searchParams } = new URL(req.url)
    const seed = searchParams.get("seed")
    const conversationId = searchParams.get("conversationId") || undefined

    // Require conversationId for listing; if missing, return an empty list
    if (!conversationId) {
      return NextResponse.json({ success: true, messages: [] })
    }

    const query: Record<string, any> = { conversationId }

    let messages = await Message.find(query).sort({ timestamp: 1 }).lean().exec()

    // Optional seed for first-time users
    if ((seed === "1" || seed === "true") && (!messages || messages.length === 0)) {
      const now = new Date()
      const seedDocs = [
        new Message({
          text: "Welcome to our support system! I'm here to help you with any questions.",
          sender: "superadmin",
          receiver: "client",
          conversationId,
          timestamp: new Date(now.getTime() - 1000 * 60 * 10), // 10 mins ago
          read: false,
        }),
        new Message({
          text: "Great! Feel free to ask me anything. I'm available 24/7 to assist you.",
          sender: "superadmin",
          receiver: "client",
          conversationId,
          timestamp: new Date(now.getTime() - 1000 * 60 * 5), // 5 mins ago
          read: false,
        }),
      ]
      await Message.insertMany(seedDocs)
      messages = await Message.find(query).sort({ timestamp: 1 }).lean().exec()
    }

    const response: MessageResponse[] = messages.map((msg: any) => ({
      id: msg._id.toString(),
      text: msg.text,
      sender: msg.sender,
      timestamp: msg.timestamp.toISOString(),
      read: msg.read || false,
      attachment: msg.attachment || undefined,
    }))

    return NextResponse.json({ success: true, messages: response })
  } catch (error: any) {
    console.error("Error fetching messages:", error?.message || error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

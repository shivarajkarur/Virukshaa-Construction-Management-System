import { NextResponse } from "next/server"
import connectToDB from "@/lib/db"
import Supervisor from "@/models/Supervisor"

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json()

    if (!identifier || !password) {
      return NextResponse.json({ message: "identifier and password are required" }, { status: 400 })
    }

    await connectToDB()

    // Find by username or email and explicitly select password
    const user: any = await Supervisor.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    }).select("+password")

    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    if (user.password !== password) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Return basic profile info (do not expose password)
    return NextResponse.json({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      username: user.username,
      phone: user.phone,
      status: user.status,
    })
  } catch (e: any) {
    console.error("[auth/supervisor] login error:", e)
    return NextResponse.json({ message: "Auth failed", error: e?.message || "Unknown error" }, { status: 500 })
  }
}

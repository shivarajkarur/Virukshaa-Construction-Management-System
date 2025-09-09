import { NextResponse } from "next/server"

// Mock data for feedback
const feedback = [
  {
    id: 1,
    projectId: 1,
    clientName: "ABC Corporation",
    rating: 5,
    comment: "Excellent progress on the foundation work. Very satisfied with the quality and timeline.",
    date: "2024-11-10",
    status: "Reviewed",
  },
  {
    id: 2,
    projectId: 2,
    clientName: "XYZ Developers",
    rating: 4,
    comment: "Good planning phase. Looking forward to seeing the construction begin.",
    date: "2024-11-08",
    status: "Pending",
  },
  {
    id: 3,
    projectId: 3,
    clientName: "Mall Management Co.",
    rating: 5,
    comment: "Project completed on time and within budget. Highly recommend!",
    date: "2024-11-05",
    status: "Reviewed",
  },
]

export async function GET() {
  return NextResponse.json(feedback)
}

export async function POST(request: Request) {
  const body = await request.json()
  const newFeedback = {
    id: feedback.length + 1,
    date: new Date().toISOString().split("T")[0],
    status: "Pending",
    ...body,
  }
  feedback.push(newFeedback)
  return NextResponse.json(newFeedback, { status: 201 })
}

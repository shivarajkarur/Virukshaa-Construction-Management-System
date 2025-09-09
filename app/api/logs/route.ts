import { NextResponse } from "next/server"

// Mock data for daily logs
const logs = [
  {
    id: 1,
    date: "2024-11-12",
    projectId: 1,
    supervisor: "Mike Wilson",
    workProgress: "Foundation work completed for Block A. Started ground floor construction.",
    materialsUsed: "200 bags cement, 50 tons steel bars, 5000 bricks",
    workersPresent: 28,
    totalWorkers: 32,
    safetyIssues: "Minor cut on worker's hand - first aid provided",
    weatherConditions: "Sunny, 75°F",
    photos: ["progress1.jpg", "progress2.jpg", "progress3.jpg"],
  },
  {
    id: 2,
    date: "2024-11-11",
    projectId: 1,
    supervisor: "Mike Wilson",
    workProgress: "Continued foundation work. 80% complete.",
    materialsUsed: "150 bags cement, 30 tons steel bars, 3000 bricks",
    workersPresent: 30,
    totalWorkers: 32,
    safetyIssues: "None reported",
    weatherConditions: "Partly cloudy, 72°F",
    photos: ["day2_1.jpg", "day2_2.jpg"],
  },
]

export async function GET() {
  return NextResponse.json(logs)
}

export async function POST(request: Request) {
  const body = await request.json()
  const newLog = {
    id: logs.length + 1,
    date: new Date().toISOString().split("T")[0],
    ...body,
  }
  logs.push(newLog)
  return NextResponse.json(newLog, { status: 201 })
}

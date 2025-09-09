   import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import Attendance from "@/models/Attendance";

// GET: Monthly attendance rate for a supervisor
export async function GET(req: NextRequest) {
  await connectToDB();
  try {
    const { searchParams } = new URL(req.url);
    const supervisorId = searchParams.get("supervisorId");
    const month = searchParams.get("month"); // Format: YYYY-MM

    if (!supervisorId || !month) {
      return NextResponse.json({ message: "Missing supervisorId or month" }, { status: 400 });
    }

    // Parse month
    const [year, monthStr] = month.split("-");
    const monthNum = parseInt(monthStr, 10) - 1; // JS months are 0-based
    const startDate = new Date(Date.UTC(Number(year), monthNum, 1));
    const endDate = new Date(Date.UTC(Number(year), monthNum + 1, 0, 23, 59, 59, 999));

    // Get all attendance records for the supervisor in the month
    const records = await Attendance.find({
      supervisorId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate total working days in the month (excluding weekends)
    let totalWorkingDays = 0;
    let presentDays = 0;
    const daysInMonth = endDate.getUTCDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(Date.UTC(Number(year), monthNum, day));
      const weekday = d.getUTCDay();
      if (weekday !== 0 && weekday !== 6) totalWorkingDays++; // Exclude Sunday(0) & Saturday(6)
    }

    // Count present days
    presentDays = records.filter(r => r.status === "Present").length;
    const attendanceRate = totalWorkingDays > 0 ? Math.round((presentDays / totalWorkingDays) * 100) : 0;

    return NextResponse.json({
      supervisorId,
      month,
      totalWorkingDays,
      presentDays,
      attendanceRate
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching monthly attendance rate:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import Attendance from "@/models/Attendance";

// POST: Mark attendance for a supervisor or employee
export async function POST(req: NextRequest) {
  await connectToDB();
  try {
    const { 
      supervisorId, 
      employeeId, 
      date, 
      status, 
      leaveReason, 
      isLeaveApproved, 
      isLeavePaid 
    } = await req.json();

    if ((!supervisorId && !employeeId) || !date || !status) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Use the start of the day in UTC for consistency
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    let filter: any = { date: attendanceDate };
    if (employeeId) {
      filter.employeeId = employeeId;
    } else {
      filter.supervisorId = supervisorId;
    }

    // Prepare update object with all possible fields
    const updateObj: any = { 
      status,
      updatedAt: new Date()
    };

    // Only update leave-related fields if they are provided
    if (leaveReason !== undefined) updateObj.leaveReason = leaveReason;
    if (isLeaveApproved !== undefined) updateObj.isLeaveApproved = isLeaveApproved;
    if (isLeavePaid !== undefined) updateObj.isLeavePaid = isLeavePaid;

    // If marking as absent without leave approval, ensure leave fields are cleared
    if (status === 'Absent' && isLeaveApproved === false) {
      updateObj.leaveReason = '';
      updateObj.isLeavePaid = false;
    }

    const attendance = await Attendance.findOneAndUpdate(
      filter,
      updateObj,
      { 
        upsert: true, 
        new: true, 
        setDefaultsOnInsert: true,
        runValidators: true
      }
    );

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error("Error marking attendance:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// GET: Fetch attendance for a specific date or date range (optionally by employeeId or supervisorId)
export async function GET(req: NextRequest) {
  await connectToDB();
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const employeeId = searchParams.get("employeeId");
    const supervisorId = searchParams.get("supervisorId");
    const supervisorIds = searchParams.get("supervisorIds");
    const includeLeave = searchParams.get("includeLeave") === 'true';

    let filter: any = {};

    if (startDate && endDate) {
      // Range query - respect precise boundaries passed by client (already ISO/Z-aware)
      const start = new Date(startDate);
      const end = new Date(endDate);
      filter.date = { $gte: start, $lte: end };
    } else {
      // Single day query (default behavior)
      const targetDate = date ? new Date(date) : new Date();
      targetDate.setUTCHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setUTCDate(targetDate.getUTCDate() + 1);
      filter.date = { $gte: targetDate, $lt: nextDay };
    }

    if (employeeId) {
      filter.employeeId = employeeId;
    } else if (supervisorId) {
      filter.supervisorId = supervisorId;
    } else if (supervisorIds) {
      // Handle multiple supervisor IDs
      const ids = supervisorIds.split(',');
      if (ids.length > 0) {
        filter.supervisorId = { $in: ids };
      }
    }

    // If includeLeave is true, only return leave records
    if (includeLeave) {
      filter.status = 'Absent';
      filter.isLeaveApproved = true;
    }

    // Select all fields including leave-related ones
    const attendanceRecords = await Attendance.find(filter)
      .populate("supervisorId", "_id name email phone salary")
      .populate("employeeId", "_id name email position")
      .sort({ date: 1 });

    return NextResponse.json(attendanceRecords, { status: 200 });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message }, 
      { status: 500 }
    );
  }
}


// Mock data for attendance
const attendance = [
  {
    id: 1,
    date: "2024-11-12",
    projectId: 1,
    workers: [
      { id: 1, name: "John Doe", role: "Mason", status: "Present", checkIn: "08:00", checkOut: "17:00" },
      { id: 2, name: "Jane Smith", role: "Carpenter", status: "Present", checkIn: "08:15", checkOut: "17:15" },
      { id: 3, name: "Bob Johnson", role: "Electrician", status: "Absent", checkIn: null, checkOut: null },
      { id: 4, name: "Alice Brown", role: "Plumber", status: "Present", checkIn: "08:30", checkOut: "17:30" },
    ],
  },
]

// export async function GET() {
//   return NextResponse.json(attendance)
// }

// export async function POST(request: Request) {
//   const body = await request.json()
//   const newAttendance = {
//     id: attendance.length + 1,
//     date: new Date().toISOString().split("T")[0],
//     ...body,
//   }
//   attendance.push(newAttendance)
//   return NextResponse.json(newAttendance, { status: 201 })
// }

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Session } from "next-auth";
import connectToDB from "@/lib/db";
import Attendance from "@/models/Attendance";
import { Types } from "mongoose";

// Helper to check if a date is a weekend
const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday is 0, Saturday is 6
};

// Helper to get working days between two dates
export const getWorkingDaysInMonth = (year: number, month: number): number => {
  let count = 0;
  const date = new Date(year, month, 1);
  
  while (date.getMonth() === month) {
    if (!isWeekend(date)) {
      count++;
    }
    date.setDate(date.getDate() + 1);
  }
  
  return count;
};

// Helper to count leave days in a month
export const countLeaveDays = async (userId: string, year: number, month: number): Promise<number> => {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  
  const leaves = await Attendance.find({
    $or: [{ supervisorId: userId }, { employeeId: userId }],
    status: "Absent",
    date: { $gte: startDate, $lte: endDate }
  });
  
  return leaves.length;
};

// POST: Apply for leave
// POST: Apply for leave
// POST: Apply for leave
export async function POST(request: Request) {
  try {
    await connectToDB();
    const session = (await getServerSession(authOptions)) as Session & {
      user: { id: string; role: string };
    };

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const { date, reason } = await request.json();
    const leaveDate = new Date(date);
    
    // Check if it's a weekend
    if (isWeekend(leaveDate)) {
      return NextResponse.json(
        { error: "Cannot apply for leave on weekends" },
        { status: 400 }
      );
    }

    // Check for existing attendance record
    const existingAttendance = await Attendance.findOne({
      $or: [{ supervisorId: session.user.id }, { employeeId: session.user.id }],
      date: {
        $gte: new Date(leaveDate.setHours(0, 0, 0, 0)),
        $lt: new Date(leaveDate.setHours(23, 59, 59, 999)),
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        { error: "Attendance already marked for this date" },
        { status: 400 }
      );
    }

    // Count leave days in the current month
    const currentMonth = leaveDate.getMonth();
    const currentYear = leaveDate.getFullYear();
    const leaveDays = await countLeaveDays(session.user.id, currentYear, currentMonth);
    
    // Check if this is more than 2 leave days in the month
    const requiresApproval = leaveDays >= 2;

    // Create leave record
    const leaveRecord = new Attendance({
      [session.user.role === 'supervisor' ? 'supervisorId' : 'employeeId']: session.user.id,
      date: leaveDate,
      status: "Absent",
      leaveReason: reason,
      isLeaveApproved: !requiresApproval, // Auto-approve if <= 2 leaves
      isLeavePaid: !requiresApproval, // Auto-pay if <= 2 leaves
      processedBy: requiresApproval ? undefined : new Types.ObjectId(session.user.id),
      processedAt: requiresApproval ? undefined : new Date(),
    });

    await leaveRecord.save();

    return NextResponse.json(
      { 
        message: requiresApproval 
          ? "Leave application submitted for approval" 
          : "Leave approved automatically",
        requiresApproval,
        leaveRecord
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error applying for leave:", error);
    return NextResponse.json(
      { error: "Failed to apply for leave" },
      { status: 500 }
    );
  }
}

// PATCH: Approve/Reject leave
export async function PATCH(request: Request) {
  try {
    await connectToDB();
    const session = (await getServerSession(authOptions)) as Session & {
      user: { id: string; role: string };
    };

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const { attendanceId, isApproved, isPaid } = await request.json();

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return NextResponse.json(
        { error: "Leave record not found" },
        { status: 404 }
      );
    }

    // Update leave status
    attendance.isLeaveApproved = isApproved;
    attendance.isLeavePaid = isApproved ? isPaid : false;
    attendance.processedBy = new Types.ObjectId(session.user.id);
    attendance.processedAt = new Date();

    await attendance.save();

    return NextResponse.json({
      message: `Leave ${isApproved ? 'approved' : 'rejected'} successfully`,
      attendance,
    });
  } catch (error) {
    console.error("Error processing leave:", error);
    return NextResponse.json(
      { error: "Failed to process leave request" },
      { status: 500 }
    );
  }
}

// GET: Get leave requests (for managers/admins)
export async function GET(request: Request) {
  try {
    await connectToDB();
    const session = (await getServerSession(authOptions)) as Session & {
      user: { id: string; role: string };
    };

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    const query: any = {
      status: "Absent",
      leaveReason: { $exists: true, $ne: "" },
    };

    if (status === "pending") {
      query.isLeaveApproved = { $exists: false };
    } else if (status === "approved") {
      query.isLeaveApproved = true;
    } else if (status === "rejected") {
      query.isLeaveApproved = false;
    }

    if (userId) {
      query.$or = [
        { supervisorId: new Types.ObjectId(userId) },
        { employeeId: new Types.ObjectId(userId) },
      ];
    }

    const leaves = await Attendance.find(query)
      .populate("supervisorId employeeId processedBy", "name email")
      .sort({ date: -1 });

    return NextResponse.json(leaves);
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave requests" },
      { status: 500 }
    );
  }
}

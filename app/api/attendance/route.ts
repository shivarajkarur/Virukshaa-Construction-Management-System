import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import Attendance from "@/models/Attendance";

// POST: Mark attendance for a supervisor or employee
export async function POST(req: NextRequest) {
  await connectToDB();
  try {
    // One-time defensive index migration to prevent duplicate key errors from legacy indexes
    try {
      const existing = await Attendance.collection.indexes().catch(() => [] as any);
      const hasLegacyEmpDate = Array.isArray(existing) && existing.some((idx: any) => idx?.name === 'employeeId_1_date_1');
      if (hasLegacyEmpDate) {
        await Attendance.collection.dropIndex('employeeId_1_date_1').catch(() => null);
      }
      // Ensure the correct compound unique index exists
      await Attendance.collection.createIndex({ employeeId: 1, projectId: 1, date: 1 }, { name: 'employeeId_1_projectId_1_date_1', unique: true }).catch(() => null);
    } catch (_) {
      // Swallow index management errors to avoid blocking attendance marking
    }

    const { employeeId, supervisorId, projectId, date, status, leaveReason = null, isPaid = true } = await req.json();

    if ((!employeeId && !supervisorId) || !date || !status) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    // Convert date string to Date object and validate
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);
    if (isNaN(attendanceDate.getTime())) {
      return NextResponse.json({ success: false, message: "Invalid date" }, { status: 400 });
    }

    // Resolve subject (employee or supervisor) and prepare filter
    let filter: any = { date: attendanceDate };
    let processedBy: any = undefined;

    if (employeeId) {
      // Enforce project-specific attendance for employees
      if (!projectId) {
        return NextResponse.json(
          { success: false, message: "Project ID is required when marking employee attendance" },
          { status: 400 }
        );
      }

      // Validate ObjectId formats defensively
      const mongoose = (await import('mongoose')).default;
      if (!mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(projectId)) {
        return NextResponse.json(
          { success: false, message: "Invalid employeeId or projectId format" },
          { status: 400 }
        );
      }

      const Employee = (await import('@/models/EmployeeModel')).default;
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 });
      }
      filter.employeeId = employee._id;
      // Always scope employee attendance by project
      filter.projectId = projectId;
      // Ensure employee is assigned to this project
      const isOnProject = (
        (Array.isArray(employee.assignedProjects) && employee.assignedProjects.some((p: any) => String(p.projectId) === String(projectId)))
        || (employee.projectId && String(employee.projectId) === String(projectId))
      );
      if (!isOnProject) {
        return NextResponse.json({ success: false, message: "Employee not assigned to this project" }, { status: 403 });
      }
      processedBy = employeeId;
    } else if (supervisorId) {
      // Validate supervisorId format to avoid CastError
      const mongoose = (await import('mongoose')).default;
      if (!mongoose.Types.ObjectId.isValid(supervisorId)) {
        return NextResponse.json({ success: false, message: "Invalid supervisorId" }, { status: 400 });
      }
      const Supervisor = (await import('@/models/Supervisor')).default;
      const supervisor = await Supervisor.findById(supervisorId);
      if (!supervisor) {
        return NextResponse.json({ success: false, message: "Supervisor not found" }, { status: 404 });
      }
      filter.supervisorId = supervisor._id;
      processedBy = supervisorId;
    }

    // Prepare the update object
    const updateObj: any = {
      status,
      updatedAt: new Date(),
      processedAt: new Date(),
      processedBy,
    };

    // Handle leave reason and payment status if provided
    if (leaveReason !== undefined) {
      updateObj.leaveReason = leaveReason;
    }

    // Handle payment status based on leave type
    if (status === 'Absent') {
      updateObj.isLeaveApproved = leaveReason ? true : false;
      updateObj.isLeavePaid = leaveReason ? isPaid : false;
    } else {
      // For present/on-duty, clear leave-related fields
      updateObj.isLeaveApproved = false;
      updateObj.isLeavePaid = false;
      updateObj.leaveReason = '';
    }

    let attendance;
    try {
      attendance = await Attendance.findOneAndUpdate(
        filter,
        updateObj,
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        }
      );
    } catch (e: any) {
      // If duplicate key due to index race/legacy state, retry as override without upsert
      if (e && e.code === 11000) {
        try {
          attendance = await Attendance.findOneAndUpdate(
            filter,
            updateObj,
            {
              upsert: false,
              new: true,
              runValidators: true,
            }
          );
        } catch (e2: any) {
          return NextResponse.json({ success: false, message: "Unable to update attendance due to duplicate constraint", error: e2?.message || String(e2) }, { status: 409 });
        }
      } else {
        throw e;
      }
    }

    return NextResponse.json({ success: true, message: "Attendance marked successfully", data: attendance }, { status: 201 });
  } catch (error) {
    console.error("Error marking attendance:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
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
    const projectId = searchParams.get("projectId");
    const includeLeave = searchParams.get("includeLeave") === 'true';
    const monthlyEmployees = searchParams.get("monthlyEmployees") === 'true';

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
      // For employee attendance queries, require projectId to ensure project-specific isolation
      if (!projectId) {
        return NextResponse.json(
          { success: false, message: "Project ID is required when querying employee attendance" },
          { status: 400 }
        );
      }
      filter.employeeId = employeeId;
      filter.projectId = projectId;
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
    let attendanceRecords = await Attendance.find(filter)
      .populate("supervisorId", "_id name email phone salary")
      .populate("employeeId", "_id name email position workType dailySalary")
      .sort({ date: 1 });

    // Filter for monthly employees if requested
    if (monthlyEmployees) {
      attendanceRecords = attendanceRecords.filter(record => {
        if (record.employeeId && typeof record.employeeId === 'object') {
          const employee = record.employeeId as any;
          return employee.workType === "Monthly";
        }
        return false;
      });
    }

    return NextResponse.json({ success: true, data: attendanceRecords }, { status: 200 });
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

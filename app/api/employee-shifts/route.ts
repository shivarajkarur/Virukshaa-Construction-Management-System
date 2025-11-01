import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import EmployeeShift from "@/models/EmployeeShift";
import Employee from "@/models/EmployeeModel";
import Supervisor from "@/models/Supervisor";

// GET /api/employee-shifts?date=YYYY-MM-DD&employeeId=optional&projectId=optional
export async function GET(req: NextRequest) {
  await connectToDB();
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const startStr = searchParams.get("start");
    const endStr = searchParams.get("end");
    const employeeId = searchParams.get("employeeId");
    const projectId = searchParams.get("projectId");
    
    // Support either single-day fetch (date) or range fetch (start/end)
    let filter: any = {};
    if (dateStr) {
      const target = new Date(dateStr);
      target.setUTCHours(0, 0, 0, 0);
      const next = new Date(target);
      next.setUTCDate(target.getUTCDate() + 1);
      filter.date = { $gte: target, $lt: next };
    } else if (startStr && endStr) {
      const start = new Date(startStr);
      const end = new Date(endStr);
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(0, 0, 0, 0);
      // include end day: set end to next day exclusive upper bound
      const endExclusive = new Date(end);
      endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
      filter.date = { $gte: start, $lt: endExclusive };
    } else {
      // default to today
      const target = new Date();
      target.setUTCHours(0, 0, 0, 0);
      const next = new Date(target);
      next.setUTCDate(target.getUTCDate() + 1);
      filter.date = { $gte: target, $lt: next };
    }

    if (employeeId) filter.employeeId = employeeId;
    if (projectId) filter.projectId = projectId;

    const docs = await EmployeeShift.find(filter).lean();
    return NextResponse.json(docs, { status: 200 });
  } catch (err) {
    console.error("GET /employee-shifts error:", err);
    return NextResponse.json({ message: "Internal Server Error", error: (err as Error).message }, { status: 500 });
  }
}

// PUT /api/employee-shifts  { employeeId, projectId(optional*), date: YYYY-MM-DD, shifts, perShiftSalary }
// * If projectId is omitted, we will attempt to infer it when the employee
//   has a single assignment; otherwise, projectId is required.
export async function PUT(req: NextRequest) {
  await connectToDB();
  try {
    const { employeeId, projectId, date, shifts, perShiftSalary } = await req.json();

    if (!employeeId || !date || typeof shifts !== 'number' || typeof perShiftSalary !== 'number') {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Check supervisor authorization (guard invalid ObjectId to avoid CastError -> 500)
    const authHeader = req.headers.get('authorization');
    const userId = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized: No user ID provided" }, { status: 401 });
    }
    // Mongoose will throw CastError if the ID is not a valid ObjectId; prevent that explicitly
    const isValidSupervisorId = /^[0-9a-fA-F]{24}$/.test(String(userId));
    if (!isValidSupervisorId) {
      return NextResponse.json({ message: "Unauthorized: Invalid supervisor ID" }, { status: 401 });
    }

    // Verify the employee is assigned to this supervisor
    // Validate ObjectId formats to avoid CastError -> 500
    const mongoose = (await import('mongoose')).default;
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return NextResponse.json({ message: "Invalid employeeId" }, { status: 400 });
    }
    if (projectId && !mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json({ message: "Invalid projectId" }, { status: 400 });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    const supervisor = await Supervisor.findById(userId);
    if (!supervisor) {
      return NextResponse.json({ message: "Supervisor not found" }, { status: 404 });
    }

    // Check if employee is assigned to this supervisor
    const empAssignedToSupervisor = Array.isArray(supervisor.employees)
      && supervisor.employees.some((id: any) => String(id) === String(employeeId));
    if (!empAssignedToSupervisor) {
      return NextResponse.json({ message: "Unauthorized: Employee not assigned to this supervisor" }, { status: 403 });
    }

    // Resolve effective projectId: provided -> single assignment -> legacy field
    let effectiveProjectId: string | null = projectId || null;
    if (!effectiveProjectId) {
      if (Array.isArray(employee.assignedProjects) && employee.assignedProjects.length === 1) {
        effectiveProjectId = String(employee.assignedProjects[0].projectId);
      } else if (employee.projectId) {
        effectiveProjectId = String(employee.projectId);
      }
    }
    if (!effectiveProjectId) {
      return NextResponse.json({ message: "projectId is required when employee has multiple assignments" }, { status: 400 });
    }

    // Verify employee is assigned to the target project (modern or legacy)
    const isOnProject = (
      (Array.isArray(employee.assignedProjects) && employee.assignedProjects.some((p: any) => String(p.projectId) === String(effectiveProjectId)))
      || (employee.projectId && String(employee.projectId) === String(effectiveProjectId))
    );
    if (!isOnProject) {
      return NextResponse.json({ message: "Unauthorized: Employee not assigned to this project" }, { status: 403 });
    }

    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ message: "Invalid date" }, { status: 400 });
    }
    // Support half-shift increments: round to nearest 0.5 and clamp within 0-3
    const roundToHalf = (n: number) => Math.round((n ?? 0) * 2) / 2;
    const clampShift = (n: number) => Math.max(0, Math.min(3, roundToHalf(n)));
    const clampedShifts = clampShift(shifts);
    const totalPay = clampedShifts * perShiftSalary;

    // Defensive index migration to prevent legacy duplicates across projects
    try {
      // Drop legacy unique index if it exists: employeeId + date
      await EmployeeShift.collection.dropIndex('employeeId_1_date_1');
    } catch (_) { /* ignore if index doesn't exist */ }
    try {
      // Ensure correct unique index exists: employeeId + projectId + date
      await EmployeeShift.collection.createIndex({ employeeId: 1, projectId: 1, date: 1 }, { unique: true });
    } catch (_) { /* ignore index creation errors; schema ensures it too */ }

    let doc;
    try {
      doc = await EmployeeShift.findOneAndUpdate(
        { employeeId, projectId: effectiveProjectId, date: d },
        { projectId: effectiveProjectId, shifts: clampedShifts, perShiftSalary, totalPay },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      );
    } catch (e: any) {
      // If a duplicate-key occurs, retry once after ensuring index state; otherwise treat as override
      if (e && e.code === 11000) {
        try {
          doc = await EmployeeShift.findOneAndUpdate(
            { employeeId, projectId: effectiveProjectId, date: d },
            { projectId: effectiveProjectId, shifts: clampedShifts, perShiftSalary, totalPay },
            { upsert: false, new: true, runValidators: true }
          );
        } catch (e2: any) {
          return NextResponse.json({ message: "Unable to update shift due to duplicate constraint", error: e2?.message || String(e2) }, { status: 409 });
        }
      } else {
        throw e;
      }
    }

    return NextResponse.json(doc, { status: 200 });
  } catch (err) {
    console.error("PUT /employee-shifts error:", err);
    return NextResponse.json({ message: "Internal Server Error", error: (err as Error).message }, { status: 500 });
  }
}

// POST /api/employee-shifts  { employeeId, projectId(optional*), date: YYYY-MM-DD, shifts, perShiftSalary }
// *Same inference rules as PUT.
export async function POST(req: NextRequest) {
  await connectToDB();
  try {
    const { employeeId, projectId, date, shifts, perShiftSalary } = await req.json();

    if (!employeeId || !date || typeof shifts !== 'number' || typeof perShiftSalary !== 'number') {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    let effectiveProjectId: string | null = projectId || null;
    if (!effectiveProjectId) {
      if (Array.isArray(employee.assignedProjects) && employee.assignedProjects.length === 1) {
        effectiveProjectId = String(employee.assignedProjects[0].projectId);
      } else if (employee.projectId) {
        effectiveProjectId = String(employee.projectId);
      }
    }
    if (!effectiveProjectId) {
      return NextResponse.json({ message: "projectId is required when employee has multiple assignments" }, { status: 400 });
    }

    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    // Support half-shift increments: round to nearest 0.5 and clamp within 0-3
    const roundToHalf = (n: number) => Math.round((n ?? 0) * 2) / 2;
    const clampShift = (n: number) => Math.max(0, Math.min(3, roundToHalf(n)));
    const clampedShifts = clampShift(shifts);
    const totalPay = clampedShifts * perShiftSalary;

    // Defensive index migration to prevent legacy duplicates across projects
    try {
      await EmployeeShift.collection.dropIndex('employeeId_1_date_1');
    } catch (_) { /* ignore if index doesn't exist */ }
    try {
      await EmployeeShift.collection.createIndex({ employeeId: 1, projectId: 1, date: 1 }, { unique: true });
    } catch (_) { /* ignore index creation errors; schema ensures it too */ }

    let doc;
    try {
      doc = await EmployeeShift.findOneAndUpdate(
        { employeeId, projectId: effectiveProjectId, date: d },
        { projectId: effectiveProjectId, shifts: clampedShifts, perShiftSalary, totalPay },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      );
    } catch (e: any) {
      if (e && e.code === 11000) {
        try {
          doc = await EmployeeShift.findOneAndUpdate(
            { employeeId, projectId: effectiveProjectId, date: d },
            { projectId: effectiveProjectId, shifts: clampedShifts, perShiftSalary, totalPay },
            { upsert: false, new: true, runValidators: true }
          );
        } catch (e2: any) {
          return NextResponse.json({ message: "Unable to update shift due to duplicate constraint", error: e2?.message || String(e2) }, { status: 409 });
        }
      } else {
        throw e;
      }
    }

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    console.error("POST /employee-shifts error:", err);
    return NextResponse.json({ message: "Internal Server Error", error: (err as Error).message }, { status: 500 });
  }
}

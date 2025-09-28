import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import EmployeeShift from "@/models/EmployeeShift";
import Employee from "@/models/EmployeeModel";
import Supervisor from "@/models/Supervisor";

// GET /api/employee-shifts?date=YYYY-MM-DD&employeeId=optional
export async function GET(req: NextRequest) {
  await connectToDB();
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const employeeId = searchParams.get("employeeId");

    const target = dateStr ? new Date(dateStr) : new Date();
    target.setUTCHours(0, 0, 0, 0);
    const next = new Date(target);
    next.setUTCDate(target.getUTCDate() + 1);

    const filter: any = { date: { $gte: target, $lt: next } };
    if (employeeId) filter.employeeId = employeeId;

    const docs = await EmployeeShift.find(filter).lean();
    return NextResponse.json(docs, { status: 200 });
  } catch (err) {
    console.error("GET /employee-shifts error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/employee-shifts  { employeeId, date: YYYY-MM-DD, shifts, perShiftSalary }
export async function PUT(req: NextRequest) {
  await connectToDB();
  try {
    const { employeeId, date, shifts, perShiftSalary } = await req.json();

    if (!employeeId || !date || typeof shifts !== 'number' || typeof perShiftSalary !== 'number') {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Check supervisor authorization
    const authHeader = req.headers.get('authorization');
    const userId = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized: No user ID provided" }, { status: 401 });
    }

    // Verify the employee is assigned to this supervisor
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    const supervisor = await Supervisor.findById(userId);
    if (!supervisor) {
      return NextResponse.json({ message: "Supervisor not found" }, { status: 404 });
    }

    // Check if employee is assigned to this supervisor
    if (!supervisor.employees?.includes(employeeId)) {
      return NextResponse.json({ message: "Unauthorized: Employee not assigned to this supervisor" }, { status: 403 });
    }

    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    // Support half-shift increments: round to nearest 0.5 and clamp within 0-3
    const roundToHalf = (n: number) => Math.round((n ?? 0) * 2) / 2;
    const clampShift = (n: number) => Math.max(0, Math.min(3, roundToHalf(n)));
    const clampedShifts = clampShift(shifts);
    const totalPay = clampedShifts * perShiftSalary;

    const doc = await EmployeeShift.findOneAndUpdate(
      { employeeId, date: d },
      { shifts: clampedShifts, perShiftSalary, totalPay },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(doc, { status: 200 });
  } catch (err) {
    console.error("PUT /employee-shifts error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/employee-shifts  { employeeId, date: YYYY-MM-DD, shifts, perShiftSalary }
export async function POST(req: NextRequest) {
  await connectToDB();
  try {
    const { employeeId, date, shifts, perShiftSalary } = await req.json();

    if (!employeeId || !date || typeof shifts !== 'number' || typeof perShiftSalary !== 'number') {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    // Support half-shift increments: round to nearest 0.5 and clamp within 0-3
    const roundToHalf = (n: number) => Math.round((n ?? 0) * 2) / 2;
    const clampShift = (n: number) => Math.max(0, Math.min(3, roundToHalf(n)));
    const clampedShifts = clampShift(shifts);
    const totalPay = clampedShifts * perShiftSalary;

    const doc = await EmployeeShift.findOneAndUpdate(
      { employeeId, date: d },
      { shifts: clampedShifts, perShiftSalary, totalPay },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    console.error("POST /employee-shifts error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

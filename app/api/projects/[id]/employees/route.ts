import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import Employee from "@/models/EmployeeModel";
import { Types } from "mongoose";

// Map DB employee document to client-safe shape, including assignment fields
const toClientEmployee = (employee: any) => ({
  _id: employee._id?.toString?.() ?? String(employee._id),
  name: employee.name,
  email: employee.email,
  phone: employee.phone,
  role: employee.role,
  salary: employee.salary,
  workType: employee.workType,
  status: employee.status,
  joinDate: employee.joinDate?.toISOString?.() ?? (employee.joinDate ? new Date(employee.joinDate).toISOString() : undefined),
  endDate: employee.endDate?.toISOString?.() ?? (employee.endDate ? new Date(employee.endDate).toISOString() : undefined),
  address: employee.address,
  avatar: employee.avatar,
  department: employee.department,
  projectId: employee.projectId?.toString?.() ?? (employee.projectId ? String(employee.projectId) : undefined),
  supervisor: employee.supervisor?.toString?.() ?? (employee.supervisor ? String(employee.supervisor) : undefined),
  assignedProjects: Array.isArray(employee.assignedProjects)
    ? employee.assignedProjects.map((ap: any) => ({
        projectId: ap.projectId?.toString?.() ?? String(ap.projectId),
        supervisorId: ap.supervisorId?.toString?.() ?? String(ap.supervisorId),
        role: ap.role,
        assignedAt: ap.assignedAt?.toISOString?.() ?? (ap.assignedAt ? new Date(ap.assignedAt).toISOString() : undefined),
      }))
    : [],
  createdAt: employee.createdAt?.toISOString?.() ?? new Date(employee.createdAt).toISOString(),
  updatedAt: employee.updatedAt?.toISOString?.() ?? new Date(employee.updatedAt).toISOString(),
});

// GET /api/projects/[id]/employees
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid project ID" }, { status: 400 });
    }

    await connectToDB();
    const projectObjectId = new Types.ObjectId(id);

    // Find employees assigned to this project via legacy projectId
    // or via the modern assignedProjects array
    const employees = await Employee.find({
      $or: [
        { projectId: projectObjectId },
        { assignedProjects: { $elemMatch: { projectId: projectObjectId } } },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(Array.isArray(employees) ? employees.map(toClientEmployee) : []);
  } catch (error) {
    console.error("Error fetching project employees:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
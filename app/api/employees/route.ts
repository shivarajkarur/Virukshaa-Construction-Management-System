import { NextResponse } from "next/server"
import connectToDB from "@/lib/db"
import Employee, { IEmployee } from "@/models/EmployeeModel"
import { Types } from 'mongoose'

// Helper to convert to client-safe employee object
const toClientEmployee = (employee: any) => ({
  _id: employee._id.toString(),
  name: employee.name,
  email: employee.email,
  phone: employee.phone,
  role: employee.role,
  salary: employee.salary,
  workType: employee.workType,
  status: employee.status,
  joinDate: employee.joinDate.toISOString(),
  endDate: employee.endDate?.toISOString(),
  address: employee.address,
  avatar: employee.avatar,
  createdAt: employee.createdAt?.toISOString?.() ?? new Date(employee.createdAt).toISOString(),
  updatedAt: employee.updatedAt?.toISOString?.() ?? new Date(employee.updatedAt).toISOString()
})

export async function GET() {
  try {
    await connectToDB()
    const employees = await Employee.find({}).sort({ createdAt: -1 }).lean()
    return NextResponse.json(employees.map(toClientEmployee))
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { message: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Coerce date strings to Date objects if needed
    if (typeof data.joinDate === 'string') data.joinDate = new Date(data.joinDate)
    if (typeof data.endDate === 'string') data.endDate = new Date(data.endDate)

    await connectToDB();
    const employee = new Employee(data);
    await employee.save();
    
    return NextResponse.json(toClientEmployee(employee), { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    // Check for duplicate key error (code 11000)
    if ((error as any)?.code === 11000) {
      const dup: any = error as any;
      const fields = Object.keys(dup.keyPattern || dup.keyValue || {});
      const field = fields[0] || 'field';
      return NextResponse.json(
        { message: `An employee with this ${field} already exists.` },
        { status: 409 }
      );
    }
    // Validation errors
    if ((error as any)?.name === 'ValidationError') {
      const err: any = error as any
      const messages = Object.values(err.errors || {}).map((e: any) => e.message)
      return NextResponse.json(
        { message: messages.join(', ') || 'Validation failed' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { message: 'Failed to create employee' },
      { status: 500 }
    );
  }
}

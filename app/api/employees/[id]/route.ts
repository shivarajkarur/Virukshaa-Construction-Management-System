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
  role: typeof employee.role === 'string' ? employee.role.toLowerCase() : employee.role,
  salary: employee.salary,
  workType: employee.workType,
  status: employee.status,
  joinDate: employee.joinDate.toISOString(),
  endDate: employee.endDate?.toISOString(),
  address: employee.address,
  avatar: employee.avatar,
  totalPaid: employee.totalPaid,
  dueAmount: employee.dueAmount,
  lastPaymentDate: employee.lastPaymentDate?.toISOString(),
  createdAt: employee.createdAt?.toISOString?.() ?? new Date(employee.createdAt).toISOString(),
  updatedAt: employee.updatedAt?.toISOString?.() ?? new Date(employee.updatedAt).toISOString()
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { message: 'Invalid employee ID' },
        { status: 400 }
      )
    }

    await connectToDB()
    const employee = await Employee.findById(params.id).lean()

    if (!employee) {
      return NextResponse.json(
        { message: 'Employee not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(toClientEmployee(employee))
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json(
      { message: 'Failed to fetch employee' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } } | Promise<{ params: { id: string } }>
) {
  const ctx = await context;
  const params = await ctx.params;
  const id = params.id;
  try {
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid employee ID' }, { status: 400 });
    }

    const body = await request.json();

    // Normalize role to match allowed enum values
    if (body.role && typeof body.role === 'string') {
      const allowedRoles = [
        'Mason', 'Carpenter', 'Electrician', 'Plumber', 
        'Heavy Equipment Operator', 'Safety Inspector', 'Laborer', 
        'Welder', 'Painter', 'Roofer', 'HVAC Technician', 'Concrete Worker', 'Employee'
      ];
      const match = allowedRoles.find(
        r => r.toLowerCase() === body.role.toLowerCase()
      );
      if (match) {
        body.role = match;
      }
    }

    // Convert date strings to Date objects
    if (body.lastPaymentDate && typeof body.lastPaymentDate === 'string') {
      body.lastPaymentDate = new Date(body.lastPaymentDate);
    }
    if (body.joinDate && typeof body.joinDate === 'string') {
      body.joinDate = new Date(body.joinDate);
    }
    if (body.endDate && typeof body.endDate === 'string') {
      body.endDate = new Date(body.endDate);
    }

    // Ensure totalPaid and dueAmount are always updated
    let totalPaid = typeof body.totalPaid === 'number' ? body.totalPaid : undefined;
    let salary = typeof body.salary === 'number' ? body.salary : undefined;
    let dueAmount = typeof body.dueAmount === 'number' ? body.dueAmount : undefined;

    // Recalculate dueAmount if salary or totalPaid is present
    if (typeof salary === 'number' && typeof totalPaid === 'number') {
      dueAmount = salary - totalPaid;
    }

    // Create a clean update object with only allowed fields
    const updateData: Partial<IEmployee> = {};
    const allowedFields: (keyof IEmployee)[] = [
      'name', 'email', 'phone', 'role', 'salary', 'workType',
      'status', 'joinDate', 'endDate', 'address', 'avatar',
      'department', 'lastPaymentDate',
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        (updateData as any)[field] = body[field];
      }
    });

    // Always set totalPaid and dueAmount explicitly
    if (typeof totalPaid === 'number') {
      updateData.totalPaid = totalPaid;
    }
    if (typeof dueAmount === 'number') {
      updateData.dueAmount = dueAmount;
    }

    await connectToDB();
    let updatedEmployee: any = null;
    try {
      updatedEmployee = await Employee.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).lean();
    } catch (err: any) {
      if (err?.code === 11000) {
        const fields = Object.keys(err.keyPattern || err.keyValue || {});
        const field = fields[0] || 'field';
        return NextResponse.json(
          { message: `An employee with this ${field} already exists.` },
          { status: 409 }
        );
      }
      throw err;
    }

    if (!updatedEmployee) {
      return NextResponse.json({ message: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json(toClientEmployee(updatedEmployee));
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { message: 'Failed to update employee' },
      { status: 500 }
    );
  }
}


export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  try {
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'Invalid employee ID' },
        { status: 400 }
      )
    }

    await connectToDB()
    const deletedEmployee = await Employee.findByIdAndDelete(id).lean()

    if (!deletedEmployee) {
      return NextResponse.json(
        { message: 'Employee not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Employee deleted successfully' })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { message: 'Failed to delete employee' },
      { status: 500 }
    )
  }
}

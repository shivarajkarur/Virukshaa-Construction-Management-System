import { NextResponse } from 'next/server';
import connectToDB from '@/lib/db';
import Supervisor from '@/models/Supervisor';
import Employee from '@/models/EmployeeModel';
import EmployeeShift from '@/models/EmployeeShift';
import Project from '@/models/ProjectModel';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDB();

    const supervisor = await Supervisor.findById(params.id)
      .populate({
        path: 'employees',
        select: 'name email phone role workType status joinDate endDate address position avatar salary projectId',
        options: { lean: true },
      })
      .select('employees')
      .lean();

    if (!supervisor) {
      return NextResponse.json(
        { message: 'Supervisor not found' },
        { status: 404 }
      );
    }

    const employees: any[] = (supervisor as any).employees || [];

    // Compute today's shiftsWorked for populated employees
    const ids = employees.map((e) => e._id).filter(Boolean);
    if (ids.length > 0) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const next = new Date(today);
      next.setUTCDate(today.getUTCDate() + 1);

      const shiftDocs = await EmployeeShift.find({
        employeeId: { $in: ids },
        date: { $gte: today, $lt: next },
      })
        .select('employeeId shifts')
        .lean();

      const shiftMap = new Map<string, number>();
      for (const doc of shiftDocs) {
        const key = String((doc as any).employeeId);
        const count = (doc as any).shifts ?? 0;
        shiftMap.set(key, (shiftMap.get(key) || 0) + count);
      }

      for (const emp of employees) {
        const key = String(emp._id);
        (emp as any).shiftsWorked = shiftMap.get(key) || 0;
      }
    }

    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error fetching supervisor employees:', error);
    return NextResponse.json(
      { message: 'Failed to fetch assigned employees' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { employeeId, projectId } = await request.json();
    
    if (!employeeId) {
      return NextResponse.json(
        { message: 'Employee ID is required' },
        { status: 400 }
      );
    }
    if (!projectId) {
      return NextResponse.json(
        { message: 'Project ID is required' },
        { status: 400 }
      );
    }
    
    await connectToDB();
    
    // Check if supervisor exists
    const supervisor = await Supervisor.findById(params.id);
    if (!supervisor) {
      return NextResponse.json(
        { message: 'Supervisor not found' },
        { status: 404 }
      );
    }
    
    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return NextResponse.json(
        { message: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // Check if employee is already assigned
    if (supervisor.employees.includes(employeeId)) {
      return NextResponse.json(
        { message: 'Employee is already assigned to this supervisor' },
        { status: 400 }
      );
    }
    
    // Validate project exists
    const project = await Project.findById(projectId).select('_id').lean();
    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    // Add employee to supervisor
    supervisor.employees.push(employeeId);
    await supervisor.save();
    
    // Update employee's supervisor and project reference
    (employee as any).supervisor = supervisor._id;
    (employee as any).projectId = project._id;
    await employee.save();
    
    return NextResponse.json(
      { message: 'Employee assigned successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error assigning employee:', error);
    return NextResponse.json(
      { message: 'Failed to assign employee' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { employeeId } = await request.json();

    if (!employeeId) {
      return NextResponse.json(
        { message: 'Employee ID is required' },
        { status: 400 }
      );
    }

    await connectToDB();

    // Check if supervisor exists
    const supervisor = await Supervisor.findById(params.id);
    if (!supervisor) {
      return NextResponse.json(
        { message: 'Supervisor not found' },
        { status: 404 }
      );
    }

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return NextResponse.json(
        { message: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check if employee is actually assigned to this supervisor
    const isAssigned = supervisor.employees?.some((e: any) => String(e) === String(employeeId));
    if (!isAssigned) {
      // Ensure employee's supervisor reference is not stale
      if (String((employee as any).supervisor || '') === String(supervisor._id)) {
        (employee as any).supervisor = undefined;
        (employee as any).projectId = undefined;
        await employee.save();
      }
      return NextResponse.json(
        { message: 'Employee is not assigned to this supervisor' },
        { status: 400 }
      );
    }

    // Remove employee from supervisor's list
    (supervisor as any).employees = (supervisor as any).employees.filter(
      (e: any) => String(e) !== String(employeeId)
    );
    await supervisor.save();

    // Clear employee's supervisor reference if it matches
    if (String((employee as any).supervisor || '') === String(supervisor._id)) {
      (employee as any).supervisor = undefined;
      (employee as any).projectId = undefined;
      await employee.save();
    }

    return NextResponse.json(
      { message: 'Employee unassigned successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error unassigning employee:', error);
    return NextResponse.json(
      { message: 'Failed to unassign employee' },
      { status: 500 }
    );
  }
}

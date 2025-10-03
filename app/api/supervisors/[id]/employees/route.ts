import { NextResponse } from 'next/server';
import connectToDB from '@/lib/db';
import Supervisor from '@/models/Supervisor';
import Employee from '@/models/EmployeeModel';
import EmployeeShift from '@/models/EmployeeShift';
import Project from '@/models/ProjectModel';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await params;

    const supervisor = await Supervisor.findById(id)
      .populate({
        path: 'employees',
        select: 'name email phone role workType status joinDate endDate address position avatar salary projectId assignedProjects',
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { employeeId, projectId, role } = await request.json();
    
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
    const { id } = await params;
    
    // Check if supervisor exists
    const supervisor = await Supervisor.findById(id);
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
    
    // Check if employee is already assigned to this project (supervisor-side)
    if (supervisor.projectAssignments && supervisor.projectAssignments.some(
      (assignment: any) => String(assignment.employeeId) === String(employeeId) && String(assignment.projectId) === String(projectId)
    )) {
      return NextResponse.json(
        { message: 'Employee is already assigned to this project' },
        { status: 400 }
      );
    }
    
    // Validate project exists
    const project = await Project.findById(projectId).select('_id title').lean();
    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    // Ensure employee is listed under supervisor if any assignment exists
    const alreadyListed = (supervisor.employees || []).some((e: any) => String(e) === String(employeeId));
    if (!alreadyListed) {
      supervisor.employees.push(employeeId);
    }
    
    // Add project assignment with role - REPLACE any existing assignment for this employee
    if (!supervisor.projectAssignments) {
      supervisor.projectAssignments = [];
    }
    
    // Remove any existing project assignments for this employee under this supervisor
    supervisor.projectAssignments = supervisor.projectAssignments.filter(
      (assignment: any) => String(assignment.employeeId) !== String(employeeId)
    );
    
    // Add the new project assignment
    supervisor.projectAssignments.push({
      projectId,
      employeeId,
      projectTitle: (project as any).title,
      role: role || 'Team Member',
      assignedAt: new Date()
    });
    
    await supervisor.save();
    
    // Update employee's assigned projects - REPLACE any existing assignment for this supervisor
    // Remove any existing project assignments for this supervisor
    (employee as any).assignedProjects = (employee as any).assignedProjects?.filter(
      (ap: any) => String(ap.supervisorId) !== String(supervisor._id)
    ) || [];
    
    // Add the new project assignment
    (employee as any).assignedProjects.push({
      projectId,
      supervisorId: supervisor._id,
      role: role || 'Team Member',
      assignedAt: new Date()
    });
    await employee.save();
    
    return NextResponse.json(
      { 
        message: 'Employee assigned successfully',
        projectAssignment: {
          projectId,
          employeeId,
          projectTitle: (project as any).title,
          role: role || 'Team Member',
          assignedAt: new Date().toISOString()
        }
      },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { employeeId, projectId } = await request.json();

    if (!employeeId) {
      return NextResponse.json(
        { message: 'Employee ID is required' },
        { status: 400 }
      );
    }

    await connectToDB();
    const { id } = await params;

    // Check if supervisor exists
    const supervisor = await Supervisor.findById(id);
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

    // Remove project-specific assignment if projectId is provided
    if (projectId) {
      // Remove from supervisor.projectAssignments for this project+employee
      const beforeCount = (supervisor as any).projectAssignments?.length || 0;
      (supervisor as any).projectAssignments = (supervisor as any).projectAssignments?.filter(
        (pa: any) => !(String(pa.employeeId) === String(employeeId) && String(pa.projectId) === String(projectId))
      ) || [];

      // If employee has no remaining assignments with this supervisor, remove from supervisor.employees
      const stillHasAssignmentsWithSupervisor = (supervisor as any).projectAssignments?.some(
        (pa: any) => String(pa.employeeId) === String(employeeId)
      );
      if (!stillHasAssignmentsWithSupervisor) {
        (supervisor as any).employees = (supervisor as any).employees?.filter(
          (e: any) => String(e) !== String(employeeId)
        ) || [];
      }
      await supervisor.save();

      // Update employee.assignedProjects by removing the specific assignment
      (employee as any).assignedProjects = (employee as any).assignedProjects?.filter(
        (ap: any) => !(String(ap.projectId) === String(projectId) && String(ap.supervisorId) === String(supervisor._id))
      ) || [];

      // If no remaining assignedProjects, clear legacy single fields
      if (!(employee as any).assignedProjects.length) {
        (employee as any).supervisor = undefined;
        (employee as any).projectId = undefined;
      }
      await employee.save();

      return NextResponse.json(
        { message: 'Project assignment removed successfully' },
        { status: 200 }
      );
    }

    // Fallback: if projectId not provided, remove all assignments for this employee under supervisor
    (supervisor as any).projectAssignments = (supervisor as any).projectAssignments?.filter(
      (pa: any) => String(pa.employeeId) !== String(employeeId)
    ) || [];
    (supervisor as any).employees = (supervisor as any).employees?.filter(
      (e: any) => String(e) !== String(employeeId)
    ) || [];
    await supervisor.save();

    (employee as any).assignedProjects = (employee as any).assignedProjects?.filter(
      (ap: any) => String(ap.supervisorId) !== String(supervisor._id)
    ) || [];
    if (!(employee as any).assignedProjects.length) {
      (employee as any).supervisor = undefined;
      (employee as any).projectId = undefined;
    }
    await employee.save();

    return NextResponse.json(
      { message: 'Employee unassigned from supervisor successfully' },
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

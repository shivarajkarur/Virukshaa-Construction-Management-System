import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import Attendance from "@/models/Attendance";
import Employee from "@/models/EmployeeModel";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// POST: Mark attendance for monthly employees only
export async function POST(req: NextRequest) {
  await connectToDB();
  try {
    // Defensive index migration: drop legacy unique index without projectId and ensure correct compound index
    try {
      const existing = await Attendance.collection.indexes().catch(() => [] as any);
      const hasLegacyEmpDate = Array.isArray(existing) && existing.some((idx: any) => idx?.name === 'employeeId_1_date_1');
      if (hasLegacyEmpDate) {
        await Attendance.collection.dropIndex('employeeId_1_date_1').catch(() => null);
      }
      await Attendance.collection.createIndex({ employeeId: 1, projectId: 1, date: 1 }, { name: 'employeeId_1_projectId_1_date_1', unique: true }).catch(() => null);
    } catch (_) {}
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { 
      employeeId, 
      projectId,
      date, 
      status, 
      leaveReason = null, 
      isPaid = true,
      timestamp = new Date().toISOString(),
      allowOtherProject = false
    } = await req.json();

    // Validate required fields
    if (!employeeId || !date || !status) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    // Enforce project scoping for employee attendance
    if (!projectId) {
      return NextResponse.json({ message: "Project ID is required when marking employee attendance" }, { status: 400 });
    }

    // Validate status value
    if (!['Present', 'Absent', 'On Duty'].includes(status)) {
      return NextResponse.json({ message: "Invalid status value" }, { status: 400 });
    }

    // Convert date string to Date object
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Check if employee exists and is a monthly employee
    const employee = await Employee.findById(employeeId);
    
    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    // Ensure employee is a monthly worker
    if (employee.workType !== 'Monthly') {
      return NextResponse.json({ 
        message: "Attendance setting is only available for monthly employees" 
      }, { status: 400 });
    }

    // Ensure employee is assigned to the provided project
    const isOnProject = (
      Array.isArray(employee.assignedProjects) && employee.assignedProjects.some((p: any) => String(p.projectId) === String(projectId))
    ) || (employee.projectId && String(employee.projectId) === String(projectId));
    if (!isOnProject) {
      return NextResponse.json({ message: "Employee not assigned to this project" }, { status: 403 });
    }

    // Prevent cross-project attendance clashes for the same day
    // If attendance already exists for this employee on the same date in another project,
    // either block or apply a default absent record when explicitly allowed.
    const existingSameDayAnyProject = await Attendance.findOne({
      employeeId: employee._id,
      date: attendanceDate
    });

    if (existingSameDayAnyProject && String(existingSameDayAnyProject.projectId) !== String(projectId)) {
      if (!allowOtherProject) {
        return NextResponse.json({
          success: false,
          message: "Attendance already set for this employee today in another project",
          conflictWithProjectId: existingSameDayAnyProject.projectId
        }, { status: 409 });
      }
      // Force default absent for cross-project marking
      // Overwrite incoming status/leaveReason to maintain consistent business rule
      // indicating work logged on a different project.
      // Note: we keep isPaid=false by default for cross-project absent unless caller sets true.
      const defaultReason = 'Assigned to another project today';
      (updateObj as any).status = 'Absent';
      (updateObj as any).leaveReason = defaultReason;
      (updateObj as any).isLeaveApproved = true;
      (updateObj as any).isLeavePaid = isPaid === true ? true : false;
    }

    // Prepare the filter to find existing attendance (project-scoped)
    const filter = { 
      employeeId: employee._id, 
      projectId, 
      date: attendanceDate 
    };

    // Prepare the update object
    const updateObj: any = { 
      status,
      updatedAt: new Date(),
      processedAt: new Date(),
      processedBy: (session as any).user?.id, // Use the authenticated user's ID
    };

    // Handle leave reason and payment status if provided 
    if (leaveReason !== null) {
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
          runValidators: true
        }
      );
    } catch (e: any) {
      // If a duplicate occurs due to legacy index state or race, treat as override
      if (e && e.code === 11000) {
        try {
          attendance = await Attendance.findOneAndUpdate(
            filter,
            updateObj,
            { 
              upsert: false, 
              new: true, 
              runValidators: true
            }
          );
        } catch (e2: any) {
          return NextResponse.json({ 
            success: false,
            message: "Unable to update attendance due to duplicate constraint", 
            error: e2?.message || String(e2) 
          }, { status: 409 });
        }
      } else {
        throw e;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Attendance marked successfully",
      data: attendance 
    }, { status: 201 });
  } catch (error) {
    console.error("Error marking attendance for monthly employee:", error);
    
    // Handle different types of errors
    if (error instanceof Error) {
      // Mongoose validation errors
      if (error.name === 'ValidationError') {
        return NextResponse.json({ 
          success: false,
          message: "Validation error", 
          error: error.message 
        }, { status: 400 });
      }
      
      // Duplicate handled above by override path; fall through for other errors
    }
    
    // Generic server error
    return NextResponse.json({ 
      success: false,
      message: "Internal Server Error", 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

// GET: Fetch attendance for monthly employees
export async function GET(req: NextRequest) {
  await connectToDB();
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ 
        success: false,
        message: "Unauthorized" 
      }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const employeeId = searchParams.get("employeeId");
    const projectId = searchParams.get("projectId");

    // Validate date parameters
    if ((startDate && !endDate) || (!startDate && endDate)) {
      return NextResponse.json({ 
        success: false,
        message: "Both startDate and endDate must be provided for date range queries" 
      }, { status: 400 });
    }

    let filter: any = {};

    // Date filtering
    if (startDate && endDate) {
      // Range query
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new Error("Invalid date format");
        }
        
        filter.date = { $gte: start, $lte: end };
      } catch (err) {
        return NextResponse.json({ 
          success: false,
          message: "Invalid date format for date range" 
        }, { status: 400 });
      }
    } else if (date) {
      // Single day query
      try {
        const targetDate = new Date(date);
        
        if (isNaN(targetDate.getTime())) {
          throw new Error("Invalid date format");
        }
        
        targetDate.setUTCHours(0, 0, 0, 0);
        const nextDay = new Date(targetDate);
        nextDay.setUTCDate(targetDate.getUTCDate() + 1);
        filter.date = { $gte: targetDate, $lt: nextDay };
      } catch (err) {
        return NextResponse.json({ 
          success: false,
          message: "Invalid date format" 
        }, { status: 400 });
      }
    } else {
      // Default to today if no date specified
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setUTCDate(today.getUTCDate() + 1);
      filter.date = { $gte: today, $lt: tomorrow };
    }

    // Optional project scoping
    if (projectId) {
      const mongoose = (await import('mongoose')).default;
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return NextResponse.json({ 
          success: false,
          message: "Invalid project ID format" 
        }, { status: 400 });
      }
      filter.projectId = projectId;
    }

    // Employee filtering
    if (employeeId) {
      // Validate employeeId format
      const mongoose = (await import('mongoose')).default;
      if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        return NextResponse.json({ 
          success: false,
          message: "Invalid employee ID format" 
        }, { status: 400 });
      }
      filter.employeeId = employeeId;
      
      // Verify employee is a monthly employee
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return NextResponse.json({ 
          success: false,
          message: "Employee not found" 
        }, { status: 404 });
      }
      
      if (employee.workType !== 'Monthly') {
        return NextResponse.json({ 
          success: false,
          message: "Employee is not a monthly employee" 
        }, { status: 400 });
      }
    } else {
      // Only fetch records for monthly employees, optionally scoped to project assignment
      let monthlyQuery: any = { workType: 'Monthly' };
      if (projectId) {
        monthlyQuery = {
          workType: 'Monthly',
          $or: [
            { projectId },
            { 'assignedProjects.projectId': projectId }
          ]
        };
      }
      const monthlyEmployees = await Employee.find(monthlyQuery).select('_id');
      const monthlyEmployeeIds = monthlyEmployees.map(emp => emp._id);
      filter.employeeId = { $in: monthlyEmployeeIds };
    }

    // Fetch attendance records
    const attendanceRecords = await Attendance.find(filter)
      .populate("employeeId", "_id name email phone role salary workType")
      .sort({ date: 1 });

    return NextResponse.json({
      success: true,
      message: "Attendance records retrieved successfully",
      data: attendanceRecords
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching monthly employee attendance:", error);
    return NextResponse.json({ 
      success: false,
      message: "Internal Server Error",
      error: (error as Error).message 
    }, { status: 500 });
  }
}
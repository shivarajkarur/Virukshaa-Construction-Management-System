import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import Attendance from "@/models/Attendance";
import Employee from "@/models/EmployeeModel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST: Mark attendance for monthly employees only
export async function POST(req: NextRequest) {
  await connectToDB();
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { 
      employeeId, 
      date, 
      status, 
      leaveReason = null, 
      isPaid = true,
      timestamp = new Date().toISOString()
    } = await req.json();

    // Validate required fields
    if (!employeeId || !date || !status) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
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

    // Prepare the filter to find existing attendance
    const filter = { 
      employeeId: employee._id, 
      date: attendanceDate 
    };

    // Prepare the update object
    const updateObj: any = { 
      status,
      updatedAt: new Date(),
      processedAt: new Date(),
      processedBy: session.user.id, // Use the authenticated user's ID
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

    const attendance = await Attendance.findOneAndUpdate(
      filter,
      updateObj,
      { 
        upsert: true, 
        new: true, 
        setDefaultsOnInsert: true,
        runValidators: true
      }
    );

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
      
      // MongoDB duplicate key error
      if ((error as any).code === 11000) {
        return NextResponse.json({ 
          success: false,
          message: "Duplicate attendance record", 
          error: "An attendance record already exists for this employee on this date" 
        }, { status: 409 });
      }
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
      // Only fetch records for monthly employees
      const monthlyEmployees = await Employee.find({ workType: 'Monthly' }).select('_id');
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
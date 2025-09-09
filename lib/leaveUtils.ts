import { Types } from "mongoose";
import Attendance from "@/models/Attendance";

interface LeaveCheckResult {
  requiresApproval: boolean;
  leaveDays: number;
  maxAllowedBeforeApproval: number;
}

/**
 * Checks if a leave request requires approval based on the number of leave days taken in the month
 * @param userId The ID of the user (supervisor/employee)
 * @param date The date of the leave request
 * @returns Object containing leave check results
 */
export const checkLeaveRequiresApproval = async (
  userId: string | Types.ObjectId,
  date: Date
): Promise<LeaveCheckResult> => {
  const leaveDate = new Date(date);
  const currentMonth = leaveDate.getMonth();
  const currentYear = leaveDate.getFullYear();
  
  // Get the first and last day of the month
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  
  // Count existing leave days in the month
  const leaveDays = await Attendance.countDocuments({
    $or: [
      { supervisorId: userId },
      { employeeId: userId }
    ],
    status: "Absent",
    date: { $gte: firstDay, $lte: lastDay },
    // Only count leaves that don't require approval or are already approved
    $or: [
      { isLeaveApproved: { $exists: false } },
      { isLeaveApproved: true }
    ]
  });

  const maxAllowedBeforeApproval = 2; // Maximum leaves before approval is required
  
  return {
    requiresApproval: leaveDays >= maxAllowedBeforeApproval,
    leaveDays,
    maxAllowedBeforeApproval
  };
};

/**
 * Calculates the number of working days in a month (excluding weekends)
 * @param year The year
 * @param month The month (0-11)
 * @returns Number of working days in the month
 */
export const getWorkingDaysInMonth = (year: number, month: number): number => {
  let count = 0;
  const date = new Date(year, month, 1);
  
  while (date.getMonth() === month) {
    const day = date.getDay();
    // Count weekdays (0 = Sunday, 6 = Saturday)
    if (day !== 0 && day !== 6) {
      count++;
    }
    date.setDate(date.getDate() + 1);
  }
  
  return count;
};

/**
 * Gets leave statistics for a user in a given month
 * @param userId The ID of the user (supervisor/employee)
 * @param year The year
 * @param month The month (0-11)
 * @returns Object containing leave statistics
 */
export const getLeaveStatistics = async (
  userId: string | Types.ObjectId,
  year: number,
  month: number
) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const [leaves, workingDays] = await Promise.all([
    // Get all leave records for the month
    Attendance.find({
      $or: [
        { supervisorId: userId },
        { employeeId: userId }
      ],
      status: "Absent",
      date: { $gte: firstDay, $lte: lastDay }
    }),
    // Get working days in month
    getWorkingDaysInMonth(year, month)
  ]);
  
  const paidLeaves = leaves.filter(leave => leave.isLeavePaid).length;
  const unpaidLeaves = leaves.filter(leave => leave.isLeaveApproved && !leave.isLeavePaid).length;
  const pendingLeaves = leaves.filter(leave => leave.isLeaveApproved === undefined).length;
  const rejectedLeaves = leaves.filter(leave => leave.isLeaveApproved === false).length;
  
  return {
    totalLeaves: leaves.length,
    paidLeaves,
    unpaidLeaves,
    pendingLeaves,
    rejectedLeaves,
    workingDays,
    workingDaysRemaining: workingDays - leaves.length
  };
};

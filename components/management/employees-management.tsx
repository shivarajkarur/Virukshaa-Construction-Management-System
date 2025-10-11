"use client"
import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Search,
  Users,
  UserCheck,
  DollarSign,
  Briefcase,
  Grid3X3,
  List,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Clock4,
  MapPin,
  Eye,
  MessageCircle,
  TrendingUp,
  CalendarDays,
  IndianRupee,
  Loader2,
  AlertCircle
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Calculator, HelpCircle } from "lucide-react"
// Modified to allow admin access

import SupervisorEmployee from "./supervisor-employee"

type AttendanceStatus = "Present" | "Absent" | "On Duty" | null

type SupervisorEmployeeItem = {
  _id: string
  name: string
  email?: string
  phone?: string
  role?: string
  position?: string
  avatar?: string
  salary?: number
  workType?: string
  shiftsWorked?: number
  joinDate?: string
  status?: string
  endDate?: string
  address?: string
  projectId?: string
  attendance?: {
    present: boolean
    checkIn?: string
    checkOut?: string
    status?: AttendanceStatus
  }
}

type IProject = {
  _id: string
  title: string
}

// Attendance record type for API responses
interface AttendanceRecord {
  _id: string
  employeeId: string | { _id: string }
  date: string
  status: AttendanceStatus
  checkIn?: string
  checkOut?: string
  present?: boolean
  leaveReason?: string | null
  isPaid?: boolean
  isLeaveApproved?: boolean
  isLeavePaid?: boolean
  createdAt: string
  updatedAt: string
}

// Helper function to normalize attendance status values
function normalizeAttendanceStatus(value: any, presentFlag?: boolean): AttendanceStatus {
  if (typeof value === "string") {
    const normalized = value.trim()
    if (normalized === "Present" || normalized === "Absent" || normalized === "On Duty") {
      return normalized
    }
  }

  // Fallback logic based on present flag
  if (typeof presentFlag === "boolean") {
    return presentFlag ? "Present" : "Absent"
  }

  return null
}

const attendanceOptions = [
  { value: "Present" as const, label: "Present", icon: CheckCircle },
  { value: "On Duty" as const, label: "On Duty", icon: Briefcase },
  { value: "Absent" as const, label: "Absent", icon: XCircle },
]

// Combined Attendance and Salary View for Employees (project-scoped)
function CombinedAttendanceView({
  employeeId,
  dailySalary,
  initialMonth,
  projectId,
}: {
  employeeId: string
  dailySalary: number
  initialMonth?: string
  projectId?: string | null
}) {
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({})
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(initialMonth || new Date().toISOString().slice(0, 7))
  const [presentDays, setPresentDays] = useState(0)
  const [onDutyDays, setOnDutyDays] = useState(0)
  const [paidLeaveDays, setPaidLeaveDays] = useState(0)
  const [unpaidLeaveDays, setUnpaidLeaveDays] = useState(0)
  const [pendingLeaveDays, setPendingLeaveDays] = useState(0)
  const [totalWorkingDays, setTotalWorkingDays] = useState(0)
  const [attendanceRate, setAttendanceRate] = useState(0)
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true)
        if (!projectId) {
          // Project-scoped attendance is required for employee queries on API
          console.warn("[CombinedAttendanceView] No projectId provided; skipping fetch")
          setAttendanceData([])
          setAttendanceMap({})
          setPresentDays(0)
          setOnDutyDays(0)
          setPaidLeaveDays(0)
          setUnpaidLeaveDays(0)
          setPendingLeaveDays(0)
          setTotalWorkingDays(0)
          setAttendanceRate(0)
          setLoading(false)
          return
        }
        const [fetchYear, fetchMonthNum] = selectedMonth.split("-").map(Number)
        const startDate = new Date(Date.UTC(fetchYear, fetchMonthNum - 1, 1))
        const endDate = new Date(Date.UTC(fetchYear, fetchMonthNum, 0, 23, 59, 59, 999))
        const res = await fetch(
          `/api/attendance?employeeId=${employeeId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&projectId=${encodeURIComponent(projectId)}`,
        )
        if (!res.ok) throw new Error("Failed to fetch attendance")
        const json = await res.json()
        const arr: AttendanceRecord[] = Array.isArray(json)
          ? json
          : Array.isArray((json as any)?.data)
            ? (json as any).data
            : []
        setAttendanceData(arr)

        const map: Record<string, AttendanceStatus> = {}
        let present = 0
        let onDuty = 0
        let paid = 0
        let unpaid = 0
        let pending = 0

        const [currentYear, currentMonth] = selectedMonth.split("-").map(Number)
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
        let workingDays = 0

        arr.forEach((record) => {
          if (!record.date) return
          const date = new Date(record.date)
          if (isNaN(date.getTime())) return
          const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          const dateKey = localDate.toISOString().split("T")[0]
          map[dateKey] = (record.status as AttendanceStatus) || "Absent"

          if (record.status === "Present") {
            present++
          } else if (record.status === "On Duty") {
            onDuty++
          } else if (record.status === "Absent") {
            if (record.isLeaveApproved === true) {
              const isPaidLeave = record.isLeavePaid === true || record.isPaid === true
              if (isPaidLeave) paid++
              else unpaid++
            } else {
              pending++
            }
          }
        })

        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(Date.UTC(currentYear, currentMonth - 1, day))
          if (date > new Date()) continue
          const dayOfWeek = date.getUTCDay()
          if (dayOfWeek === 0) continue // Sunday
          workingDays++
        }

        setPresentDays(present)
        setOnDutyDays(onDuty)
        setPaidLeaveDays(paid)
        setUnpaidLeaveDays(unpaid)
        setPendingLeaveDays(pending)
        setTotalWorkingDays(workingDays)
        const effective = present + onDuty + paid
        setAttendanceRate(workingDays > 0 ? Math.round((effective / workingDays) * 100) : 0)
        setAttendanceMap(map)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    if (employeeId && selectedMonth) {
      fetchAttendance()
    }
  }, [employeeId, selectedMonth])

  const months = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      // Anchor to UTC first day of month to avoid timezone rollover duplicates
      const dt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
      return {
        value: dt.toISOString().slice(0, 7),
        label: dt.toLocaleString("default", { month: "long", year: "numeric" }),
      }
    })
  }, [employeeId, projectId, selectedMonth])

  const [year, monthNum] = selectedMonth.split("-").map(Number)
  const firstDay = new Date(Date.UTC(year, monthNum - 1, 1))
  const lastDay = new Date(Date.UTC(year, monthNum, 0))
  const daysInMonth = lastDay.getUTCDate()
  const startDayIdx = firstDay.getUTCDay()
  const selectedMonthLabel = months.find((m) => m.value === selectedMonth)?.label || selectedMonth

  const leaveInfoMap = useMemo(() => {
    const map: Record<string, { status: "paid" | "unpaid" | "pending"; reason?: string }> = {}
    attendanceData.forEach((record) => {
      if (record.status === "Absent" && record.date) {
        const date = new Date(record.date)
        const key = date.toISOString().split("T")[0]
        if (record.isLeaveApproved === true) {
          const isPaidLeave = record.isLeavePaid === true || record.isPaid === true
          map[key] = { status: isPaidLeave ? "paid" : "unpaid", reason: record.leaveReason ?? undefined }
        } else if (record.isLeaveApproved === undefined) {
          map[key] = { status: "pending", reason: record.leaveReason ?? undefined }
        }
      }
    })
    return map
  }, [attendanceData])

  const calendarData = useMemo(() => {
    const days: Array<{
      date: number
      isCurrentMonth: boolean
      status?: AttendanceStatus
      isFuture: boolean
      isSunday: boolean
      dateKey?: string
      leaveInfo?: { status: "paid" | "unpaid" | "pending"; reason?: string }
    }> = []

    for (let i = 0; i < startDayIdx; i++) {
      days.push({ date: 0, isCurrentMonth: false, isFuture: false, isSunday: false })
    }

    const today = new Date()
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(Date.UTC(year, monthNum - 1, d))
      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      const dateKey = localDate.toISOString().split("T")[0]
      const dayOfWeek = date.getUTCDay()
      const isFuture = date > today
      const isSunday = dayOfWeek === 0

      days.push({
        date: d,
        isCurrentMonth: true,
        status: attendanceMap[dateKey] || null,
        isFuture,
        isSunday,
        dateKey,
        leaveInfo: leaveInfoMap[dateKey],
      })
    }

    while (days.length < 42) {
      days.push({ date: 0, isCurrentMonth: false, isFuture: false, isSunday: false })
    }

    return days
  }, [attendanceMap, leaveInfoMap, startDayIdx, daysInMonth, monthNum, year])

  const totalSalary = (presentDays + paidLeaveDays + onDutyDays) * dailySalary

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Attendance & Salary Details
            </CardTitle>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={`month-${m.value}`} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="text-3xl font-bold text-primary mb-1">{attendanceRate}%</div>
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="text-3xl font-bold text-green-600 flex items-center gap-1">
                    <IndianRupee className="w-6 h-6" />
                    {totalSalary.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Salary</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4 space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Salary Breakdown
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Rate:</span>
                  <span className="font-medium">₹{dailySalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Present Days:</span>
                  <span className="font-medium">{presentDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">On Duty (Paid):</span>
                  <span className="font-medium text-blue-600">+{onDutyDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid Leave:</span>
                  <span className="font-medium text-green-600">+{paidLeaveDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unpaid Leave:</span>
                  <span className="font-medium text-amber-600">{unpaidLeaveDays} days</span>
                </div>
                {pendingLeaveDays > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pending Approval:</span>
                    <span className="font-medium text-purple-600">{pendingLeaveDays} days</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Working Days:</span>
                  <span className="font-medium">{totalWorkingDays} days</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Monthly Earnings:</span>
                  <div className="text-right">
                    <div className="text-green-600">₹{totalSalary.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {selectedMonthLabel} Calendar
              </h4>
              <div className="grid grid-cols-7 gap-1 mb-2 text-xs text-center font-medium text-muted-foreground">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="p-2">
                    {d}
                  </div>
                ))}
              </div>
              <TooltipProvider>
                <div className="grid grid-cols-7 gap-1">
                  {calendarData.map((day, idx) => {
                    let className = "aspect-square p-2 text-sm rounded-md flex items-center justify-center border"
                    let tooltip = ""

                    if (!day.isCurrentMonth) {
                      className += " text-muted-foreground/50"
                    } else if (day.isSunday) {
                      className += " bg-gray-50 text-gray-400"
                      tooltip = "Sunday (Holiday)"
                    } else if (day.isFuture) {
                      className += " bg-background text-muted-foreground"
                      tooltip = "Future date"
                    } else if (day.status === "Present") {
                      className += " bg-green-100 text-green-800 font-medium border-green-200"
                      tooltip = "Present"
                    } else if (day.status === "On Duty") {
                      className += " bg-blue-100 text-blue-800 font-medium border-blue-200"
                      tooltip = "On Duty (Paid)"
                    } else if (day.status === "Absent" && day.leaveInfo) {
                      if (day.leaveInfo.status === "paid") {
                        className += " bg-purple-100 text-purple-800 font-medium border-purple-200"
                        tooltip = "Paid Leave"
                      } else if (day.leaveInfo.status === "unpaid") {
                        className += " bg-amber-100 text-amber-800 font-medium border-amber-200"
                        tooltip = "Unpaid Leave"
                      } else {
                        className += " bg-gray-100 text-gray-800 font-medium border-gray-200"
                        tooltip = "Leave Pending Approval"
                      }
                    } else if (day.status === "Absent") {
                      className += " bg-red-100 text-red-800 font-medium border-red-200"
                      tooltip = "Absent (No Leave)"
                    } else {
                      className += " bg-background hover:bg-muted/50"
                      tooltip = "No attendance record"
                    }

                    const cell = (
                      <div className={className} key={idx}>
                        {day.isCurrentMonth ? day.date : ""}
                        {day.isCurrentMonth && !day.status && !day.isFuture && !day.isSunday && (
                          <HelpCircle className="w-2 h-2 ml-1 text-muted-foreground" />
                        )}
                      </div>
                    )

                    return day.isCurrentMonth && tooltip ? (
                      <Tooltip key={idx}>
                        <TooltipTrigger asChild>{cell}</TooltipTrigger>
                        <TooltipContent className="max-w-xs p-3 space-y-1">
                          <div className="font-medium">{tooltip.split("\n")[0]}</div>
                          {day.leaveInfo?.reason && (
                            <div className="text-sm text-muted-foreground pt-1 border-t mt-1">
                              <p className="font-medium">Reason:</p>
                              <p className="whitespace-pre-wrap">{day.leaveInfo.reason}</p>
                            </div>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <div key={idx}>{cell}</div>
                    )
                  })}
                </div>
              </TooltipProvider>

              <div className="flex justify-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border-green-200 border rounded" />
                  <span className="text-muted-foreground">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border-red-200 border rounded" />
                  <span className="text-muted-foreground">Absent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-background border rounded" />
                  <span className="text-muted-foreground">No Record</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-50 border rounded" />
                  <span className="text-muted-foreground">Holiday</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface Employee {
  _id: string
  name: string
  email?: string
  phone: string
  role: string
  salary: number
  workType: "Daily" | "Monthly" | "Contract"
  status: "Active" | "On Leave" | "Inactive"
  joinDate: string
  endDate?: string
  address: string
  avatar?: string
  department?: string
  supervisor?: string
  skills?: string[]
  createdAt: string
  updatedAt: string
  attendance?: {
    present: boolean
    checkIn?: string
    checkOut?: string
    status?: AttendanceStatus
  }
}

export default function EmployeesManagement() {
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list" | "project">("grid")

  // Projects view states
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [projectViewMode, setProjectViewMode] = useState<"grid" | "list">("grid")
  const [projects, setProjects] = useState<any[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [projectError, setProjectError] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<any | null>(null)

  // Project-specific employee states (from supervisor-employee.tsx)
  const [projectEmployees, setProjectEmployees] = useState<Employee[]>([])
  const [loadingProjectEmployees, setLoadingProjectEmployees] = useState(false)
  const [projectEmployeeError, setProjectEmployeeError] = useState<string | null>(null)

  // Shift and attendance management states (from supervisor-employee.tsx)
  const [shiftData, setShiftData] = useState<
    Record<string, { shifts: number; perShiftSalary: number; totalPay?: number }>
  >({})
  const [isShiftLoading, setIsShiftLoading] = useState<boolean>(false)
  const [attendanceData, setAttendanceData] = useState<
    Record<
      string,
      { status: AttendanceStatus; checkIn?: string; checkOut?: string; present: boolean; projectId: string }
    >
  >({})

  const fetchAllProjects = async () => {
    try {
      setLoadingProjects(true)
      setProjectError(null)
      // Get user role from localStorage
      const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null
      const supervisorId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null

      // Treat 'admin' and 'superadmin' equally for full access; supervisors see only their projects
      const isAdmin = role === 'admin' || role === 'superadmin'
      const url = isAdmin
        ? "/api/projects"
        : `/api/projects?supervisorId=${encodeURIComponent(supervisorId || '')}`

      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store"
      })

      if (!res.ok) throw new Error("Failed to fetch projects")
      const data = await res.json()

      // Ensure admin users see all projects without any filtering
      setProjects(Array.isArray(data) ? data : [])

      console.debug('[fetchAllProjects] role:', role, 'isAdmin:', isAdmin, 'url:', url)
      console.log(`Fetched ${Array.isArray(data) ? data.length : 0} projects for ${role} user`)
    } catch (e) {
      console.error("Error fetching projects:", e)
      setProjectError("Failed to load projects")
    } finally {
      setLoadingProjects(false)
    }
  }

  // Detail Sheet States
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false)
  const [employeePerformance, setEmployeePerformance] = useState<any[]>([])
  const [employeeProjects, setEmployeeProjects] = useState<any[]>([])
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false)

  // Shift tracking (local, per-day): 0-3 shifts per employee for calculations
  const [shiftsToday, setShiftsToday] = useState<Record<string, number>>({})
  const roundToHalf = (n: number) => Math.round((n ?? 0) * 2) / 2
  const clampShift = (n: number) => Math.max(0, Math.min(3, roundToHalf(n)))
  // Prefer project-scoped shift data; fall back to local state only when needed
  const getProjectShiftCount = (id: string) => {
    const s = shiftData[id]?.shifts
    return clampShift(typeof s === "number" ? s : 0)
  }
  const getShiftCount = (id: string) => {
    const s = shiftData[id]?.shifts
    return clampShift(typeof s === "number" ? s : (shiftsToday[id] ?? 0))
  }
  const setShiftCount = (id: string, val: number) => setShiftsToday((prev) => ({ ...prev, [id]: clampShift(val) }))
  const calcTodaysPay = (emp: Employee) => {
    const shifts = getProjectShiftCount(emp._id)
    const perShift = typeof shiftData[emp._id]?.perShiftSalary === "number" ? shiftData[emp._id]!.perShiftSalary! : (emp.salary || 0)
    return shifts * perShift
  }

  // INR currency formatter
  const formatINR = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val || 0)

  // Status variant helper for employee status badges
  const getStatusVariant = (status?: string) => {
    if (!status) return "secondary" as const
    const s = status.toLowerCase()
    if (s.includes("active") || s.includes("working")) return "default" as const
    if (s.includes("inactive") || s.includes("terminated")) return "destructive" as const
    if (s.includes("pending")) return "secondary" as const
    return "outline" as const
  }

  // Project status variant helper for project status badges
  const getProjectStatusVariant = (status?: string) => {
    if (!status) return "secondary" as const
    const s = status.toLowerCase()
    if (s.includes("completed") || s.includes("finished")) return "default" as const
    if (s.includes("active") || s.includes("progress")) return "outline" as const
    if (s.includes("pending") || s.includes("planning")) return "secondary" as const
    if (s.includes("delayed") || s.includes("cancelled")) return "destructive" as const
    return "outline" as const
  }

  const getTodayDateStr = () => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, "0")
    const dd = String(today.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

  const handleAttendanceChange = async (
    employeeId: string,
    status: AttendanceStatus,
    dateStr: string = getTodayDateStr(),
    leaveReason: string | null = null,
    isPaid = true,
  ) => {
    // Debug: entry
    console.debug("[handleAttendanceChange]", { employeeId, status, dateStr, leaveReason, isPaid, selectedProject })
    const employee = employees.find((x) => x._id === employeeId)
    if (!employee) {
      toast({ title: "Error", description: "Employee not found", variant: "destructive" })
      return false
    }

    // Only allow attendance setting for monthly employees
    if (employee.workType !== "Monthly") {
      toast({ title: "Error", description: "Attendance setting is only available for monthly employees", variant: "destructive" })
      return false
    }

    try {
      const now = new Date()
      const timestamp = now.toISOString()

      // Determine effective projectId for this employee
      const assigned = Array.isArray((employee as any).assignedProjects) ? (employee as any).assignedProjects : []
      let effectiveProjectId: string | null = null
      if (assigned.length === 1) effectiveProjectId = String(assigned[0].projectId)
      else if ((employee as any).projectId) effectiveProjectId = String((employee as any).projectId)

      // Prefer UI-selected project if available
      const uiProjectId = (selectedProject as any)?._id || null
      const projectIdToUse = uiProjectId || effectiveProjectId
      if (!projectIdToUse) {
        toast({ title: "Select project", description: "Employee has multiple/no assignments. Please assign or select a project before marking attendance.", variant: "destructive" })
        console.warn("[handleAttendanceChange] No projectId", { employeeId, assigned, selectedProject })
        return false
      }

      // Use project-scoped attendance endpoint
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, projectId: projectIdToUse, date: dateStr, status, leaveReason, isPaid, timestamp }),
      })

      const data = await response.json().catch(() => ({}))
      console.debug("[handleAttendanceChange] response", { ok: response.ok, status: response.status, body: data })

      if (response.ok && (data as any)?.success) {
        // Update local state optimistically
        setEmployees((prev) =>
          prev.map((emp) =>
            emp._id === employeeId
              ? {
                ...emp,
                attendance: {
                  ...emp.attendance,
                  status,
                  checkIn: status === "Present" || status === "On Duty" ? timestamp : emp.attendance?.checkIn,
                  present: status === "Present" || status === "On Duty",
                },
              }
              : emp,
          ),
        )

        // Project-scoped cache and persistence
        const attendanceKey = `${projectIdToUse}_${employeeId}`
        setAttendanceData((prev) => {
          const next = { ...prev }
          next[attendanceKey] = {
            status,
            checkIn: status === "Present" || status === "On Duty" ? timestamp : prev[attendanceKey]?.checkIn,
            checkOut: prev[attendanceKey]?.checkOut,
            present: status === "Present" || status === "On Duty",
            projectId: projectIdToUse,
          }
          return next
        })
        if (typeof window !== "undefined" && projectIdToUse) {
          try {
            const currentData = { ...attendanceData }
            currentData[attendanceKey] = {
              status,
              checkIn: status === "Present" || status === "On Duty" ? timestamp : attendanceData[attendanceKey]?.checkIn,
              checkOut: attendanceData[attendanceKey]?.checkOut,
              present: status === "Present" || status === "On Duty",
              projectId: projectIdToUse,
            }
            sessionStorage.setItem(`attendanceData:${projectIdToUse}`, JSON.stringify(currentData))
          } catch { }
        }

        toast({ title: "Success", description: (data as any)?.message || `${employee.name}'s attendance updated to ${status}` })
        if (projectIdToUse) {
          try { await fetchAttendanceRealtime(projectIdToUse) } catch { }
        }
        return true
      } else {
        toast({ title: "Error", description: (data as any)?.message || "Failed to update attendance", variant: "destructive" })
        return false
      }
    } catch (error) {
      console.error("Error updating attendance:", error)
      toast({ title: "Error", description: "Failed to update attendance. Please try again.", variant: "destructive" })
      return false
    }
  }

  const fetchAttendanceRealtime = async (projectId?: string) => {
    try {
      const today = getTodayDateStr()
      const res = await fetch(
        `/api/attendance?date=${today}&monthlyEmployees=true${projectId ? `&projectId=${projectId}` : ""}`,
        {
          cache: "no-store",
          headers: { Accept: "application/json" },
        },
      )
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body?.success) {
        if (res.status === 401) {
          toast({
            title: "Error",
            description: "Unauthorized. Please sign in to view live attendance.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: body?.message || "Failed to fetch attendance.",
            variant: "destructive",
          })
        }
        return
      }

      const records: any[] = body.data || []
      // Build a map of employeeId -> preferred projectId
      const preferredProjectByEmployee = new Map<string, string | null>()
      for (const emp of employees) {
        const assigned = Array.isArray((emp as any).assignedProjects) ? (emp as any).assignedProjects : []
        let effectiveProjectId: string | null = null
        if (assigned.length === 1) effectiveProjectId = String(assigned[0].projectId)
        else if ((emp as any).projectId) effectiveProjectId = String((emp as any).projectId)
        preferredProjectByEmployee.set(emp._id, effectiveProjectId)
      }

      // For each employee, pick the attendance record that matches preferred projectId or projectId if provided
      const attMap = new Map<string, any>()
      for (const rec of records) {
        const eid =
          typeof rec.employeeId === "string" ? rec.employeeId : (rec.employeeId as any)?._id || String(rec.employeeId)
        if (!eid) continue
        const recProjectId = String((rec as any).projectId || "")
        const preferred = preferredProjectByEmployee.get(String(eid)) || null

        // If a projectId was passed, only consider records matching it
        if (projectId) {
          if (recProjectId === projectId) {
            attMap.set(String(eid), rec)
          }
        } else {
          // If no specific projectId, use preferred project logic
          if (preferred) {
            if (recProjectId === String(preferred)) {
              attMap.set(String(eid), rec)
            }
          } else {
            // If no preferred project, fallback to first seen record for the employee
            if (!attMap.has(String(eid))) attMap.set(String(eid), rec)
          }
        }
      }

      // Update attendanceData state
      setAttendanceData((prev) => {
        const next = { ...prev }
        for (const emp of employees) {
          if (emp.workType !== "Monthly") continue
          const att = attMap.get(emp._id)
          const attendanceKey = projectId ? `${projectId}_${emp._id}` : `${(att as any)?.projectId || ""}_${emp._id}`

          if (!att) {
            // If no attendance record found, clear existing entry if it pertains to current view (projectId)
            if (projectId && attendanceKey in next) {
              delete next[attendanceKey]
            } else if (!projectId && attendanceKey in next) {
              delete next[attendanceKey]
            }
            continue
          }

          const statusNorm = normalizeAttendanceStatus((att as any).status, (att as any).present)
          next[attendanceKey] = {
            status: statusNorm,
            checkIn: att.checkIn || next[attendanceKey]?.checkIn,
            checkOut: att.checkOut || next[attendanceKey]?.checkOut,
            present: statusNorm === "Present" || statusNorm === "On Duty",
            projectId: att.projectId,
          }
        }
        return next
      })

      // Update local employees state for grid/list views
      setEmployees((prev) =>
        prev.map((emp) => {
          if (emp.workType !== "Monthly") return emp
          const att = attMap.get(emp._id)
          if (!att) {
            // Ensure attendance status is cleared if no record
            return {
              ...emp,
              attendance: { ...emp.attendance, status: null, present: false, checkIn: undefined, checkOut: undefined },
            }
          }
          const statusNorm = normalizeAttendanceStatus((att as any).status, (att as any).present)
          return {
            ...emp,
            attendance: {
              ...emp.attendance,
              status: statusNorm,
              checkIn: att.checkIn || emp.attendance?.checkIn,
              checkOut: att.checkOut || emp.attendance?.checkOut,
              present: statusNorm === "Present" || statusNorm === "On Duty",
            },
          }
        }),
      )
    } catch (err) {
      console.error("Error fetching live attendance:", err)
    }
  }

  const fetchEmployeeShifts = async () => {
    try {
      const dateStr = getTodayDateStr()
      const res = await fetch(`/api/employee-shifts?date=${dateStr}`, { cache: "no-store" })
      if (!res.ok) return
      const docs: Array<{ employeeId: string; shifts: number; projectId?: string }> = await res.json()
      const map: Record<string, number> = {}

      // Precompute preferred project per employee
      const preferredProjectByEmployee: Record<string, string | null> = {}
      for (const emp of employees) {
        const assigned = Array.isArray((emp as any).assignedProjects) ? (emp as any).assignedProjects : []
        let effectiveProjectId: string | null = null
        if (assigned.length === 1) effectiveProjectId = String(assigned[0].projectId)
        else if ((emp as any).projectId) effectiveProjectId = String((emp as any).projectId)
        preferredProjectByEmployee[emp._id] = effectiveProjectId
      }

      // Track if any shifts were updated externally
      let externalUpdates = false

      for (const d of docs) {
        // d.employeeId may be object when populated; handle both
        const id = typeof (d as any).employeeId === "object" ? (d as any).employeeId._id : d.employeeId
        const newShift = clampShift((d as any).shifts ?? 0)
        const docProjectId = String((d as any).projectId || "")
        const preferred = preferredProjectByEmployee[id] || null
        // Only include shifts that match the employee's preferred project
        if (preferred && docProjectId && docProjectId !== String(preferred)) {
          continue
        }

        // Check if this is an external update (shift differs from current local state)
        if (shiftsToday[id] !== newShift) {
          externalUpdates = true
        }

        map[id] = newShift
      }

      setShiftsToday((prev) => ({ ...prev, ...map }))

      // Show notification if shifts were updated from external source
      if (externalUpdates) {
        toast({
          title: "Shifts Updated",
          description: "Employee shifts have been updated from another interface",
          duration: 3000,
        })
      }
    } catch (e) {
      console.error("Failed to fetch employee shifts", e)
    }
  }

  // Real-time shift synchronization - refresh shifts automatically
  useEffect(() => {
    fetchEmployeeShifts()

    // Set up interval for real-time synchronization (every 10 seconds)
    const interval = setInterval(fetchEmployeeShifts, 10000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveEmployeeShift = async (emp: Employee, count: number) => {
    try {
      const dateStr = getTodayDateStr()
      // Determine effective projectId for this employee
      const assigned = Array.isArray((emp as any).assignedProjects) ? (emp as any).assignedProjects : []
      let effectiveProjectId: string | null = null
      if (assigned.length === 1) effectiveProjectId = String(assigned[0].projectId)
      else if ((emp as any).projectId) effectiveProjectId = String((emp as any).projectId)

      // Prefer UI-selected project if available
      const uiProjectId = (selectedProject as any)?._id || null
      const projectIdToUse = uiProjectId || effectiveProjectId
      if (!projectIdToUse) {
        toast({ title: "Select project", description: "Select a project before saving shifts", variant: "destructive" })
        console.warn("[saveEmployeeShift] No projectId", { empId: emp._id, assigned, selectedProject })
        return false
      }

      // Prepare auth header if available (required by PUT route for supervisor flows)
      const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (userId) headers["Authorization"] = `Bearer ${userId}`

      // If admin/superadmin, skip supervisor-only PUT and use POST directly
      const role = typeof window !== "undefined" ? localStorage.getItem("userRole") : null
      if (role === "admin" || role === "superadmin") {
        const payload = { employeeId: emp._id, projectId: projectIdToUse, date: dateStr, shifts: clampShift(count), perShiftSalary: emp.salary || 0 }
        console.debug("[saveEmployeeShift] Admin role detected, using POST", payload)
        let res = await fetch("/api/employee-shifts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        let doc = await res.json().catch(() => null)
        console.debug("[saveEmployeeShift] POST response", { ok: res.ok, status: res.status, body: doc })
        if (!res.ok) {
          toast.error((doc as any)?.message || "Failed to save shift count")
          return false
        }
        // Optimistically update project-scoped shift data
        setShiftData((prev) => {
          const next = { ...prev }
          next[emp._id] = {
            shifts: typeof (doc as any)?.shifts === "number" ? (doc as any).shifts : clampShift(count),
            perShiftSalary: typeof (doc as any)?.perShiftSalary === "number" ? (doc as any).perShiftSalary : (emp.salary || 0),
            totalPay: (doc as any)?.totalPay,
          }
          return next
        })
        if (typeof window !== 'undefined' && projectIdToUse) {
          try {
            const currentData = { ...shiftData, [emp._id]: { shifts: typeof (doc as any)?.shifts === "number" ? (doc as any).shifts : clampShift(count), perShiftSalary: typeof (doc as any)?.perShiftSalary === "number" ? (doc as any).perShiftSalary : (emp.salary || 0), totalPay: (doc as any)?.totalPay } }
            sessionStorage.setItem(`shiftData:${projectIdToUse}`, JSON.stringify(currentData))
          } catch { }
        }
        try { await fetchShiftsRealtime(projectIdToUse) } catch { }
        toast.success("Shift Saved")
        return true
      }

      console.debug("[saveEmployeeShift] PUT request", { employeeId: emp._id, projectId: projectIdToUse, date: dateStr, shifts: clampShift(count), perShiftSalary: emp.salary || 0, hasAuth: !!userId })
      let res = await fetch("/api/employee-shifts", {
        method: "PUT",
        headers,
        body: JSON.stringify({ employeeId: emp._id, projectId: projectIdToUse, date: dateStr, shifts: clampShift(count), perShiftSalary: emp.salary || 0 }),
      })
      let doc = await res.json().catch(() => null)
      console.debug("[saveEmployeeShift] PUT response", { ok: res.ok, status: res.status, body: doc })

      // Broaden fallback: if PUT fails and user is admin/superadmin OR unauthorized, retry with POST
      if (!res.ok) {
        const role = typeof window !== "undefined" ? localStorage.getItem("userRole") : null
        const shouldFallback = (res.status === 401 || res.status === 403) || (role === "admin" || role === "superadmin")
        if (shouldFallback) {
          console.warn("[saveEmployeeShift] PUT failed, attempting POST fallback", { status: res.status, role, message: (doc as any)?.message })
          res = await fetch("/api/employee-shifts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ employeeId: emp._id, projectId: projectIdToUse, date: dateStr, shifts: clampShift(count), perShiftSalary: emp.salary || 0 }),
          })
          doc = await res.json().catch(() => null)
          console.debug("[saveEmployeeShift] POST response", { ok: res.ok, status: res.status, body: doc })
        }
      }

      if (!res.ok) {
        toast.error((doc as any)?.message || "Failed to save shift count")
        return false
      }
      // Optimistically update project-scoped shift data
      setShiftData((prev) => {
        const next = { ...prev }
        next[emp._id] = {
          shifts: typeof (doc as any)?.shifts === "number" ? (doc as any).shifts : clampShift(count),
          perShiftSalary: typeof (doc as any)?.perShiftSalary === "number" ? (doc as any).perShiftSalary : (emp.salary || 0),
          totalPay: (doc as any)?.totalPay,
        }
        return next
      })
      // Persist per-project shift data to sessionStorage
      if (typeof window !== 'undefined' && projectIdToUse) {
        try {
          const currentData = { ...shiftData, [emp._id]: { shifts: typeof (doc as any)?.shifts === "number" ? (doc as any).shifts : clampShift(count), perShiftSalary: typeof (doc as any)?.perShiftSalary === "number" ? (doc as any).perShiftSalary : (emp.salary || 0), totalPay: (doc as any)?.totalPay } }
          sessionStorage.setItem(`shiftData:${projectIdToUse}`, JSON.stringify(currentData))
        } catch { }
      }
      // Refresh from backend to ensure consistency
      try { await fetchShiftsRealtime(projectIdToUse) } catch { }
      // Success notification for both select and button flows
      toast.success("Shift Saved")
      return true
    } catch (e) {
      console.error("Failed to save shift", e)
      toast.error("Failed to save shift count")
      return false
    }
  }

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Laborer",
    salary: 0,
    workType: "Monthly" as "Daily" | "Monthly" | "Contract",
    status: "Active" as "Active" | "On Leave" | "Inactive",
    joinDate: new Date(),
    endDate: undefined as Date | undefined,
    address: "",
  })

  const roles = [
    "Mason",
    "Carpenter",
    "Electrician",
    "Plumber",
    "Heavy Equipment Operator",
    "Safety Inspector",
    "Laborer",
    "Welder",
    "Painter",
    "Roofer",
    "HVAC Technician",
    "Concrete Worker",
  ]

  useEffect(() => {
    // Load employees; project-scoped shifts are fetched separately via fetchShiftsRealtime
    fetchEmployees()
  }, [])

  useEffect(() => {
    let interval: any
    const init = async () => {
      await fetchAttendanceRealtime()
      interval = setInterval(fetchAttendanceRealtime, 15000)
    }
    init()
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])

  // Fetch project employees when a project is selected
  useEffect(() => {
    if (selectedProject && selectedProject._id) {
      fetchProjectEmployees(selectedProject._id)
    } else {
      setProjectEmployees([])
    }
  }, [selectedProject])

  // Fetch shift data for selected project (from supervisor-employee.tsx)
  useEffect(() => {
    if (selectedProject?._id) {
      fetchShiftsRealtime(selectedProject._id)
    }
  }, [selectedProject?._id])

  // Poll attendance data for selected project (from supervisor-employee.tsx)
  useEffect(() => {
    let interval: any
    const init = async () => {
      if (selectedProject?._id) {
        await fetchAttendanceRealtime(selectedProject._id)
        interval = setInterval(() => fetchAttendanceRealtime(selectedProject._id), 15000)
      }
    }
    init()
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [selectedProject?._id])

  const fetchEmployees = async () => {
    try {
      setLoading(true) // Ensure loading is true at the start
      const response = await fetch("/api/employees", { cache: "no-store" })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const employeesData = await response.json()
      setEmployees(employeesData)
      // Load today's shifts after employees are loaded
      await fetchEmployeeShifts()
      // Initial attendance sync right after employees load
      await fetchAttendanceRealtime()
    } catch (error) {
      console.error("Error fetching employees:", error)
      toast({
        title: "Error",
        description: "Failed to load employees. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch employees for a specific project (from supervisor-employee.tsx)
  const fetchProjectEmployees = async (projectId: string) => {
    if (!projectId) {
      setProjectEmployees([])
      setLoadingProjectEmployees(false)
      setProjectEmployeeError("No project selected")
      return
    }

    try {
      setLoadingProjectEmployees(true)
      setProjectEmployeeError(null)

      // Get user role from localStorage
      const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null
      const isAdmin = role === 'admin' || role === 'superadmin'

      // Admin and superadmin can view employees for any project; supervisors limited to assigned projects
      const url = isAdmin
        ? `/api/projects/${encodeURIComponent(projectId)}/employees?admin=true`
        : `/api/projects/${encodeURIComponent(projectId)}/employees`

      // Fetch employees assigned to this specific project
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      })

      if (!res.ok) {
        const msg = await res.json().catch(() => ({}))
        throw new Error(msg?.message || `Failed to load project employees (HTTP ${res.status})`)
      }

      const data = await res.json()
      console.debug('[fetchProjectEmployees] role:', role, 'isAdmin:', isAdmin, 'projectId:', projectId, 'count:', Array.isArray(data) ? data.length : 0)
      const mapped: Employee[] = (data || []).map((e: any) => ({
        _id: e._id || e.id,
        name: e.name,
        email: e.email,
        phone: e.phone,
        role: e.role,
        position: e.position,
        avatar: e.avatar,
        salary: e.salary,
        workType: e.workType,
        shiftsWorked: e.shiftsWorked,
        joinDate: e.joinDate,
        status: e.status,
        endDate: e.endDate,
        address: e.address,
        projectId: e.projectId, // Legacy field, might be undefined
        assignedProjects: e.assignedProjects || [], // New format
      }))

      setProjectEmployees(mapped)
    } catch (e: any) {
      setProjectEmployeeError(e?.message || "Failed to load project employees")
      console.error("Error fetching project employees:", e)
    } finally {
      setLoadingProjectEmployees(false)
    }
  }

  const openEmployeeDetail = async (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsDetailSheetOpen(true)
    await fetchEmployeePerformance(employee._id)
    await fetchEmployeeProjects(employee._id)
  }

  const closeEmployeeDetail = () => {
    setIsDetailSheetOpen(false)
    setSelectedEmployee(null)
    setEmployeePerformance([])
    setEmployeeProjects([])
  }

  const fetchEmployeePerformance = async (employeeId: string) => {
    setIsLoadingPerformance(true)
    try {
      // Mock performance data - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const mockPerformance = [
        {
          id: "1",
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          type: "Task Completion",
          rating: 4.5,
          feedback: "Excellent work on the foundation project",
          supervisor: "John Smith",
        },
        {
          id: "2",
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          type: "Safety Compliance",
          rating: 5.0,
          feedback: "Perfect safety record this month",
          supervisor: "Jane Doe",
        },
      ]
      setEmployeePerformance(mockPerformance)
    } catch (error) {
      console.error("Error fetching performance:", error)
      toast({
        title: "Error",
        description: "Failed to load performance data",
        variant: "destructive",
      })
    } finally {
      setIsLoadingPerformance(false)
    }
  }

  const fetchEmployeeProjects = async (employeeId: string) => {
    try {
      // Mock projects data - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      const mockProjects = [
        {
          id: "1",
          title: "Office Building Construction",
          status: "In Progress",
          role: "Lead Mason",
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "2",
          title: "Residential Complex Phase 2",
          status: "Completed",
          role: "Mason",
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]
      setEmployeeProjects(mockProjects)
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }

  // Fetch shifts for a specific project (from supervisor-employee.tsx)
  const fetchShiftsRealtime = async (projectId: string) => {
    if (!projectId) return

    try {
      setIsShiftLoading(true)
      const res = await fetch(`/api/employee-shifts?projectId=${encodeURIComponent(projectId)}`, {
        cache: "no-store",
      })

      if (!res.ok) {
        const msg = await res.json().catch(() => ({}))
        throw new Error(msg?.message || `Failed to load shifts (HTTP ${res.status})`)
      }
      const body = await res.json().catch(() => [])
      const map: Record<string, { shifts: number; perShiftSalary: number; totalPay?: number }> = {}
      let externalUpdates = false
      for (const doc of body as any[]) {
        const eid = typeof doc.employeeId === "string" ? doc.employeeId : (doc.employeeId?._id || String(doc.employeeId))
        if (!eid) continue
        const newShiftData = {
          shifts: typeof doc.shifts === "number" ? doc.shifts : 0,
          perShiftSalary: typeof doc.perShiftSalary === "number" ? doc.perShiftSalary : 0,
          totalPay: typeof doc.totalPay === "number" ? doc.totalPay : undefined,
        }
        if (shiftData[eid]?.shifts !== newShiftData.shifts) {
          externalUpdates = true
        }
        map[eid] = newShiftData
      }
      setShiftData(map)
      // Persist per-project shift data to sessionStorage to avoid zeroes on refresh
      if (typeof window !== 'undefined' && projectId) {
        try { sessionStorage.setItem(`shiftData:${projectId}`, JSON.stringify(map)) } catch { }
      }
      if (externalUpdates) {
        toast({ title: "Shifts Updated", description: "Employee shifts updated from backend", duration: 3000 })
      }
    } catch (e: any) {
      console.error("Error fetching shifts:", e)
      toast({
        title: "Error",
        description: e?.message || "Failed to load shift data",
        variant: "destructive",
      })
    } finally {
      setIsShiftLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Required field validations
    if (!formData.name?.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      })
      return
    }

    if (!formData.phone?.trim()) {
      toast({
        title: "Error",
        description: "Phone number is required",
        variant: "destructive",
      })
      return
    }

    // Phone number validation (basic international format)
    const phoneRegex = /^[+]?[\s\-()0-9]*$/
    if (!phoneRegex.test(formData.phone) || formData.phone.replace(/[^0-9]/g, "").length < 8) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive",
      })
      return
    }

    if (!formData.address?.trim()) {
      toast({
        title: "Error",
        description: "Address is required",
        variant: "destructive",
      })
      return
    }

    if (isNaN(formData.salary) || formData.salary < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid salary amount",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const url = editingEmployee ? `/api/employees/${editingEmployee._id}` : "/api/employees"
      const method = editingEmployee ? "PUT" : "POST"
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: editingEmployee ? formData.status : "Active",
          joinDate: formData.joinDate.toISOString(),
          endDate: formData.endDate?.toISOString(),
        }),
      })
      if (response.ok) {
        await fetchEmployees()
        setIsAddDialogOpen(false)
        setEditingEmployee(null)
        resetForm()
        toast({
          title: "Success",
          description: `${formData.name} has been ${editingEmployee ? "updated" : "added"} successfully.`,
        })
      } else {
        let errorMessage = `Failed to ${editingEmployee ? "update" : "create"} employee`
        let details: any = null

        try {
          details = await response.json()
          if (details?.message) {
            errorMessage = details.message
          } else {
            errorMessage += ` (HTTP ${response.status})`
          }
        } catch (e) {
          errorMessage += ` (HTTP ${response.status})`
        }

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })

        console.error("Employee save failed:", {
          status: response.status,
          details,
          formData: { ...formData, password: "*****" }, // Don't log actual password
        })
      }
    } catch (error) {
      console.error("Error saving employee:", error)
      toast({
        title: "Error",
        description: "Failed to save employee. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/employees/${id}`, { method: "DELETE" })
      if (response.ok) {
        setEmployees(employees.filter((e) => e._id !== id))
        if (selectedEmployee?._id === id) {
          closeEmployeeDetail()
        }
        toast({
          title: "Success",
          description: "Employee has been removed successfully.",
        })
      } else {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }))
        toast({
          title: "Error",
          description: errorData?.message || "Failed to delete employee.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting employee:", error)
      toast({
        title: "Error",
        description: "Failed to delete employee. Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "Laborer",
      salary: 0,
      workType: "Monthly",
      status: "Active",
      joinDate: new Date(),
      endDate: undefined,
      address: "",
    })
  }

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      name: employee.name,
      email: employee.email || "",
      phone: employee.phone,
      role: employee.role,
      salary: employee.salary,
      address: employee.address,
      workType: employee.workType,
      status: employee.status,
      joinDate: new Date(employee.joinDate),
      endDate: employee.endDate ? new Date(employee.endDate) : undefined,
    })
    setIsAddDialogOpen(true)
  }

  const filteredEmployees = employees.filter((employee) => {
    const term = searchTerm.toLowerCase()
    return (
      employee.name.toLowerCase().includes(term) ||
      (employee.email || "").toLowerCase().includes(term) ||
      employee.role.toLowerCase().includes(term)
    )
  })

  // Calculate statistics (shift-based)
  const totalEmployees = employees.length
  // Totals should reflect the currently selected project's shiftData
  const totalShiftsToday = Object.values(shiftData).reduce((sum, d) => sum + clampShift(typeof d.shifts === "number" ? d.shifts : 0), 0)
  const totalSalaryToday = Object.values(shiftData).reduce((sum, d) => sum + (clampShift(typeof d.shifts === "number" ? d.shifts : 0) * (typeof d.perShiftSalary === "number" ? d.perShiftSalary : 0)), 0)

  if (loading && employees.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading employees...</p>
        </div>
      </div>
    )
  }

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredEmployees.map((employee) => (
        <Card
          key={employee._id}
          className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
          onClick={() => openEmployeeDetail(employee)}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* <Avatar className="h-12 w-12 hidden">
                  <AvatarImage src={employee.avatar || "/placeholder.svg"} alt={employee.name} />
                  <AvatarFallback>
                    {employee.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar> */}
                <div>
                  <h3 className="font-semibold text-lg">{employee.name}</h3>
                  {employee.workType === "Monthly" && (
                    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                      <div className="text-xs text-muted-foreground">Manage attendance in Project view</div>
                    </div>
                  )}
                  {employee.workType === "Daily" && (
                    <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                      <div className="text-xs text-muted-foreground">Shifts are managed in Project view</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{employee.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <span>
                  {employee.role} {employee.department && `- ${employee.department}`}
                </span>
              </div>
              {employee.supervisor && (
                <div className="flex items-center gap-2 text-sm">
                  <UserCheck className="w-4 h-4 text-muted-foreground" />
                  <span>Supervisor: {employee.supervisor}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <span>Work Type: {employee.workType}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span>
                  {employee.workType === "Daily" ? "Per Shift: " : "Salary: "}
                  {formatINR(employee.salary)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <IndianRupee className="w-4 h-4 text-muted-foreground" />
                <span>Today's Pay: {formatINR(calcTodaysPay(employee))}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Joined: {new Date(employee.joinDate).toLocaleDateString()}</span>
              </div>
            </div>
            {employee.skills && employee.skills.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Skills:</p>
                <div className="flex flex-wrap gap-1">
                  {employee.skills.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {employee.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{employee.skills.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
                onClick={() => openEditDialog(employee)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 hover:text-green-700 border-green-500 hover:bg-green-50 bg-transparent"
                onClick={() => window.open(`https://wa.me/${employee.phone.replace(/[^0-9]/g, "")}`, "_blank")}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => openEmployeeDetail(employee)}>
                <Eye className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {employee.name}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(employee._id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderListView = () => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Work Type</TableHead>
              <TableHead>Per-Shift/Salary</TableHead>
              <TableHead>Project View Only</TableHead>
              <TableHead>Today's Pay</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow
                key={employee._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => openEmployeeDetail(employee)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    {/* <Avatar className="h-10 w-10">
                      <AvatarImage src={employee.avatar || "/placeholder.svg"} alt={employee.name} />
                      <AvatarFallback>
                        {employee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar> */}
                    <div>
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-sm text-muted-foreground">{employee.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{employee.role}</div>
                    {employee.department && <div className="text-sm text-muted-foreground">{employee.department}</div>}
                  </div>
                </TableCell>
                <TableCell>{employee.workType}</TableCell>
                <TableCell>
                  {employee.workType === "Daily" ? "Per Shift: " : ""}
                  {formatINR(employee.salary)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="text-xs text-muted-foreground">Manage attendance and shifts in Project view</div>
                </TableCell>
                <TableCell>{formatINR(calcTodaysPay(employee))}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{employee.phone}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(employee)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700 border-green-500 hover:bg-green-50 bg-transparent"
                      onClick={() => window.open(`https://wa.me/${employee.phone.replace(/[^0-9]/g, "")}`, "_blank")}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEmployeeDetail(employee)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {employee.name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(employee._id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )

  // Render project view: show all projects; when one is selected, show its employees
  const renderProjectView = () => {
    // Debug: render entry and current selection
    if (typeof window !== "undefined") {
      console.debug(
        "[renderProjectView] entry; selectedProject:",
        selectedProject ? { id: (selectedProject as any)?._id, name: (selectedProject as any)?.name || (selectedProject as any)?.title } : null
      )
    }
    // If a project is selected, show that project's employees
    if (selectedProject) {
      const filteredProjectEmployees = projectEmployees.filter((employee) => {
        const term = searchTerm.toLowerCase()
        return (
          employee.name.toLowerCase().includes(term) ||
          (employee.email || "").toLowerCase().includes(term) ||
          (employee.role || "").toLowerCase().includes(term)
        )
      })

      // Debug: filtered employees count and search term
      if (typeof window !== "undefined") {
        console.debug(
          "[renderProjectView] filteredProjectEmployees",
          { count: filteredProjectEmployees.length, searchTerm }
        )
      }

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              Project: {selectedProject?.name || selectedProject?.title || "Selected Project"}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (typeof window !== "undefined") console.debug("[renderProjectView] Back to Projects clicked")
                  setSelectedProject(null)
                }}
              >
                Back to Projects
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if ((selectedProject as any)?._id) {
                    if (typeof window !== "undefined") {
                      console.debug("[renderProjectView] Refresh project employees", {
                        projectId: (selectedProject as any)?._id,
                        name: (selectedProject as any)?.name || (selectedProject as any)?.title,
                      })
                    }
                    const pid = (selectedProject as any)._id
                    fetchProjectEmployees(pid)
                    // Sync shifts and attendance for the selected project
                    fetchShiftsRealtime(pid)
                    fetchAttendanceRealtime(pid)
                  } else {
                    if (typeof window !== "undefined") {
                      console.warn("[renderProjectView] Refresh blocked: missing selectedProject._id", selectedProject)
                    }
                  }
                }}
                className="inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </Button>
            </div>
          </div>

          {loadingProjectEmployees ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : projectEmployeeError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{projectEmployeeError}</AlertDescription>
            </Alert>
          ) : filteredProjectEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No employees found for this project</h3>
              <p className="text-muted-foreground">Try refreshing or choose another project.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjectEmployees.map((employee) => (
                <Card
                  key={employee._id}
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                  onClick={() => openEmployeeDetail(employee)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {/* <Avatar className="h-10 w-10">
                          <AvatarImage src={employee.avatar || "/placeholder.svg"} alt={employee.name} />
                          <AvatarFallback>
                            {employee.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar> */}
                        <div>
                          <div className="text-lg font-semibold font-medium">{employee.name}</div>
                          <div className="text-md text-muted-foreground">
                            {(employee.role || "").trim() || "Employee"} • {employee.workType}
                          </div>
                        </div>
                      </div>
                    </div>

                    {employee.workType === "Daily" && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Today's Pay</div>
                          <div className="font-semibold">₹{calcTodaysPay(employee).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Per-Shift/Salary</div>
                          <div className="font-semibold">₹{(employee.salary || 0).toLocaleString()}</div>
                        </div>
                      </div>
                    )}

                    {employee.phone && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" /> {employee.phone}
                      </div>
                    )}

                    {/* Shift & Attendance Controls */}
                    <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                      {/* Daily workers: Shift management */}
                      {employee.workType === "Daily" && (
                        <div className="border rounded-md p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium flex items-center gap-2">
                              <Clock className="w-4 h-4" /> Shifts Today
                            </div>
                            <div className="flex items-center gap-2">
                              <Select
                                value={String(
                                  typeof shiftData[employee._id]?.shifts === "number"
                                    ? shiftData[employee._id]!.shifts
                                    : 0
                                )}
                                onValueChange={async (val) => {
                                  const next = Number(val)
                                  console.debug("[ProjectView] Select shift count", {
                                    employeeId: employee._id,
                                    projectId: (selectedProject as any)?._id || null,
                                    to: next,
                                  })
                                  // Update project-scoped local UI state immediately
                                  setShiftData((prev) => {
                                    const perShift =
                                      typeof prev[employee._id]?.perShiftSalary === "number"
                                        ? prev[employee._id]!.perShiftSalary!
                                        : (employee.salary || 0)
                                    return {
                                      ...prev,
                                      [employee._id]: {
                                        shifts: next,
                                        perShiftSalary: perShift,
                                        totalPay: perShift * next,
                                      },
                                    }
                                  })

                                  // Attempt backend save on selection
                                  const ok = await saveEmployeeShift(employee, next)
                                  if (!ok) {
                                    toast.error("Shift Save Failed")
                                    console.warn("[ProjectView] Shift save failed after select", {
                                      employeeId: employee._id,
                                      projectId: (selectedProject as any)?._id || null,
                                      to: next,
                                    })
                                  } else {
                                    toast.success("Shift Saved")
                                    console.debug("[ProjectView] Shift saved after select", {
                                      employeeId: employee._id,
                                      projectId: (selectedProject as any)?._id || null,
                                      to: next,
                                    })
                                  }
                                }}
                              >
                                <SelectTrigger className="w-20 h-8">
                                  <SelectValue placeholder="0" />
                                </SelectTrigger>
                                <SelectContent align="start">
                                  <SelectItem value="0">0</SelectItem>
                                  <SelectItem value="0.5">0.5</SelectItem>
                                  <SelectItem value="1">1</SelectItem>
                                  <SelectItem value="1.5">1.5</SelectItem>
                                  <SelectItem value="2">2</SelectItem>
                                  <SelectItem value="2.5">2.5</SelectItem>
                                  <SelectItem value="3">3</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {/* <div className="mt-2 flex items-center justify-between text-xs">
                            <div className="text-muted-foreground">Per-Shift Rate</div>
                            <div className="font-medium">₹{(
                              typeof shiftData[employee._id]?.perShiftSalary === "number"
                                ? shiftData[employee._id]!.perShiftSalary!
                                : (employee.salary || 0)
                            ).toLocaleString()}</div>
                          </div> */}
                          {/* <div className="mt-1 flex items-center justify-between text-xs">
                            <div className="text-muted-foreground">Calculated Pay</div>
                            <div className="font-semibold">₹{(
                              (typeof shiftData[employee._id]?.shifts === "number" ? shiftData[employee._id]!.shifts : getShiftCount(employee._id)) *
                              (typeof shiftData[employee._id]?.perShiftSalary === "number" ? shiftData[employee._id]!.perShiftSalary! : (employee.salary || 0))
                            ).toLocaleString()}</div>
                          </div> */}

                        </div>
                      )}

                      {/* Monthly workers: Attendance management */}
                      {employee.workType === "Monthly" && (
                        <div className="border rounded-md p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium flex items-center gap-2">
                              <CalendarDays className="w-4 h-4" /> Attendance
                            </div>
                            <Select
                              value={String(
                                (attendanceData[`${(selectedProject as any)?._id || ""}_${employee._id}`]?.status || employee.attendance?.status || "")
                              ) || ""}
                              onValueChange={async (val) => {
                                const status = (val as any) || null
                                if (!status) return
                                const pid = (selectedProject as any)?._id || null
                                console.debug("[ProjectView] Set Attendance", { employeeId: employee._id, projectId: pid, status })
                                const ok = await handleAttendanceChange(employee._id, status)
                                if (!ok) {
                                  toast.error("Failed to update attendance. Please retry.")
                                }
                              }}
                            >
                              <SelectTrigger className="w-40 h-8">
                                <SelectValue placeholder="Set status" />
                              </SelectTrigger>
                              <SelectContent align="start">
                                {attendanceOptions.map((opt) => (
                                  <SelectItem key={`att-${opt.value}`} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {/* <div className="text-xs text-muted-foreground">
                            {attendanceData[`${(selectedProject as any)?._id || ""}_${employee._id}`]?.checkIn ? (
                              <div className="flex justify-between">
                                <span>Check-in</span>
                                <span>{attendanceData[`${(selectedProject as any)?._id || ""}_${employee._id}`]?.checkIn}</span>
                              </div>
                            ) : (
                              <span>No record yet for today</span>
                            )}
                          </div> */}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )
    }

    // Otherwise, show all projects
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">All Projects</h2>
        </div>

        {loadingProjects ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : projectError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{projectError}</AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card key={project._id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{(project as any).name || (project as any).title}</CardTitle>

                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={getProjectStatusVariant(project.status)}>{project.status}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Client:</span>
                      <span>{(project as any).client?.name || (project as any).client || 'N/A'}</span>
                    </div>
                    {/* <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Supervisor:</span>
                      <span>{(project as any).supervisor?.name || (project as any).manager || 'N/A'}</span>
                    </div> */}
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/50 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        console.debug("[renderProjectView] View Employees clicked", {
                          projectId: project._id,
                          name: (project as any)?.name || (project as any)?.title,
                        })
                      }
                      setSelectedProject(project);
                      fetchProjectEmployees(project._id);
                    }}
                  >
                    View Employees
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }



  const projectView = () => (
    <Dialog
      open={isProjectDialogOpen}
      onOpenChange={(open) => {
        setIsProjectDialogOpen(open)
        if (!open) setSelectedProject(null)
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{selectedProject ? "Project Details" : "All Projects"}</DialogTitle>
          {!selectedProject && <DialogDescription>Browse all projects in grid or list view</DialogDescription>}
        </DialogHeader>

        {loadingProjects ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
          </div>
        ) : projectError ? (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4">
              <p className="text-sm text-destructive">{projectError}</p>
            </CardContent>
          </Card>
        ) : selectedProject ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedProject.title || selectedProject.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedProject.client || selectedProject.manager || ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedProject.status || "Planning"}</Badge>
                <Button variant="outline" onClick={() => setSelectedProject(null)}>
                  Back
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Progress value={Math.max(0, Math.min(100, Number(selectedProject.progress ?? 0)))} />
                  <p className="text-xs text-muted-foreground">{Number(selectedProject.progress ?? 0)}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Timeline</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Start:</span> {selectedProject.startDate}
                  </p>
                  <p>
                    <span className="text-muted-foreground">End:</span> {selectedProject.endDate}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Location</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p>{selectedProject.address}</p>
                  <p>
                    {[selectedProject.city, selectedProject.state, selectedProject.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Budget</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>{selectedProject.budget ? selectedProject.budget.toLocaleString() : "—"}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                <Button
                  variant={projectViewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setProjectViewMode("grid")}
                  className="h-8 px-3"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={projectViewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setProjectViewMode("list")}
                  className="h-8 px-3"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              <Badge variant="secondary">{projects.length} Total</Badge>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-8">
                <h4 className="text-sm text-muted-foreground">No projects found</h4>
              </div>
            ) : projectViewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((p: any) => (
                  <Card
                    key={p._id || p.id}
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => setSelectedProject(p)}
                  >
                    <CardHeader className="space-y-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base truncate">{p.title || p.name}</CardTitle>
                        <Badge variant="outline" className="shrink-0">
                          {p.status || "Planning"}
                        </Badge>
                      </div>
                      {typeof p.progress === "number" && (
                        <div className="space-y-1">
                          <Progress value={Math.max(0, Math.min(100, p.progress))} />
                          <p className="text-[11px] text-muted-foreground">{p.progress}%</p>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground space-y-1">
                      {p.client && <p>Client: {p.client}</p>}
                      {p.manager && <p>Manager: {p.manager}</p>}
                      {p.city && (
                        <p>
                          City: {p.city}
                          {p.state ? `, ${p.state}` : ""}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((p: any) => (
                      <TableRow key={p._id || p.id}>
                        <TableCell className="font-medium">{p.title || p.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{p.status || "Planning"}</Badge>
                        </TableCell>
                        <TableCell>{typeof p.progress === "number" ? `${p.progress}%` : "—"}</TableCell>
                        <TableCell>{p.startDate || "—"}</TableCell>
                        <TableCell>{p.endDate || "—"}</TableCell>
                        <TableCell>{p.city || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => setSelectedProject(p)}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base sm:text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl sm:text-2xl font-bold">{totalEmployees}</div>
            <p className="text-sm sm:text-xs text-muted-foreground">Active workforce</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base sm:text-sm font-medium">Total Shifts Today</CardTitle>
            <Clock4 className="h-5 w-5 sm:h-4 sm:w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl sm:text-2xl font-bold text-orange-600">{totalShiftsToday}</div>
            <p className="text-sm sm:text-xs text-muted-foreground">Across daily employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base sm:text-sm font-medium">Today's Salary</CardTitle>
            <IndianRupee className="h-5 w-5 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-green-600">{formatINR(totalSalaryToday)}</div>
            <p className="text-sm sm:text-xs text-muted-foreground">Daily shifts total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base sm:text-sm font-medium">Monthly Salary Total</CardTitle>
            <IndianRupee className="h-5 w-5 sm:h-4 sm:w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-teal-600">
              {formatINR(
                employees.filter((e) => e.workType === "Monthly").reduce((sum, emp) => sum + (emp.salary || 0), 0),
              )}
            </div>
            <p className="text-sm sm:text-xs text-muted-foreground">Monthly staff total</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-3xl sm:text-2xl font-bold">Employees Management</h2>
          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              setLoading(true)
              fetchEmployees()
            }}
            className="ml-2 h-10 w-10 sm:h-9 sm:w-9"
            disabled={loading}
            title="Refresh employees"
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l5-5-5-5v4a10 10 0 00-10 10h4z"
                ></path>
              </svg>
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
          </Button>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
              <DialogDescription>
                {editingEmployee ? "Update employee information" : "Create a new employee record"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Input
                    id="role"
                    list="role-options"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Select or type a role"
                    required
                  />
                  <datalist id="role-options">
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workType">Work Type *</Label>
                  <select
                    id="workType"
                    value={formData.workType}
                    onChange={(e) => setFormData({ ...formData, workType: e.target.value as any })}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Daily">Daily</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">{formData.workType === "Daily" ? "Per Shift Salary *" : "Salary *"}</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={formData.salary === 0 ? "" : formData.salary}
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData({
                        ...formData,
                        salary: value === "" ? 0 : Number.parseInt(value, 10) || 0,
                      })
                    }}
                    placeholder={formData.workType === "Daily" ? "e.g., 1500 (per shift)" : "e.g., 450"}
                    required
                    className="sm:col-span-2 text-center h-9 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Join Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {format(formData.joinDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={formData.joinDate}
                        onSelect={(date) => setFormData({ ...formData, joinDate: date || new Date() })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.endDate && "text-muted-foreground",
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.endDate ? format(formData.endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => setFormData({ ...formData, endDate: date || undefined })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter home address"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setEditingEmployee(null)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingEmployee ? "Update Employee" : "Create Employee"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="secondary" className="self-center">
            {filteredEmployees.length} Total
          </Badge>
        </div>
        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8 px-3"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-8 px-3"
          >
            <List className="w-4 h-4" />
          </Button>

          <Button
            variant={viewMode === "project" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setViewMode("project")
              if (projects.length === 0 && !loadingProjects) {
                fetchAllProjects()
              }
            }}
            className="h-8 px-3"
          >
            Project
          </Button>
        </div>
      </div>

      {/* Employees Display */}
      {viewMode === "grid"
        ? renderGridView()
        : viewMode === "list"
          ? renderListView()
          : viewMode === "project"
            ? renderProjectView()
            : null}
      {filteredEmployees.length === 0 && viewMode !== "project" && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No employees found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "Try adjusting your search or filter criteria" : "Get started by adding your first employee"}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Employee
            </Button>
          )}
        </div>
      )}

      {/* Projects Dialog */}
      {projectView()}

      {/* Employee Detail Sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] sm:max-w-none flex flex-col">
          {selectedEmployee && (
            <div className="flex flex-col h-full">
              <SheetHeader className="shrink-0">
                <div className="flex items-center gap-3">
                  {/* <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={selectedEmployee.avatar || "/placeholder.svg?height=64&width=64"}
                      alt={selectedEmployee.name}
                    />
                    <AvatarFallback className="text-xl">
                      {selectedEmployee.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar> */}
                  <div className="flex-1">
                    <SheetTitle className="text-2xl">{selectedEmployee.name}</SheetTitle>
                    <p className="text-muted-foreground">{selectedEmployee.role}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      openEditDialog(selectedEmployee)
                      setIsDetailSheetOpen(false)
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </SheetHeader>

              <Tabs defaultValue="overview" className="mt-6 flex flex-col h-[calc(100%-100px)]">
                <TabsList className="grid w-full grid-cols-1 mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="flex-1 overflow-y-auto pr-2 space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 gap-4">
                    <Card>
                      <CardContent className="p-4 space-y-1">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium">Work Type</p>
                            <p className="text-sm text-muted-foreground">{selectedEmployee.workType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">{selectedEmployee.role}</p>
                        </div>
                        {selectedEmployee.workType === "Daily" && (
                          <>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                Shifts Today: {getProjectShiftCount(selectedEmployee._id)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <IndianRupee className="w-4 h-4 text-green-600" />
                              <p className="text-sm text-green-700">
                                Today's Pay: {formatINR(calcTodaysPay(selectedEmployee))}
                              </p>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Combined Attendance View for Monthly Employees */}
                  {selectedEmployee.workType === "Monthly" && (
                    <CombinedAttendanceView
                      employeeId={selectedEmployee._id}
                      dailySalary={selectedEmployee.salary}
                      initialMonth={new Date().toISOString().slice(0, 7)}
                      projectId={selectedProject?._id || null}
                    />
                  )}

                  {/* Personal Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Email</p>
                            {selectedEmployee.email ? (
                              <a className="text-sm text-blue-600 underline" href={`mailto:${selectedEmployee.email}`}>
                                {selectedEmployee.email}
                              </a>
                            ) : (
                              <p className="text-sm text-muted-foreground">—</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-muted-foreground" />
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium">Phone</p>
                              {selectedEmployee.phone ? (
                                <a className="text-sm text-blue-600 underline" href={`tel:${selectedEmployee.phone}`}>
                                  {selectedEmployee.phone}
                                </a>
                              ) : (
                                <p className="text-sm text-muted-foreground">—</p>
                              )}
                            </div>
                            {selectedEmployee.phone && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 bg-transparent"
                                onClick={() =>
                                  window.open(
                                    `https://wa.me/${selectedEmployee.phone.replace(/[^0-9]/g, "")}`,
                                    "_blank",
                                  )
                                }
                                title="WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {selectedEmployee.address && (
                          <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Address</p>
                              <p className="text-sm text-muted-foreground">{selectedEmployee.address}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <Briefcase className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Role</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedEmployee.role}
                              {selectedEmployee.department ? ` — ${selectedEmployee.department}` : ""}
                            </p>
                          </div>
                        </div>
                        {selectedEmployee.supervisor && (
                          <div className="flex items-center gap-3">
                            <UserCheck className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Supervisor</p>
                              <p className="text-sm text-muted-foreground">{selectedEmployee.supervisor}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <IndianRupee className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {selectedEmployee.workType === "Daily" ? "Per Shift" : "Salary"}
                            </p>
                            <p className="text-sm text-muted-foreground">{formatINR(selectedEmployee.salary)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Joined</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(selectedEmployee.joinDate), "PPP")}
                            </p>
                          </div>
                        </div>
                        {selectedEmployee.endDate && (
                          <div className="flex items-center gap-3">
                            <CalendarDays className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">End Date</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(selectedEmployee.endDate), "PPP")}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Skills */}
                  {selectedEmployee.skills && selectedEmployee.skills.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Skills</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedEmployee.skills.slice(0, 6).map((skill, index) => (
                            <Badge key={index} variant="outline">
                              {skill}
                            </Badge>
                          ))}
                          {selectedEmployee.skills.length > 6 && (
                            <Badge variant="outline" className="text-xs">
                              +{selectedEmployee.skills.length - 6} more
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

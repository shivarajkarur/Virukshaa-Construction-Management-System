'use client'

import { useCallback, useEffect, useMemo, useState, startTransition } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/common/Avatar"
import { Avatar as UIAvatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Briefcase, Calendar, CalendarPlus, Calculator, CheckCircle, ClipboardList, Clock, Edit, Eye, EyeOff, Filter, Folder, Grid3X3, Hash, HelpCircle, IndianRupee, List, Mail, MapPin, MessageCircle, Phone, Plus, RefreshCw, Search, Trash2, Users, X, XCircle, FileText, Lock, UserMinus, Image, File, Download } from "lucide-react"
import { SupervisorLeaveApprovalModal } from "@/components/management/SupervisorLeaveApprovalModal"
import { AcroFormPasswordField } from "jspdf"

// Types
type AttendanceStatus = "Present" | "Absent" | "On Duty" | null

interface IProject {
  _id: string
  title: string
  description?: string
  status?: string
  createdAt: string
  updatedAt: string
}

interface Supervisor {
  _id: string
  name: string
  email: string
  phone: string
  salary: number // Daily salary
  address: string
  status: "Active" | "Inactive" | "On Leave"
  avatar?: string
  createdAt: string
  updatedAt: string
  username: string
  password: string
  attendance?: {
    present: boolean
    checkIn?: string
    checkOut?: string
    status?: AttendanceStatus
    _attendanceId?: string
    // these optional fields may be populated after merging
    isLeaveApproved?: boolean
    isLeavePaid?: boolean
    leaveReason?: string
  }
}

interface DocumentUrl {
  url: string;
  name?: string;
  type?: string;
}

interface Task {
  _id: string
  title: string
  description: string
  startDate: string
  endDate: string
  status: "Pending" | "In Progress" | "Completed"
  documentUrls: (string | DocumentUrl)[]
  documentType?: string
  createdAt: string
  projectId?: string
  supervisorId?: string
}

interface Employee {
  _id: string
  name: string
  email: string
  position: string
  avatar?: string
}

interface FormData {
  name: string
  email: string
  phone: string
  salary: number
  address: string
  status: "Active" | "On Leave" | "Inactive"
  username: string
  password: string
  confirmPassword: string
  avatar?: File
  avatarPreview?: string
}

interface TaskFormData {
  title: string
  description: string
  startDate: Date | undefined
  endDate: Date | undefined
  projectId: string
  documentType: string
  documentUrls: Array<{
    url: string
    name: string
    size: number
    type?: string
  }>
  filePreviews: Array<{
    name: string
    size: number
    url: string
    type?: string
  }>
}

const initialFormData: FormData = {
  name: "",
  email: "",
  phone: "",
  salary: 0,
  address: "",
  status: "Active",
  username: "",
  password: "",
  confirmPassword: "",
  avatar: undefined,
  avatarPreview: undefined,
}

const initialTaskFormData: TaskFormData = {
  title: "",
  description: "",
  startDate: undefined,
  endDate: undefined,
  projectId: "",
  documentType: "",
  documentUrls: [],
  filePreviews: []
}

const attendanceOptions = [
  { value: "Present" as const, label: "Present", icon: CheckCircle },
  { value: "On Duty" as const, label: "On Duty", icon: Briefcase },
  { value: "Absent" as const, label: "Absent", icon: XCircle },
]

type AttendanceRecord = {
  _id: string
  supervisorId: string
  date: string // YYYY-MM-DD
  status: "Present" | "On Duty" | "Absent"
  checkIn?: string
  checkOut?: string
  isLeaveApproved?: boolean
  isLeavePaid?: boolean
  isPaid?: boolean
  leaveReason?: string
}

// Helper to normalize status from API
function normalizeAttendanceStatus(value: any, presentFlag?: boolean): AttendanceStatus {
  if (typeof value === "string") {
    const v = value.trim().toLowerCase().replace(/[_-]/g, " ")
    if (v === "present" || v === "p") return "Present"
    if (v === "on duty" || v === "onduty" || v === "on duty (paid)" || v === "od") return "On Duty"
    if (v === "absent" || v === "a") return "Absent"
  }
  if (presentFlag === true) return "Present"
  return null
}

function isIsoWithinDay(iso?: string, startIso?: string, endIso?: string): boolean {
  if (!iso || !startIso || !endIso) return false
  const t = Date.parse(iso)
  const s = Date.parse(startIso)
  const e = Date.parse(endIso)
  if (Number.isNaN(t) || Number.isNaN(s) || Number.isNaN(e)) return false
  return t >= s && t <= e
}

// Combined Attendance and Salary View
function CombinedAttendanceView({
  supervisorId,
  dailySalary,
  initialMonth,
}: {
  supervisorId: string
  dailySalary: number
  initialMonth?: string
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
        const [fetchYear, fetchMonthNum] = selectedMonth.split("-").map(Number)
        const startDate = new Date(Date.UTC(fetchYear, fetchMonthNum - 1, 1))
        const endDate = new Date(Date.UTC(fetchYear, fetchMonthNum, 0, 23, 59, 59, 999))
        const res = await fetch(
          `/api/attendance?supervisorId=${supervisorId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        )
        if (!res.ok) throw new Error("Failed to fetch attendance")
        const data: AttendanceRecord[] = await res.json()
        setAttendanceData(data)

        const map: Record<string, AttendanceStatus> = {}
        let present = 0
        let onDuty = 0
        let paid = 0
        let unpaid = 0
        let pending = 0

        const [currentYear, currentMonth] = selectedMonth.split("-").map(Number)
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
        let workingDays = 0

        data.forEach((record) => {
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

    if (supervisorId && selectedMonth) {
      fetchAttendance()
    }
  }, [supervisorId, selectedMonth])

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      return {
        value: d.toISOString().slice(0, 7),
        label: d.toLocaleString("default", { month: "long", year: "numeric" }),
      }
    })
  }, [])

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
          map[key] = { status: isPaidLeave ? "paid" : "unpaid", reason: record.leaveReason }
        } else if (record.isLeaveApproved === undefined) {
          map[key] = { status: "pending", reason: record.leaveReason }
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
                  <SelectItem key={m.value} value={m.value}>
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

export default function SupervisorsPage() {
  // List state
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Add/Edit supervisor
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)

  // Detail sheet
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null)
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false)

  // Tasks
  const [supervisorTasks, setSupervisorTasks] = useState<Task[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [taskFormData, setTaskFormData] = useState<TaskFormData>(initialTaskFormData)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isEditTaskFormOpen, setIsEditTaskFormOpen] = useState(false)

  // Role (for enabling admin-only controls)
  const [userRole, setUserRole] = useState<string | null>(null)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole')
      setUserRole(role)
    }
  }, [])

  // File Preview
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewFileName, setPreviewFileName] = useState('')

  // Track tasks being updated to avoid multiple concurrent updates and disable UI
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<string>>(new Set())

  // Projects/Employees
  const [availableProjects, setAvailableProjects] = useState<IProject[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [isEmployeeAssignOpen, setIsEmployeeAssignOpen] = useState(false)
  const [supervisorEmployees, setSupervisorEmployees] = useState<Employee[]>([])
  const [detailTab, setDetailTab] = useState<'overview' | 'tasks' | 'team'>('overview')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Leave modal state
  const [showLeaveApproval, setShowLeaveApproval] = useState(false)
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("")
  const [leaveReason, setLeaveReason] = useState("")
  const [leaveDates, setLeaveDates] = useState<Date[]>([])
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false)
  const [existingPaidLeaveDays, setExistingPaidLeaveDays] = useState(0)

  // Delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [supervisorToDelete, setSupervisorToDelete] = useState<Supervisor | null>(null)

  // Computed: filtered supervisors
  const filteredSupervisors = useMemo(() => {
    return supervisors.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.email || "").toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "All" || s.status === (statusFilter as Supervisor["status"])
      return matchesSearch && matchesStatus
    })
  }, [supervisors, searchTerm, statusFilter])

  // Fetch assigned employees for a supervisor
  const fetchAssignedEmployees = useCallback(async (supervisorId: string) => {
    try {
      const res = await fetch(`/api/supervisors/${supervisorId}/employees`)
      if (!res.ok) throw new Error('Failed to fetch assigned employees')
      const data: Employee[] = await res.json()
      setSupervisorEmployees(data)
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || 'Failed to load team members')
    }
  }, [])

  // Fetch available (unassigned) employees to assign
  const fetchAvailableEmployees = useCallback(async (supervisorId: string) => {
    try {
      setLoadingEmployees(true)
      const res = await fetch(`/api/employees?availableForSupervisor=${encodeURIComponent(supervisorId)}`)
      if (!res.ok) throw new Error('Failed to fetch available employees')
      const data: Employee[] = await res.json()
      setAvailableEmployees(data)
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || 'Failed to load available employees')
    } finally {
      setLoadingEmployees(false)
    }
  }, [])

  const openEmployeeAssign = useCallback(() => {
    if (!selectedSupervisor) return
    fetchAvailableEmployees(selectedSupervisor._id)
    setIsEmployeeAssignOpen(true)
  }, [selectedSupervisor, fetchAvailableEmployees])

  const handleEmployeeAssign = useCallback(async (employeeId: string) => {
    if (!selectedSupervisor) return
    try {
      const res = await fetch(`/api/supervisors/${selectedSupervisor._id}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
      })
      if (!res.ok) throw new Error('Failed to assign employee')
      toast.success('Employee assigned')
      setIsEmployeeAssignOpen(false)
      // refresh lists
      fetchAssignedEmployees(selectedSupervisor._id)
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || 'Could not assign employee')
    }
  }, [selectedSupervisor, fetchAssignedEmployees])

  const handleEmployeeUnassign = useCallback(async (employeeId: string) => {
    if (!selectedSupervisor) return
    try {
      const res = await fetch(`/api/supervisors/${selectedSupervisor._id}/employees/${employeeId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to unassign employee')
      toast.success('Employee unassigned')
      // refresh list
      fetchAssignedEmployees(selectedSupervisor._id)
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || 'Could not unassign employee')
    }
  }, [selectedSupervisor, fetchAssignedEmployees])

  // When opening detail panel or switching to Team tab, load employees
  useEffect(() => {
    if (selectedSupervisor && isDetailPanelOpen && detailTab === 'team') {
      fetchAssignedEmployees(selectedSupervisor._id)
    }
  }, [selectedSupervisor, isDetailPanelOpen, detailTab, fetchAssignedEmployees])

  // Prefetch available employees when a supervisor is selected (to speed up assign flow)
  useEffect(() => {
    if (selectedSupervisor) {
      fetchAvailableEmployees(selectedSupervisor._id)
    }
  }, [selectedSupervisor, fetchAvailableEmployees])

  // Stats
  const totalSupervisors = supervisors.length
  const presentToday = supervisors.filter((s) => s.attendance?.status === "Present").length
  const onDutyToday = supervisors.filter((s) => s.attendance?.status === "On Duty").length
  const absentToday = supervisors.filter((s) => s.attendance?.status === "Absent").length
  const noStatusToday = supervisors.filter((s) => !s.attendance?.status).length

  // Helpers
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "Inactive":
        return "bg-red-100 text-red-800"
      case "On Leave":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Fetchers
  const fetchProjects = useCallback(async () => {
    setIsLoadingProjects(true)
    try {
      const res = await fetch("/api/projects")
      const data: IProject[] = await res.json()
      setAvailableProjects(Array.isArray(data) ? data : [])
    } catch {
      setAvailableProjects([])
    } finally {
      setIsLoadingProjects(false)
    }
  }, [])

  // const fetchAvailableEmployees = useCallback(async () => {
  //   setLoadingEmployees(true)
  //   try {
  //     const res = await fetch("/api/employees")
  //     const data: Employee[] = await res.json()
  //     setAvailableEmployees(Array.isArray(data) ? data : [])
  //   } catch {
  //     toast.error("Failed to load employees")
  //   } finally {
  //     setLoadingEmployees(false)
  //   }
  // }, [])

  const fetchSupervisorTasks = useCallback(async (supervisorId: string) => {
    setIsLoadingTasks(true)
    try {
      const res = await fetch(`/api/tasks?supervisorId=${supervisorId}`)
      if (!res.ok) throw new Error("Failed to fetch tasks")
      const data: Task[] = await res.json()
      setSupervisorTasks(data)
    } catch (e) {
      console.error(e)
      toast.error("Failed to load tasks")
    } finally {
      setIsLoadingTasks(false)
    }
  }, [])

  // Update task status (admin only UI will call this; API should enforce auth/authorization)
  const updateTaskStatus = useCallback(async (taskId: string, status: Task["status"]) => {
    try {
      // mark as updating
      setUpdatingTaskIds(prev => {
        const next = new Set(prev)
        next.add(taskId)
        return next
      })
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) {
        throw new Error('Failed to update task status')
      }
      // apply update after server confirms
      startTransition(() => {
        setSupervisorTasks((prev) => prev.map(t => t._id === taskId ? { ...t, status } : t))
      })
      toast.success('Task status updated')
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || 'Could not update task status')
      // fallback: refetch tasks for selected supervisor
      if (selectedSupervisor?._id) {
        fetchSupervisorTasks(selectedSupervisor._id)
      }
    } finally {
      setUpdatingTaskIds(prev => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
    }
  }, [fetchSupervisorTasks, selectedSupervisor])

  const fetchSupervisorPaidLeaveDays = useCallback(async (supervisorId: string, month: string): Promise<number> => {
    try {
      const [year, monthNum] = month.split("-").map(Number)
      const startDate = new Date(Date.UTC(year, monthNum - 1, 1))
      const endDate = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999))
      const res = await fetch(
        `/api/attendance?supervisorId=${supervisorId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )
      if (!res.ok) throw new Error("Failed to fetch attendance data")
      const data: AttendanceRecord[] = await res.json()
      let paidLeaveDays = 0
      data.forEach((r) => {
        if (r.status === "Absent" && r.isLeaveApproved === true && (r.isLeavePaid === true || r.isPaid === true)) {
          paidLeaveDays++
        }
      })
      return paidLeaveDays
    } catch (e) {
      console.error(e)
      return 0
    }
  }, [])

  // FIX: robust attendance fetch with fallback to per-supervisor API if batch is unsupported.
  const fetchSupervisors = useCallback(async () => {
    setLoading(true)
    try {
      // 1) Fetch supervisors
      const res = await fetch("/api/supervisors", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to fetch supervisors")
      const list: Supervisor[] = await res.json()

      // 2) Build today's LOCAL date (YYYY-MM-DD) and local day ISO range to avoid timezone mismatches
      const now = new Date()
      const y = now.getFullYear()
      const m = now.getMonth()
      const d = now.getDate()
      const localDateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}`
      // Local day boundaries converted to UTC ISO
      const startOfDay = new Date(y, m, d, 0, 0, 0, 0)
      const endOfDay = new Date(y, m, d, 23, 59, 59, 999)
      const startOfDayIso = startOfDay.toISOString()
      const endOfDayIso = endOfDay.toISOString()

      // 3) Try batch attendance fetch (by date range); fall back to per-supervisor fetch if needed
      let attendanceRecords: AttendanceRecord[] = []
      const supervisorIds = list.map((s) => s._id).join(",")

      try {
        const attRes = await fetch(
          `/api/attendance?startDate=${encodeURIComponent(startOfDayIso)}&endDate=${encodeURIComponent(endOfDayIso)}&supervisorIds=${encodeURIComponent(
            supervisorIds
          )}`,
          { cache: "no-store", headers: { Accept: "application/json" } }
        )
        if (attRes.ok) {
          const data = await attRes.json()
          // Normalize possible shapes: array or { data: [...] }
          const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
          // If the API returns multiple days, keep only today's (accept exact date or timestamp within the local day)
          attendanceRecords = arr.filter((r: any) => {
            const d = (r?.date || "") as string
            const d2 = (r?.attendanceDate || r?.day || "") as string
            if (d === localDateStr || d.startsWith(localDateStr)) return true
            if (d2 === localDateStr || (typeof d2 === 'string' && d2.startsWith(localDateStr))) return true
            return (
              isIsoWithinDay(r?.checkIn, startOfDayIso, endOfDayIso) ||
              isIsoWithinDay(r?.checkOut, startOfDayIso, endOfDayIso) ||
              isIsoWithinDay(r?.updatedAt, startOfDayIso, endOfDayIso) ||
              isIsoWithinDay(r?.createdAt, startOfDayIso, endOfDayIso)
            )
          })
        } else {
          // Force fallback
          throw new Error("Batch attendance not supported")
        }
      } catch {
        // Per-supervisor fallback
        const results = await Promise.all(
          list.map(async (s) => {
            try {
              const r = await fetch(
                `/api/attendance?startDate=${encodeURIComponent(startOfDayIso)}&endDate=${encodeURIComponent(endOfDayIso)}&supervisorId=${s._id}`,
                { cache: "no-store", headers: { Accept: "application/json" } }
              )
              if (!r.ok) return null
              const json = await r.json()
              // Normalize shapes: array, { data: [...] }, or single object
              const arr = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [json]
              // Find today's record for this supervisor (match local date or timestamps within local day)
              const match = arr.find((rec: any) => {
                const recSupId = (rec?.supervisorId && typeof rec.supervisorId === 'object') ? rec.supervisorId._id : rec?.supervisorId
                const supOk = (recSupId || rec?.supervisor?._id || rec?.supervisor) == s._id
                if (!supOk) return false
                const d = (rec?.date || "") as string
                const d2 = (rec?.attendanceDate || rec?.day || "") as string
                if (d === localDateStr || (typeof d === 'string' && d.startsWith(localDateStr))) return true
                if (d2 === localDateStr || (typeof d2 === 'string' && d2.startsWith(localDateStr))) return true
                return (
                  isIsoWithinDay(rec?.checkIn, startOfDayIso, endOfDayIso) ||
                  isIsoWithinDay(rec?.checkOut, startOfDayIso, endOfDayIso) ||
                  isIsoWithinDay(rec?.updatedAt, startOfDayIso, endOfDayIso) ||
                  isIsoWithinDay(rec?.createdAt, startOfDayIso, endOfDayIso)
                )
              })
              if (match) return match
              // Fallback: pick most recent record within the local day for this supervisor
              const candidates = arr.filter((rec: any) => {
                const recSupId = (rec?.supervisorId && typeof rec.supervisorId === 'object') ? rec.supervisorId._id : rec?.supervisorId
                const supOk = (recSupId || rec?.supervisor?._id || rec?.supervisor) == s._id
                if (!supOk) return false
                return (
                  isIsoWithinDay(rec?.checkIn, startOfDayIso, endOfDayIso) ||
                  isIsoWithinDay(rec?.checkOut, startOfDayIso, endOfDayIso) ||
                  isIsoWithinDay(rec?.updatedAt, startOfDayIso, endOfDayIso) ||
                  isIsoWithinDay(rec?.createdAt, startOfDayIso, endOfDayIso)
                )
              })
              if (candidates.length > 0) {
                candidates.sort((a: any, b: any) => Date.parse(b?.updatedAt || b?.createdAt || b?.checkIn || '') - Date.parse(a?.updatedAt || a?.createdAt || a?.checkIn || ''))
                return candidates[0]
              }
              return null
            } catch {
              return null
            }
          })
        )
        attendanceRecords = results.filter(Boolean) as AttendanceRecord[]
        // If still empty, try legacy per-supervisor API shape with ?date=YYYY-MM-DD
        if (attendanceRecords.length === 0) {
          const legacyResults = await Promise.all(
            list.map(async (s) => {
              try {
                const r = await fetch(`/api/attendance?date=${localDateStr}&supervisorId=${s._id}`, {
                  cache: "no-store",
                  headers: { Accept: "application/json" },
                })
                if (!r.ok) return null
                const json = await r.json()
                const arr = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [json]
                // prefer exact date match, fallback to timestamps within the day
                const match = arr.find((rec: any) => {
                  const d = (rec?.date || "") as string
                  const d2 = (rec?.attendanceDate || rec?.day || "") as string
                  if (d === localDateStr || d.startsWith(localDateStr)) return true
                  if (d2 === localDateStr || (typeof d2 === 'string' && d2.startsWith(localDateStr))) return true
                  return (
                    isIsoWithinDay(rec?.checkIn, startOfDayIso, endOfDayIso) ||
                    isIsoWithinDay(rec?.checkOut, startOfDayIso, endOfDayIso) ||
                    isIsoWithinDay(rec?.updatedAt, startOfDayIso, endOfDayIso) ||
                    isIsoWithinDay(rec?.createdAt, startOfDayIso, endOfDayIso)
                  )
                })
                return match || null
              } catch {
                return null
              }
            })
          )
          attendanceRecords = legacyResults.filter(Boolean) as AttendanceRecord[]
        }
        // If still empty, try fetching all by date only and filter locally
        if (attendanceRecords.length === 0) {
          try {
            const r = await fetch(`/api/attendance?date=${localDateStr}`, { cache: "no-store", headers: { Accept: "application/json" } })
            if (r.ok) {
              const json = await r.json()
              const arr = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
              const byId = new Map<string, any>()
              arr.forEach((rec: any) => {
                const supId = ((rec?.supervisorId && typeof rec.supervisorId === 'object') ? rec.supervisorId._id : rec?.supervisorId) || rec?.supervisor?._id || rec?.supervisor || rec?.employeeId || rec?.supervisor_id || rec?.staffId
                if (!supId) return
                const d = (rec?.date || "") as string
                if (d === localDateStr || (typeof d === 'string' && d.startsWith(localDateStr))) {
                  byId.set(String(supId), rec)
                }
              })
              attendanceRecords = list
                .map((s) => byId.get(String(s._id)) as AttendanceRecord | undefined)
                .filter(Boolean) as AttendanceRecord[]
            }
          } catch {
            // ignore
          }
        }
      }

      // 4) Merge supervisors with attendance map (normalize supervisor id field)
      const attMap = new Map<string, AttendanceRecord>()
      attendanceRecords.forEach((rec: any) => {
        const supId = ((rec?.supervisorId && typeof rec.supervisorId === 'object') ? rec.supervisorId._id : rec?.supervisorId) || rec?.supervisor?._id || rec?.supervisor || rec?.employeeId || rec?.supervisor_id || rec?.staffId
        if (supId) attMap.set(String(supId), rec as AttendanceRecord)
      })

      setSupervisors((prev) => {
        const prevById = new Map(prev.map((p) => [p._id, p]))
        return list.map((supervisor) => {
          const attendance = attMap.get(supervisor._id)
          if (attendance) {
            const statusNorm = normalizeAttendanceStatus((attendance as any).status, (attendance as any).present)
            return {
              ...supervisor,
              attendance: {
                present: statusNorm === "Present",
                checkIn: attendance.checkIn || "",
                checkOut: attendance.checkOut || "",
                status: statusNorm,
                _attendanceId: attendance._id,
                isLeaveApproved: attendance.isLeaveApproved,
                isLeavePaid: attendance.isLeavePaid ?? (attendance as any).isPaid,
                leaveReason: attendance.leaveReason || "",
              },
            }
          }
          // No server record for today: preserve any existing client-side attendance (optimistic) if present
          const existing = prevById.get(supervisor._id)
          if (existing?.attendance && existing.attendance.status) {
            return {
              ...supervisor,
              attendance: existing.attendance,
            }
          }
          return {
            ...supervisor,
            attendance: {
              present: false,
              status: null as AttendanceStatus,
              _attendanceId: undefined,
              checkIn: "",
              checkOut: "",
              isLeaveApproved: undefined,
              isLeavePaid: undefined,
              leaveReason: "",
            },
          }
        })
      })
      // minimal debug to help diagnose if still empty
      if (process.env.NODE_ENV !== 'production') {
        const withAttendanceCount = list.filter((s) => attMap.has(s._id)).length
        console.debug('[supervisors] merged with attendance:', {
          total: list.length,
          withAttendance: withAttendanceCount,
        })
      }
    } catch (e) {
      console.error("Error in fetchSupervisors:", e)
      toast.error(`Failed to load supervisors: ${e instanceof Error ? e.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSupervisors()
    fetchProjects()
  }, [fetchProjects, fetchSupervisors])

  // Attendance updates
  const updateAttendance = useCallback(
    async (
      supervisorId: string,
      status: AttendanceStatus,
      dateStr: string,
      leaveReason: string | null = null,
      isPaid = true
    ) => {
      const supervisor = supervisors.find((x) => x._id === supervisorId)
      if (!supervisor) {
        toast.error("Supervisor not found")
        return false
      }
      const loadingToast = toast.loading(`Updating attendance for ${supervisor.name}...`)

      try {
        const now = new Date()
        const timestamp = now.toISOString()

        const body: any = {
          supervisorId,
          status,
          date: dateStr,
          updatedAt: timestamp,
        }

        if (status === "Absent") {
          body.leaveReason = leaveReason || "Not specified"
          body.isLeavePaid = isPaid
          body.isLeaveApproved = true
          body.checkOut = timestamp
        } else if (status === "Present") {
          body.checkIn = timestamp
          body.checkOut = null
          body.leaveReason = ""
          body.isLeaveApproved = false
          body.isLeavePaid = false
        } else if (status === "On Duty") {
          body.checkIn = timestamp
          body.checkOut = null
          body.leaveReason = ""
          body.isLeaveApproved = false
          body.isLeavePaid = false
        }

        // Immediate optimistic UI update (before API) for snappier feedback
        setSupervisors((prev) =>
          prev.map((s) => {
            if (s._id !== supervisorId) return s
            const normalizedStatus = normalizeAttendanceStatus(status, status === "Present")
            return {
              ...s,
              attendance: {
                present: normalizedStatus === "Present",
                status: normalizedStatus,
                _attendanceId: s.attendance?._attendanceId,
                checkIn: s.attendance?.checkIn || "",
                checkOut: s.attendance?.checkOut || "",
                isLeaveApproved: s.attendance?.isLeaveApproved,
                isLeavePaid: s.attendance?.isLeavePaid,
                leaveReason: s.attendance?.leaveReason || "",
              },
            }
          })
        )

        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          body: JSON.stringify(body),
          cache: "no-store",
        })

        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(errorText || "Failed to update attendance")
        }

        // Safely parse JSON; some APIs may return 204/empty body
        let saved: AttendanceRecord
        try {
          const text = await res.text()
          saved = text ? (JSON.parse(text) as AttendanceRecord) : ({
            _id: supervisor.attendance?._attendanceId || "",
            supervisorId,
            date: dateStr,
            status: (status || "Absent") as any,
          } as AttendanceRecord)
        } catch {
          saved = ({
            _id: supervisor.attendance?._attendanceId || "",
            supervisorId,
            date: dateStr,
            status: (status || "Absent") as any,
          } as AttendanceRecord)
        }

        // Dismiss loading toast and show success notification
        toast.dismiss(loadingToast)
        toast.success(`Attendance updated for ${supervisor.name}`)

        // Optimistic UI update so the selection shows immediately
        setSupervisors((prev) =>
          prev.map((s) => {
            if (s._id !== supervisorId) return s
            const normalizedStatus = normalizeAttendanceStatus(status, status === "Present")
            return {
              ...s,
              attendance: {
                present: normalizedStatus === "Present",
                status: normalizedStatus,
                _attendanceId: saved?._id || s.attendance?._attendanceId,
                checkIn: saved?.checkIn || s.attendance?.checkIn || "",
                checkOut: saved?.checkOut || s.attendance?.checkOut || "",
                isLeaveApproved: saved?.isLeaveApproved ?? s.attendance?.isLeaveApproved,
                isLeavePaid: (saved as any)?.isLeavePaid ?? (saved as any)?.isPaid ?? s.attendance?.isLeavePaid,
                leaveReason: saved?.leaveReason ?? s.attendance?.leaveReason ?? "",
              },
            }
          })
        )

        // Also refresh from database to ensure UI shows current backend state
        await fetchSupervisors()
        return true
      } catch (e: any) {
        console.error("Error updating attendance:", e)
        toast.dismiss(loadingToast)
        toast.error(e?.message || "Failed to update attendance")
        // Re-fetch to ensure UI is in sync with server
        await fetchSupervisors()
        return false
      }
    },
    [supervisors, fetchSupervisors] // include all dependencies so the callback doesn't capture stale values [^3]
  )

  const handleAttendanceChange = useCallback(
    async (supervisorId: string, status: AttendanceStatus) => {
      // Use LOCAL date string to match fetchSupervisors local-day logic
      const now = new Date()
      const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}`
      const sup = supervisors.find((s) => s._id === supervisorId)
      if (!sup) return

      if (status === "Present" || status === "On Duty") {
        await updateAttendance(supervisorId, status, localToday)
        return
      }

      // If Absent, open approval modal with today's date pre-filled
      const currentMonth = new Date().toISOString().slice(0, 7)
      const existingPaid = await fetchSupervisorPaidLeaveDays(supervisorId, currentMonth)
      setSelectedSupervisorId(supervisorId)
      setExistingPaidLeaveDays(existingPaid)
      setLeaveReason("")
      setLeaveDates([new Date()])
      setShowLeaveApproval(true)
    },
    [fetchSupervisorPaidLeaveDays, supervisors, updateAttendance]
  )

  const handleApproveLeave = useCallback(
    async (reason: string, isPaid: boolean, dates: Date[]) => {
      if (!selectedSupervisorId) return false
      setIsSubmittingLeave(true)
      try {
        const results = await Promise.all(
          dates.map((d) => updateAttendance(selectedSupervisorId, "Absent", d.toISOString().split("T")[0], reason, isPaid))
        )
        const ok = results.every(Boolean)
        if (ok) {
          toast.success(
            `Leave ${isPaid ? "approved (paid)" : "approved (unpaid)"} for ${dates.length} day${dates.length > 1 ? "s" : ""}`
          )
          await fetchSupervisors()
        } else {
          toast.error("Some leave days failed to update")
        }
        return ok
      } finally {
        setIsSubmittingLeave(false)
        setShowLeaveApproval(false)
        setLeaveReason("")
        setLeaveDates([])
        setSelectedSupervisorId("")
        setExistingPaidLeaveDays(0)
      }
    },
    [fetchSupervisors, selectedSupervisorId, updateAttendance]
  )

  // Task handlers
  const openTaskForm = useCallback(() => {
    setTaskFormData(initialTaskFormData)
    setIsTaskFormOpen(true)
  }, [])

  const handleTaskFormChange = useCallback<React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>>((e) => {
    const { name, value } = e.target
    setTaskFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleProjectChange = useCallback((value: string) => {
    setTaskFormData((prev) => ({ ...prev, projectId: value }))
  }, [])

  const handleDocumentTypeChange = useCallback((value: string) => {
    setTaskFormData((prev) => ({ ...prev, documentType: value, file: undefined, documentUrl: "" }))
  }, [])

  const handleFileChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const uploadPromises = Array.from(files).map(async file => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'task')

      const loadingToast = toast.loading(`Uploading ${file.name}...`)

      try {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!uploadRes.ok) {
          const error = await uploadRes.json()
          throw new Error(`Failed to upload ${file.name}: ${error.error || 'Unknown error'}`)
        }

        const { fileUrl, fileSize } = await uploadRes.json()
        toast.dismiss(loadingToast)
        toast.success(`${file.name} uploaded successfully`)

        return {
          name: file.name,
          size: fileSize,
          url: fileUrl,
          type: file.type
        }
      } catch (error) {
        toast.dismiss(loadingToast)
        toast.error(error instanceof Error ? error.message : 'Upload failed')
        return null
      }
    })

    const uploadedFiles = (await Promise.all(uploadPromises)).filter(Boolean)

    setTaskFormData(prev => ({
      ...prev,
      documentUrls: [...prev.documentUrls, ...uploadedFiles.map(f => ({
        name: f.name,
        size: f.size,
        url: f.url,
        type: f.type
      }))],
      filePreviews: [...prev.filePreviews, ...uploadedFiles]
    }))
  }, [])

  const handleTaskDateChange = useCallback((date: Date | undefined, field: "startDate" | "endDate") => {
    setTaskFormData((prev) => ({ ...prev, [field]: date }))
  }, [])

  const handleTaskSubmit = useCallback<React.FormEventHandler>(
    async (e) => {
      e.preventDefault()

      if (!selectedSupervisor) {
        toast.error('Please select a supervisor first')
        return
      }

      if (!taskFormData.title || !taskFormData.startDate || !taskFormData.endDate || !taskFormData.projectId) {
        toast.error('Please fill in all required fields')
        return
      }

      const loadingToast = toast.loading('Creating task...')

      try {
        // Files are already uploaded during handleFileChange
        const documentUrls = taskFormData.documentUrls

        // Create task with document URLs
        const payload = {
          title: taskFormData.title,
          description: taskFormData.description,
          startDate: taskFormData.startDate.toISOString(),
          endDate: taskFormData.endDate.toISOString(),
          projectId: taskFormData.projectId,
          documentType: taskFormData.documentType,
          documentUrls: documentUrls.map(url => {
            if (typeof url === 'string') {
              return { url }
            }
            return url
          }),
          supervisorId: selectedSupervisor._id
        }

        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          const errText = await response.text().catch(() => '')
          throw new Error(errText || 'Failed to create task')
        }

        toast.dismiss(loadingToast)
        toast.success('Task created successfully')
        await fetchSupervisorTasks(selectedSupervisor._id)
        setTaskFormData(initialTaskFormData)
        setIsTaskFormOpen(false)
      } catch (error: any) {
        console.error('Error creating task:', error)
        toast.dismiss(loadingToast)
        toast.error(`Failed to create task${error?.message ? `: ${error.message}` : ''}`)
      }
    },
    [fetchSupervisorTasks, selectedSupervisor, taskFormData]
  )

  const openEditTaskForm = useCallback((task: Task) => {
    setEditingTask(task)
    setTaskFormData({
      title: task.title,
      description: task.description,
      startDate: new Date(task.startDate),
      endDate: new Date(task.endDate),
      projectId: task.projectId || "",
      documentType: task.documentType || "",
      documentUrls: task.documentUrls || [],
      files: [],
      filePreviews: task.documentUrls?.map((doc, index) => {
        if (typeof doc === 'string') {
          return {
            name: `Document ${index + 1}`,
            size: 0,
            url: doc
          }
        }
        return {
          name: doc.name || `Document ${index + 1}`,
          size: 0,
          url: doc.url
        }
      }) || []
    })
    setIsEditTaskFormOpen(true)
  }, [])

  const closeEditTaskForm = useCallback(() => {
    setIsEditTaskFormOpen(false)
    setEditingTask(null)
    setTaskFormData(initialTaskFormData)
  }, [])

  const handleTaskEditSubmit = useCallback<React.FormEventHandler>(
    async (e) => {
      e.preventDefault()
      if (!editingTask?._id) {
        toast.error('No task selected for editing')
        return
      }
      if (!taskFormData.title || !taskFormData.startDate || !taskFormData.endDate || !taskFormData.projectId) {
        toast.error('Please fill in all required fields')
        return
      }

      const loadingToast = toast.loading('Updating task...')

      try {
        // Files are already uploaded during handleFileChange
        const documentUrls = taskFormData.documentUrls

        const res = await fetch(`/api/tasks/${editingTask._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: taskFormData.title,
            description: taskFormData.description,
            startDate: taskFormData.startDate.toISOString(),
            endDate: taskFormData.endDate.toISOString(),
            projectId: taskFormData.projectId,
            documentType: taskFormData.documentType,
            documentUrls
          })
        })

        if (!res.ok) throw new Error('Failed to update task')
        
        const updated: Task = await res.json()
        setSupervisorTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)))
        
        toast.dismiss(loadingToast)
        toast.success('Task updated successfully')
        
        setIsEditTaskFormOpen(false)
        setEditingTask(null)
        setTaskFormData(initialTaskFormData)
        
        if (selectedSupervisor?._id) {
          await fetchSupervisorTasks(selectedSupervisor._id)
        }
      } catch (error: any) {
        console.error('Error updating task:', error)
        toast.dismiss(loadingToast)
        toast.error(`Failed to update task${error?.message ? `: ${error.message}` : ''}`)
      }
    },
    [editingTask, fetchSupervisorTasks, selectedSupervisor, taskFormData]
  )

  const handleTaskDelete = useCallback(async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete task")
      setSupervisorTasks((prev) => prev.filter((t) => t._id !== taskId))
      toast.success("Task deleted successfully")
    } catch (e) {
      console.error(e)
      toast.error("Failed to delete task")
    }
  }, [])

  // const updateTaskStatus = useCallback(async (taskId: string, status: Task["status"]) => {
  //   try {
  //     const res = await fetch(`/api/tasks/${taskId}`, {
  //       method: "PATCH",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ status }),
  //     })
  //     if (!res.ok) throw new Error("Failed to update task status")
  //     setSupervisorTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status } : t)))
  //     toast.success("Task status updated")
  //   } catch (e) {
  //     console.error(e)
  //     toast.error("Failed to update task status")
  //   }
  // }, [])

  // Employees assign
  // const handleEmployeeAssign = useCallback(
  //   async (employeeId: string) => {
  //     if (!selectedSupervisor?._id) return
  //     // No-op for demo
  //     toast.success("Employee assigned successfully")
  //     setIsEmployeeAssignOpen(false)
  //   },
  //   [selectedSupervisor]
  // )

  // Open/close
  const openSupervisorDetail = useCallback(
    async (supervisor: Supervisor) => {
      setSelectedSupervisor(supervisor)
      setIsDetailPanelOpen(true)
      await fetchSupervisorTasks(supervisor._id)
    },
    [fetchSupervisorTasks]
  )

  const closeSupervisorDetail = useCallback(() => {
    setIsDetailPanelOpen(false)
    setSelectedSupervisor(null)
    setSupervisorTasks([])
  }, [])

  const resetForm = useCallback(() => {
    if (formData.avatarPreview) {
      URL.revokeObjectURL(formData.avatarPreview)
    }
    setFormData(initialFormData)
  }, [formData.avatarPreview])

  const openEditDialog = useCallback((supervisor: Supervisor) => {
    setEditingSupervisor(supervisor)
    setFormData({
      name: supervisor.name,
      email: supervisor.email,
      phone: supervisor.phone,
      salary: supervisor.salary,
      address: supervisor.address,
      status: supervisor.status,
      username: supervisor.username,
      password: supervisor.password,
      confirmPassword: supervisor.password,
      avatar: undefined,
      avatarPreview: supervisor.avatar
    })
    setIsAddDialogOpen(true)
  }, [])

  // Open delete confirmation dialog
  const confirmDeleteSupervisor = useCallback((supervisor: Supervisor) => {
    setSupervisorToDelete(supervisor)
    setIsDeleteDialogOpen(true)
  }, [])

  // Handle actual deletion after confirmation
  const handleDeleteSupervisor = useCallback(async () => {
    if (!supervisorToDelete) return
    
    try {
      const res = await fetch(`/api/supervisors/${supervisorToDelete._id}`, { method: "DELETE" })
      if (!res.ok) throw new Error(await res.text())
      
      setSupervisors((prev) => prev.filter((x) => x._id !== supervisorToDelete._id))
      if (selectedSupervisor?._id === supervisorToDelete._id) closeSupervisorDetail()
      
      toast.success(`Deleted ${supervisorToDelete.name || "supervisor"}`)
      setIsDeleteDialogOpen(false)
      setSupervisorToDelete(null)
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Failed to delete supervisor")
    }
  }, [closeSupervisorDetail, selectedSupervisor, supervisorToDelete])

  const handleSubmitSupervisor = useCallback<React.FormEventHandler>(
    async (e) => {
      e.preventDefault()

      // Required field validations
      if (!formData.name?.trim()) {
        toast.error("Name is required")
        return
      }

      if (!formData.email?.trim()) {
        toast.error("Email is required")
        return
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address")
        return
      }

      if (!formData.phone?.trim()) {
        toast.error("Phone number is required")
        return
      }

      // Phone number validation (basic international format)
      const phoneRegex = /^[+]?[\s\-\(\)0-9]*$/
      if (!phoneRegex.test(formData.phone) || formData.phone.replace(/[^0-9]/g, '').length < 8) {
        toast.error("Please enter a valid phone number")
        return
      }

      if (!formData.address?.trim()) {
        toast.error("Address is required")
        return
      }

      if (isNaN(formData.salary) || formData.salary < 0) {
        toast.error("Please enter a valid salary amount")
        return
      }

      if (!formData.username?.trim()) {
        toast.error("Username is required")
        return
      }

      // For new supervisors or when changing password
      if (!editingSupervisor || formData.password) {
        if (!formData.password) {
          toast.error("Password is required")
          return
        }

        // Password strength validation
        if (formData.password.length < 8) {
          toast.error("Password must be at least 8 characters long")
          return
        }

        // if (!/[A-Z]/.test(formData.password)) {
        //   toast.error("Password must contain at least one uppercase letter")
        //   return
        // }

        if (!/[0-9]/.test(formData.password)) {
          toast.error("Password must contain at least one number")
          return
        }

        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match")
          return
        }
      }

      // Check for duplicate email/phone
      const emailExists = supervisors.some(
        (s) => s.email && s.email.toLowerCase() === formData.email.toLowerCase() &&
          (!editingSupervisor || s._id !== editingSupervisor._id)
      )
      if (emailExists) {
        toast.error("Email is already in use")
        return
      }

      const phoneExists = supervisors.some(
        (s) => s.phone === formData.phone &&
          (!editingSupervisor || s._id !== editingSupervisor._id)
      )
      if (phoneExists) {
        toast.error("Phone number is already in use")
        return
      }
      setLoading(true)
      try {
        let avatarUrl = editingSupervisor?.avatar

        // Upload avatar to R2 if provided
        if (formData.avatar) {
          const formDataWithFile = new FormData()
          formDataWithFile.append('file', formData.avatar)
          formDataWithFile.append('type', 'avatar')
          
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formDataWithFile,
          })

          if (!uploadRes.ok) throw new Error('Failed to upload avatar')
          const { fileUrl } = await uploadRes.json()
          avatarUrl = fileUrl
          setFormData(prev => ({ ...prev, avatarPreview: fileUrl }))
        }

        const url = editingSupervisor ? `/api/supervisors/${editingSupervisor._id}` : "/api/supervisors"
        const method = editingSupervisor ? "PUT" : "POST"
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            avatar: avatarUrl,
            status: editingSupervisor ? formData.status : "Active"
          }),
        })
        if (!res.ok) throw new Error(await res.text())
        await fetchSupervisors()
        setIsAddDialogOpen(false)
        setEditingSupervisor(null)
        resetForm()
        toast.success(`${formData.name} ${editingSupervisor ? "updated" : "added"} successfully`)
      } catch (e: any) {
        console.error(e)
        toast.error(e?.message || "Failed to save supervisor")
      } finally {
        setLoading(false)
      }
    },
    [editingSupervisor, fetchSupervisors, formData, resetForm, supervisors]
  )

  // UI: grid and list views
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredSupervisors.map((supervisor) => (
        <Card
          key={supervisor._id}
          className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] overflow-hidden"
          onClick={() => openSupervisorDetail(supervisor)}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar
                  src={supervisor.avatar}
                  name={supervisor.name}
                  size={48}
                  className="shrink-0"
                />
                <div>
                  <h3 className="font-semibold text-lg">{supervisor.name}</h3>
                  <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={supervisor.attendance?.status ?? undefined}
                      onValueChange={(value) => {
                        if (value === "Present" || value === "Absent" || value === "On Duty") {
                          handleAttendanceChange(supervisor._id, value as AttendanceStatus)
                        }
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-7 w-40",
                          supervisor.attendance?.status === "Present" && "bg-green-100 border-green-200",
                          supervisor.attendance?.status === "On Duty" && "bg-blue-100 border-blue-200",
                          supervisor.attendance?.status === "Absent" && "bg-red-100 border-red-200",
                          !supervisor.attendance?.status && "bg-gray-50 border-gray-200"
                        )}
                      >
                        <div className="flex items-center gap-1">
                          {supervisor.attendance?.status ? (
                            <>
                              {supervisor.attendance.status === "Present" && <CheckCircle className="w-3 h-3 text-green-600" />}
                              {supervisor.attendance.status === "On Duty" && <Briefcase className="w-3 h-3 text-blue-600" />}
                              {supervisor.attendance.status === "Absent" && <XCircle className="w-3 h-3 text-red-600" />}
                              <span className="text-sm font-medium">{supervisor.attendance.status}</span>
                            </>
                          ) : (
                            <SelectValue placeholder="Set Status" />
                          )}
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {attendanceOptions.map(({ value, label, icon: Icon }) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-3 h-3" />
                              {label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <Badge className={getStatusBadgeClass(supervisor.status)}>{supervisor.status}</Badge>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{supervisor.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{supervisor.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{supervisor.address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <IndianRupee className="w-4 h-4 text-muted-foreground" />
                <span>₹{supervisor.salary.toLocaleString()}/day</span>
              </div>
            </div>

            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => openEditDialog(supervisor)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 hover:text-green-700 border-green-500 hover:bg-green-50 bg-transparent"
                onClick={() => window.open(`https://wa.me/${supervisor.phone.replace(/[^0-9]/g, "")}`, "_blank")}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => openSupervisorDetail(supervisor)}>
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="destructive" size="sm" onClick={() => confirmDeleteSupervisor(supervisor)}>
                <Trash2 className="w-4 h-4" />
              </Button>
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
              <TableHead>Supervisor</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Daily Salary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSupervisors.map((supervisor) => (
              <TableRow
                key={supervisor._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => openSupervisorDetail(supervisor)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={supervisor.avatar}
                      name={supervisor.name}
                      size={40}
                      className="shrink-0"
                    />
                    <div>
                      <div className="font-medium">{supervisor.name}</div>
                      <div className="text-sm text-muted-foreground">{supervisor.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{supervisor.phone}</div>
                    <div className="text-muted-foreground">{supervisor.address}</div>
                  </div>
                </TableCell>
                <TableCell className="flex items-center gap-1">
                  <IndianRupee className="w-4 h-4 text-muted-foreground" />
                  {supervisor.salary.toLocaleString()}/day
                </TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeClass(supervisor.status)}>{supervisor.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Select
                        value={supervisor.attendance?.status ?? undefined}
                        onValueChange={(value) => handleAttendanceChange(supervisor._id, value as AttendanceStatus)}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-7 w-40",
                            supervisor.attendance?.status === "Present" && "bg-green-100 border-green-200",
                            supervisor.attendance?.status === "On Duty" && "bg-blue-100 border-blue-200",
                            supervisor.attendance?.status === "Absent" && "bg-red-100 border-red-200",
                            !supervisor.attendance?.status && "bg-gray-50 border-gray-200"
                          )}
                        >
                          <div className="flex items-center gap-1">
                            {supervisor.attendance?.status ? (
                              <>
                                {supervisor.attendance.status === "Present" && (
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                )}
                                {supervisor.attendance.status === "On Duty" && (
                                  <Briefcase className="w-3 h-3 text-blue-600" />
                                )}
                                {supervisor.attendance.status === "Absent" && (
                                  <XCircle className="w-3 h-3 text-red-600" />
                                )}
                                <span className="text-sm font-medium">{supervisor.attendance.status}</span>
                              </>
                            ) : (
                              <SelectValue placeholder="Set Status" />
                            )}
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {attendanceOptions.map(({ value, label, icon: Icon }) => (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center gap-2">
                                <Icon className="w-3 h-3" />
                                {label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {supervisor.attendance?.checkIn && (
                      <span className="text-xs text-muted-foreground">In: {supervisor.attendance.checkIn}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(supervisor)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700 border-green-500 hover:bg-green-50 bg-transparent"
                      onClick={() => window.open(`https://wa.me/${supervisor.phone.replace(/[^0-9]/g, "")}`, "_blank")}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openSupervisorDetail(supervisor)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => confirmDeleteSupervisor(supervisor)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto p-4 space-y-6">

      {/* Leave approval modal */}
      <SupervisorLeaveApprovalModal
        isOpen={showLeaveApproval}
        onClose={() => setShowLeaveApproval(false)}
        onApprove={handleApproveLeave}
        supervisorName={
          selectedSupervisorId ? supervisors.find((s) => s._id === selectedSupervisorId)?.name || "Supervisor" : "Supervisor"
        }
        selectedDates={leaveDates}
        reason={leaveReason}
        onReasonChange={setLeaveReason}
        isSubmitting={isSubmittingLeave}
        existingPaidLeaveDays={existingPaidLeaveDays}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supervisors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSupervisors}</div>
            <p className="text-xs text-muted-foreground">Active workforce</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{presentToday}</div>
            <p className="text-xs text-muted-foreground">Marked present</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Duty</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{onDutyToday}</div>
            <p className="text-xs text-muted-foreground">On duty today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{absentToday}</div>
            <p className="text-xs text-muted-foreground">Marked absent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Status</CardTitle>
            <HelpCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{noStatusToday}</div>
            <p className="text-xs text-muted-foreground">Not marked yet</p>
          </CardContent>
        </Card>
      </div>

      {/* Header and Add */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Supervisors Management</h2>
          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              setLoading(true)
              fetchSupervisors()
            }}
            className="ml-2"
            disabled={loading}
            title="Refresh supervisors"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          </Button>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              {editingSupervisor ? "Edit Supervisor" : "Add Supervisor"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSupervisor ? "Edit Supervisor" : "Add New Supervisor"}</DialogTitle>
              <DialogDescription>
                {editingSupervisor ? "Update supervisor information" : "Create a new supervisor record"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitSupervisor} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
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
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{editingSupervisor ? "New Password" : "Password *"}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                      placeholder={editingSupervisor ? "Leave blank to keep current" : "Enter password"}
                      required={!editingSupervisor}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData((p) => ({ ...p, confirmPassword: e.target.value }))}
                      placeholder="Confirm password"
                      required
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="shrink-0">
                    <Avatar
                      src={formData.avatarPreview || editingSupervisor?.avatar || "/placeholder.svg?height=96&width=96&query=avatar"}
                      name={formData.name}
                      size={96}
                      className="h-24 w-24"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="avatar">Profile Photo (Optional)</Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setFormData((prev) => ({
                            ...prev,
                            avatar: file,
                            avatarPreview: URL.createObjectURL(file)
                          }))
                        }
                      }}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Recommended: Square image, max 5MB</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Daily Salary (₹) *</Label>
                  <Input
                    id="salary"
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.salary === 0 ? "" : formData.salary} // don’t force 0
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        salary: e.target.value === "" ? 0 : parseInt(e.target.value, 10),
                      }))
                    }
                    placeholder="e.g., 150 (per day)"
                    required
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />

                  <p className="text-xs text-muted-foreground">Enter daily salary amount</p>
                </div>
              </div>

              {editingSupervisor && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData((p) => ({ ...p, status: value as FormData["status"] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Enter home address"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setEditingSupervisor(null)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">{loading ? "Saving..." : editingSupervisor ? "Update Supervisor" : "Create Supervisor"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and view toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search supervisors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge variant="secondary" className="self-center">
            {filteredSupervisors.length} Total
          </Badge>
        </div>
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className="h-8 px-3">
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")} className="h-8 px-3">
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading && supervisors.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading supervisors...</p>
          </div>
        </div>
      ) : filteredSupervisors.length > 0 ? (
        viewMode === "grid" ? (
          renderGridView()
        ) : (
          renderListView()
        )
      ) : (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No supervisors found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== "All" ? "Try adjusting your search or filter criteria" : "Get started by adding your first supervisor"}
          </p>
          {!searchTerm && statusFilter === "All" && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Supervisor
            </Button>
          )}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={isDetailPanelOpen} onOpenChange={setIsDetailPanelOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] sm:max-w-none flex flex-col">
          {selectedSupervisor && (
            <div className="flex flex-col h-full">
              <SheetHeader className="shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={selectedSupervisor.avatar}
                    name={selectedSupervisor.name}
                    size={64}
                    className="shrink-0"
                  />
                  <div className="flex-1">
                    <SheetTitle className="text-2xl">{selectedSupervisor.name}</SheetTitle>
                    <div className="mt-1">
                      <Badge className={getStatusBadgeClass(selectedSupervisor.status)}>{selectedSupervisor.status}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      openEditDialog(selectedSupervisor)
                      setIsDetailPanelOpen(false)
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </SheetHeader>

              <Tabs defaultValue="overview" value={detailTab} onValueChange={(v) => setDetailTab(v as any)} className="mt-6 flex flex-col h-[calc(100%-100px)]">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="team">Team Members</TabsTrigger>

                </TabsList>

                <TabsContent value="overview" className="flex-1 overflow-y-auto pr-2 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          {selectedSupervisor.attendance?.status === "Present" ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : selectedSupervisor.attendance?.status === "Absent" ? (
                            <XCircle className="w-5 h-5 text-red-600" />
                          ) : (
                            <HelpCircle className="w-5 h-5 text-gray-600" />
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              {selectedSupervisor.attendance?.status === "Present"
                                ? "Present Today"
                                : selectedSupervisor.attendance?.status === "Absent"
                                  ? "Absent Today"
                                  : "No Status Set"}
                            </p>
                            {selectedSupervisor.attendance?.checkIn && (
                              <p className="text-xs text-muted-foreground">Check-in: {selectedSupervisor.attendance.checkIn}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Calculator className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium">Daily Rate</p>
                            <p className="text-lg font-bold flex items-center gap-1">
                              <IndianRupee className="w-4 h-4" />
                              {selectedSupervisor.salary.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <CombinedAttendanceView
                    supervisorId={selectedSupervisor._id}
                    dailySalary={selectedSupervisor.salary}
                    initialMonth={new Date().toISOString().slice(0, 7)}
                  />

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
                            <p className="text-sm text-muted-foreground">{selectedSupervisor.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Phone</p>
                            <p className="text-sm text-muted-foreground">{selectedSupervisor.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Address</p>
                            <p className="text-sm text-muted-foreground">{selectedSupervisor.address}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <IndianRupee className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Daily Salary</p>
                            <p className="text-sm text-muted-foreground">₹{selectedSupervisor.salary.toLocaleString()}/day</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Hash className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Username</p>
                            <p className="text-sm text-muted-foreground">{selectedSupervisor.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Lock className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p>password</p>
                            <p className="text-sm text-muted-foreground">{selectedSupervisor.password}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Joined</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(selectedSupervisor.createdAt), "PPP")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tasks" className="flex-1 overflow-y-auto pr-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Assigned Tasks</h3>
                    <Button size="sm" onClick={openTaskForm}>
                      <CalendarPlus className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {isLoadingTasks ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
                      </div>
                    ) : supervisorTasks.length > 0 ? (
                      supervisorTasks.map((task) => (
                        <Card key={task._id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium">{task.title}</h4>
                              <div className="flex items-center gap-2">
                                <Select
                                  value={task.status}
                                  onValueChange={(val) => updateTaskStatus(task._id, val as Task['status'])}
                                  disabled={updatingTaskIds.has(task._id)}
                                >
                                  <SelectTrigger
                                    className={cn("h-7 w-40", getTaskStatusColor(task.status), updatingTaskIds.has(task._id) && 'opacity-70')}
                                    aria-busy={updatingTaskIds.has(task._id)}
                                  >
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button variant="outline" size="sm" onClick={() => openEditTaskForm(task)} className="h-7 w-7 p-0">
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button variant="destructive" size="sm" className="h-7 w-7 p-0" onClick={() => handleTaskDelete(task._id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            {task.description && <p className="text-sm text-muted-foreground mb-3">{task.description}</p>}
                            <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                              {task.projectId && (
                                <div className="flex items-center gap-2">
                                  <Folder className="w-3 h-3" />
                                  <span>{availableProjects.find((p) => p._id === task.projectId)?.title || "Project"}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{format(new Date(task.startDate), "MMM dd, yyyy")}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Due: {format(new Date(task.endDate), "MMM dd, yyyy")}</span>
                                </div>
                              </div>
                            </div>
                            {task.documentUrls && task.documentUrls.length > 0 && (
                              <div className="mt-2 space-y-2">
                                <p className="text-xs text-muted-foreground">Attached Documents:</p>
                                <div className="flex flex-wrap gap-2">
                                  {task.documentUrls.map((doc, index) => {
                                    // Handle both string and object formats
                                    const docUrl = typeof doc === 'string' ? doc : doc.url;
                                    const docName = typeof doc === 'string' 
                                      ? doc.split('/').pop() || `Document ${index + 1}`
                                      : doc.name || doc.url.split('/').pop() || `Document ${index + 1}`;
                                    
                                    const fileType = docName.split('.').pop()?.toLowerCase() || '';
                                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType);
                                    const isPdf = fileType === 'pdf';
                                    const isDoc = ['doc', 'docx'].includes(fileType);
                                    
                                    return (
                                      <div
                                        key={index}
                                        className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded cursor-pointer hover:bg-gray-200 group transition-colors duration-200"
                                        onClick={() => {
                                          if (isImage) {
                                            setPreviewUrl(docUrl);
                                            setPreviewFileName(docName);
                                            setPreviewOpen(true);
                                          } else {
                                            window.open(docUrl, '_blank');
                                          }
                                        }}
                                        title={docName}
                                      >
                                        {isImage ? (
                                          <Image className="w-4 h-4 text-blue-500" />
                                        ) : isPdf ? (
                                          <FileText className="w-4 h-4 text-red-500" />
                                        ) : isDoc ? (
                                          <FileText className="w-4 h-4 text-blue-500" />
                                        ) : (
                                          <File className="w-4 h-4 text-gray-500" />
                                        )}
                                        <div className="flex flex-col">
                                          <span className="text-sm font-medium">{docName}</span>
                                          {typeof doc === 'object' && doc.size && (
                                            <span className="text-xs text-muted-foreground">({(doc.size / 1024 / 1024).toFixed(2)} MB)</span>
                                          )}
                                        </div>
                                        <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-muted-foreground" />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <ClipboardList className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No tasks assigned yet</p>
                        <Button variant="outline" size="sm" onClick={openTaskForm} className="mt-2 bg-transparent">
                          <CalendarPlus className="w-4 h-4 mr-2" />
                          Add First Task
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="team" className="flex-1 overflow-y-auto pr-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Team Members</h3>
                    <Button size="sm" onClick={openEmployeeAssign}>
                      <Plus className="w-4 h-4 mr-2" />
                      Assign Employee
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {supervisorEmployees.length > 0 ? (
                      supervisorEmployees.map((emp) => (
                        <Card key={emp._id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={emp.avatar || "/placeholder.svg?height=32&width=32&query=avatar"}
                                name={emp.name}
                                size={32}
                                className="h-8 w-8"
                              />
                              <div>
                                <h4 className="font-medium">{emp.name}</h4>
                                <p className="text-sm text-muted-foreground">{emp.position}</p>
                              </div>
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => handleEmployeeUnassign(emp._id)}>
                              <UserMinus className="w-3 h-3 mr-2" />
                              Unassign
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No team members yet</p>
                        <Button variant="outline" size="sm" onClick={openEmployeeAssign} className="mt-2 bg-transparent">
                          <Plus className="w-4 h-4 mr-2" />
                          Assign First Employee
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* File Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[800px] h-auto absolute">
          <h3 className="text-lg font-semibold mb-2 pr-8 truncate">{previewFileName}</h3>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <div className="relative w-full h-full flex items-center justify-center mt-6">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
                toast.error('Failed to load image preview');
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Task create dialog */}
      <Dialog open={isTaskFormOpen} onOpenChange={setIsTaskFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>Assign a new task to {selectedSupervisor?.name}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTaskSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input id="title" name="title" placeholder="Task Title" value={taskFormData.title} onChange={handleTaskFormChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="Task description..." value={taskFormData.description} onChange={handleTaskFormChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !taskFormData.startDate && "text-muted-foreground")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {taskFormData.startDate ? format(taskFormData.startDate, "PPP") : <span>Start Date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent mode="single" selected={taskFormData.startDate} onSelect={(d) => handleTaskDateChange(d ?? undefined, "startDate")} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !taskFormData.endDate && "text-muted-foreground")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {taskFormData.endDate ? format(taskFormData.endDate, "PPP") : <span>End Date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent mode="single" selected={taskFormData.endDate} onSelect={(d) => handleTaskDateChange(d ?? undefined, "endDate")} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectId">Project *</Label>
              <Select value={taskFormData.projectId} onValueChange={handleProjectChange} required>
                <SelectTrigger id="projectId" className="w-full">
                  <SelectValue placeholder={isLoadingProjects ? "Loading projects..." : "Select a project"} />
                </SelectTrigger>
                <SelectContent>
                  {availableProjects.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <Select value={taskFormData.documentType} onValueChange={handleDocumentTypeChange}>
                <SelectTrigger id="documentType" className="w-full">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {taskFormData.documentType && (
              <div className="space-y-2">
                <Label htmlFor="file">Upload {taskFormData.documentType}</Label>
                <Input
                  id="file"
                  name="file"
                  type="file"
                  multiple
                  accept={
                    taskFormData.documentType === "image"
                      ? "image/*"
                      : taskFormData.documentType === "pdf"
                        ? ".pdf"
                        : ".doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.pdf"
                  }
                  onChange={handleFileChange}
                />
                {taskFormData.filePreviews.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <Label>Selected Files</Label>
                    <div className="space-y-1">
                      {taskFormData.filePreviews.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              setTaskFormData(prev => ({
                                ...prev,
                                documentUrls: prev.documentUrls.filter((_, i) => i !== index),
                                filePreviews: prev.filePreviews.filter((_, i) => i !== index)
                              }))
                              toast.success('File removed')
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsTaskFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Assign Task</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Task edit */}
      <Dialog open={isEditTaskFormOpen} onOpenChange={setIsEditTaskFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details for {selectedSupervisor?.name}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTaskEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Task Title *</Label>
              <Input id="edit-title" name="title" placeholder="Task Title" value={taskFormData.title} onChange={handleTaskFormChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input id="edit-description" name="description" placeholder="Task description..." value={taskFormData.description} onChange={handleTaskFormChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !taskFormData.startDate && "text-muted-foreground")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {taskFormData.startDate ? format(taskFormData.startDate, "PPP") : <span>Start Date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent mode="single" selected={taskFormData.startDate} onSelect={(d) => setTaskFormData((p) => ({ ...p, startDate: d ?? undefined }))} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !taskFormData.endDate && "text-muted-foreground")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {taskFormData.endDate ? format(taskFormData.endDate, "PPP") : <span>End Date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent mode="single" selected={taskFormData.endDate} onSelect={(d) => setTaskFormData((p) => ({ ...p, endDate: d ?? undefined }))} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-projectId">Project *</Label>
              <Select value={taskFormData.projectId} onValueChange={handleProjectChange} required>
                <SelectTrigger id="edit-projectId" className="w-full">
                  <SelectValue placeholder={isLoadingProjects ? "Loading projects..." : "Select a project"} />
                </SelectTrigger>
                <SelectContent>
                  {availableProjects.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-documentType">Document Type</Label>
              <Select value={taskFormData.documentType} onValueChange={handleDocumentTypeChange}>
                <SelectTrigger id="edit-documentType" className="w-full">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {taskFormData.documentType && (
              <div className="space-y-2">
                <Label htmlFor="edit-file">Upload {taskFormData.documentType}</Label>
                <Input id="edit-file" name="file" type="file" onChange={handleFileChange} />
                {taskFormData.file && <div className="text-xs text-muted-foreground">Selected: {taskFormData.file.name}</div>}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={closeEditTaskForm}>
                Cancel
              </Button>
              <Button type="submit">Update Task</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Supervisor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {supervisorToDelete?.name || 'this supervisor'}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <DialogClose asChild>
              <Button 
                variant="outline"
                onClick={() => setSupervisorToDelete(null)}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteSupervisor();
              }}
              disabled={!supervisorToDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Employee assignment */}
      <Dialog open={isEmployeeAssignOpen} onOpenChange={() => setIsEmployeeAssignOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Employee</DialogTitle>
            <DialogDescription>Select an employee to assign to {selectedSupervisor?.name}.</DialogDescription>
          </DialogHeader>
          {loadingEmployees ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {availableEmployees.map((employee) => (
                <Button
                  key={employee._id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleEmployeeAssign(employee._id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={employee.avatar || "/placeholder.svg?height=32&width=32&query=avatar"} alt={employee.name} />
                      <AvatarFallback>
                        {employee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{employee.name}</h4>
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                    </div>
                  </div>
                </Button>
              ))}
              {availableEmployees.length === 0 && (
                <div className="text-center py-4">
                  <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No employees available to assign</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

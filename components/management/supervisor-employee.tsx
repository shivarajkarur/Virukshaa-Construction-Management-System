"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Users, RefreshCw, Search, Mail, Phone, Briefcase, CheckCircle, XCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"

type AttendanceStatus = "Present" | "Absent" | "On Duty" | null

const attendanceOptions: { value: Exclude<AttendanceStatus, null>; label: string; icon: LucideIcon }[] = [
  { value: "Present", label: "Present", icon: CheckCircle },
  { value: "On Duty", label: "On Duty", icon: Briefcase},
  { value: "Absent", label: "Absent", icon: XCircle},
]

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

// Helper function to normalize attendance status values
function normalizeAttendanceStatus(value: any, presentFlag?: boolean): AttendanceStatus {
  const normalized = String(value || "").trim()
  if (normalized === "Present" || normalized === "Absent" || normalized === "On Duty") {
    return normalized
  }
  if (presentFlag === true) return "Present"
  if (presentFlag === false) return "Absent"
  return null
}

export default function SupervisorEmployee() {
  const [employees, setEmployees] = useState<SupervisorEmployeeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [projects, setProjects] = useState<IProject[]>([])
  const supervisorId = typeof window !== "undefined" ? localStorage.getItem("userId") : null
  const role = typeof window !== "undefined" ? localStorage.getItem("userRole") : null

  const fetchEmployees = async () => {
    if (!supervisorId || role !== "supervisor") {
      setEmployees([])
      setLoading(false)
      setError("You must be logged in as a supervisor to view assigned employees.")
      return
    }
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/supervisors/${encodeURIComponent(supervisorId)}/employees`, { cache: "no-store" })
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}))
        throw new Error(msg?.message || `Failed to load employees (HTTP ${res.status})`)
      }
      const data = await res.json()
      const mapped: SupervisorEmployeeItem[] = (data || []).map((e: any) => ({
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
        projectId: e.projectId,
      }))
      setEmployees(mapped)
    } catch (e: any) {
      setError(e?.message || "Failed to load employees")
    } finally {
      setLoading(false)
    }
  }

  // Load all projects to resolve human-readable titles for projectId
  const fetchProjects = async () => {
    try {
      const res = await fetch(`/api/projects`, { cache: "no-store" })
      if (!res.ok) {
        // Do not throw to avoid breaking the page; just log
        const msg = await res.json().catch(() => ({}))
        console.error("Failed to load projects:", msg?.message || res.status)
        return
      }
      const data = await res.json()
      const mapped: IProject[] = Array.isArray(data)
        ? data.map((p: any) => ({ _id: p._id || p.id, title: p.title }))
        : []
      setProjects(mapped)
    } catch (err) {
      console.error("Error fetching projects:", err)
    }
  }

  useEffect(() => {
    fetchEmployees()
    fetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAttendanceChange = async (
    employeeId: string,
    status: AttendanceStatus,
    dateStr: string = new Date().toISOString().split("T")[0],
    leaveReason: string | null = null,
    isPaid = true,
  ) => {
    const employee = employees.find((x) => x._id === employeeId)
    if (!employee) {
      toast.error("Employee not found")
      return false
    }

    // Only allow attendance setting for monthly employees
    if (employee.workType !== "Monthly") {
      toast.error("Attendance setting is only available for monthly employees")
      return false
    }

    try {
      const now = new Date()
      const timestamp = now.toISOString()

      const response = await fetch("/api/attendance/monthly-employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          date: dateStr,
          status,
          leaveReason,
          isPaid,
          timestamp,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
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

        toast.success(data.message || `${employee.name}'s attendance updated to ${status}`)

        // Refresh live data (admin/supervisor parity for today's attendance)
        await fetchAttendanceRealtime()

        return true
      } else {
        toast.error(data.message || "Failed to update attendance")
        return false
      }
    } catch (error) {
      console.error("Error updating attendance:", error)
      toast.error("Failed to update attendance. Please try again.")
      return false
    }
  }

  const fetchAttendanceRealtime = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]
      const res = await fetch(`/api/attendance/monthly-employees?date=${today}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body?.success) {
        if (res.status === 401) {
          toast.error("Unauthorized. Please sign in to view live attendance.")
        } else {
          toast.error(body?.message || "Failed to fetch attendance.")
        }
        return
      }

      const records: any[] = body.data || []
      const attMap = new Map<string, any>()
      for (const rec of records) {
        const eid =
          typeof rec.employeeId === "string" ? rec.employeeId : (rec.employeeId as any)?._id || String(rec.employeeId)
        if (!eid) continue
        attMap.set(String(eid), rec)
      }

      setEmployees((prev) =>
        prev.map((emp) => {
          if (emp.workType !== "Monthly") return emp
          const att = attMap.get(emp._id)
          if (!att) {
            return {
              ...emp,
              attendance: emp.attendance?.status ? emp.attendance : { present: false, status: null },
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

  useEffect(() => {
    fetchAttendanceRealtime()

    // Set up interval for real-time updates (every 30 seconds)
    const interval = setInterval(fetchAttendanceRealtime, 30000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return employees
    return employees.filter((e) =>
      [e.name, e.email, e.role, e.position, e.workType, e.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    )
  }, [employees, search])

  const getStatusVariant = (status?: string) => {
    if (!status) return "secondary" as const
    const s = status.toLowerCase()
    if (s.includes("active") || s.includes("working")) return "default" as const
    if (s.includes("inactive") || s.includes("terminated")) return "destructive" as const
    if (s.includes("pending")) return "secondary" as const
    return "outline" as const
  }

  if (loading && employees.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading assigned employees...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">My Team</h2>
            <p className="text-sm text-muted-foreground">Manage your assigned employees</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            size="icon"
            variant="outline"
            onClick={() => fetchEmployees()}
            title="Refresh"
            disabled={loading}
            className="shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Team</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">Employees reporting to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {employees.filter((e) => (e.status?.toLowerCase() || "").includes("active")).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently working</p>
          </CardContent>
        </Card>
        {/* other stat cards are intentionally left commented to keep UI unchanged */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((emp) => (
          <Card key={emp._id} className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Avatar intentionally commented out to keep current UI */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg leading-tight truncate">{emp.name}</h3>
                      {(emp.role || emp.position) && (
                        <p className="text-sm text-muted-foreground mt-1">{emp.role || emp.position}</p>
                      )}
                      {emp.projectId && (
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Briefcase className="w-3 h-3" />
                          <span>Project: {projects.find((p) => p._id === emp.projectId)?.title || "No project"}</span>
                        </div>
                      )}
                    </div>
                    {emp.status && (
                      <Badge variant={getStatusVariant(emp.status)} className="shrink-0 text-xs">
                        {emp.status}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-4 space-y-3">
                    {emp.email && (
                      <div className="flex items-center gap-3 text-sm group">
                        <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                        <a
                          className="text-muted-foreground hover:text-primary transition-colors truncate"
                          href={`mailto:${emp.email}`}
                          title={emp.email}
                        >
                          {emp.email}
                        </a>
                      </div>
                    )}

                    {emp.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{emp.phone}</span>
                      </div>
                    )}

                    {(emp.workType || typeof emp.salary === "number") && (
                      <div className="flex items-center gap-3 text-sm">
                        <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">
                          {emp.workType}
                          {emp.workType?.toLowerCase() === "shift" && typeof emp.shiftsWorked === "number" && (
                            <span className="ml-2 text-xs bg-secondary px-2 py-1 rounded">
                              {emp.shiftsWorked} shifts
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {/* other info blocks remain commented to preserve current UI */}
                  </div>

                  {/* Attendance Management - Only for Monthly employees */}
                  {emp.workType === "Monthly" && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{"Today's Status:"}</span>
                          {emp.attendance?.status ? (
                            <Badge
                              variant={
                                emp.attendance.status === "Present"
                                  ? "default"
                                  : emp.attendance.status === "On Duty"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="text-xs"
                            >
                              {normalizeAttendanceStatus(emp.attendance.status)}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Not Set
                            </Badge>
                          )}
                        </div>

                        <Select
                          value={emp.attendance?.status || ""}
                          onValueChange={(value) => handleAttendanceChange(emp._id, value as AttendanceStatus)}
                        >
                          <SelectTrigger 
                            className={`w-32 h-8 text-xs ${
                              emp.attendance?.status === 'Present' ? 'bg-green-100 hover:bg-green-100/80' :
                              emp.attendance?.status === 'Absent' ? 'bg-red-100 hover:bg-red-100/80' :
                              emp.attendance?.status === 'On Duty' ? 'bg-yellow-100 hover:bg-yellow-100/80' :
                              'bg-white hover:bg-gray-50'
                            }`}
                          >
                            <SelectValue placeholder="Set Status" />
                          </SelectTrigger>
                          <SelectContent>
                            {attendanceOptions.map((option) => (
                              <SelectItem 
                                key={option.value} 
                                value={option.value}
                          
                              >
                                <div className="flex items-center gap-2">
                                  <option.icon className="w-4 h-4" />
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {emp.attendance?.checkIn && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {"Check-in: "}
                          {new Date(emp.attendance.checkIn).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && !loading && !error && (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <Users className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{search ? "No employees found" : "No team members yet"}</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {search
              ? "Try adjusting your search terms or clearing the search to see all employees."
              : "When employees are assigned to you, they will appear here."}
          </p>
          {search && (
            <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setSearch("")}>
              Clear search
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

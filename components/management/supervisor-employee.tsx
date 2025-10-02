"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Users, RefreshCw, Search, Mail, Phone, Briefcase, CheckCircle, XCircle, Calendar } from "lucide-react"
import type { LucideIcon } from "lucide-react"

type AttendanceStatus = "Present" | "Absent" | "On Duty" | null

const attendanceOptions: { value: Exclude<AttendanceStatus, null>; label: string; icon: LucideIcon }[] = [
  { value: "Present", label: "Present", icon: CheckCircle },
  { value: "On Duty", label: "On Duty", icon: Briefcase },
  { value: "Absent", label: "Absent", icon: XCircle },
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

type ProjectWithEmployees = IProject & {
  employees: SupervisorEmployeeItem[]
  isActive?: boolean
}

export default function SupervisorEmployee() {
  const [employees, setEmployees] = useState<SupervisorEmployeeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [projects, setProjects] = useState<IProject[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const supervisorId = typeof window !== "undefined" ? localStorage.getItem("userId") : null
  const role = typeof window !== "undefined" ? localStorage.getItem("userRole") : null
  // Shift management state keyed by employeeId
  const [shiftData, setShiftData] = useState<Record<string, { shifts: number; perShiftSalary: number; totalPay?: number }>>({})
  // Loading flag to avoid showing zeroes during initial fetch
  const [isShiftLoading, setIsShiftLoading] = useState<boolean>(false)
  // Attendance state scoped per project and employee, keyed by projectId_employeeId
  const [attendanceData, setAttendanceData] = useState<Record<string, { status: AttendanceStatus; checkIn?: string; checkOut?: string; present: boolean; projectId: string }>>({})

  // Persist selected project across refreshes
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('selectedProject')
    if (saved) setSelectedProject(saved)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (selectedProject) {
      localStorage.setItem('selectedProject', selectedProject)
    } else {
      localStorage.removeItem('selectedProject')
    }
  }, [selectedProject])

  // Create a reusable function to fetch shift data
  const fetchShiftsRealtime = async () => {
    // Guard: require selected project for project-scoped shift fetching
    if (!selectedProject) return
    try {
      setIsShiftLoading(true)
      const today = new Date().toISOString().split("T")[0]
      const res = await fetch(`/api/employee-shifts?date=${today}${selectedProject ? `&projectId=${encodeURIComponent(selectedProject)}` : ""}`, { cache: "no-store" })
      const body = await res.json().catch(() => [])
      if (!res.ok) {
        toast.error((body as any)?.message || "Failed to fetch shifts.")
        setIsShiftLoading(false)
        return
      }
      const map: Record<string, { shifts: number; perShiftSalary: number; totalPay?: number }> = {}

      // Track if any shifts were updated externally
      let externalUpdates = false

      for (const doc of body as any[]) {
        const eid = typeof doc.employeeId === "string" ? doc.employeeId : (doc.employeeId?._id || String(doc.employeeId))
        if (!eid) continue

        const newShiftData = {
          shifts: typeof doc.shifts === "number" ? doc.shifts : 0,
          perShiftSalary: typeof doc.perShiftSalary === "number" ? doc.perShiftSalary : 0,
          totalPay: typeof doc.totalPay === "number" ? doc.totalPay : undefined,
        }

        // Check if this is an external update (shift differs from current local state)
        if (shiftData[eid]?.shifts !== newShiftData.shifts) {
          externalUpdates = true
        }

        map[eid] = newShiftData
      }

      setShiftData(map)
      // Persist per-project shift data to sessionStorage to avoid zeroes on refresh
      if (typeof window !== 'undefined' && selectedProject) {
        try {
          sessionStorage.setItem(`shiftData:${selectedProject}`, JSON.stringify(map))
        } catch {}
      }
      // Do not mutate employees[].shiftsWorked here; keep shiftData scoped per project

      // Show notification if shifts were updated from external source
      if (externalUpdates) {
        toast("Shifts Updated", {
          description: "Employee shifts have been updated from admin",
          duration: 3000,
        })
      }
    } catch (err) {
      console.error("Error fetching shifts:", err)
    } finally {
      setIsShiftLoading(false)
    }
  }

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
        assignedProjects: e.assignedProjects || [],
      }))
      setEmployees(mapped)

      // Fetch shift data immediately after loading employees
      if (selectedProject) {
        await fetchShiftsRealtime()
      } else {
        // Ensure no cross-project shift data is displayed without a selected project
        setShiftData({})
      }
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

    // Require project selection for project-scoped attendance
    if (!selectedProject) {
      toast.error("Select a project before setting attendance")
      return false
    }

    try {
      const now = new Date()
      const timestamp = now.toISOString()

      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          projectId: selectedProject,
          date: dateStr,
          status,
          leaveReason,
          isPaid,
          timestamp,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Create a unique key for this employee-project combination
        const attendanceKey = `${selectedProject}_${employeeId}`
        
        // Update project-scoped attendance cache optimistically
        setAttendanceData((prev) => {
          const next = { ...prev }
          next[attendanceKey] = {
            status,
            checkIn: status === "Present" || status === "On Duty" ? timestamp : prev[attendanceKey]?.checkIn,
            checkOut: prev[attendanceKey]?.checkOut,
            present: status === "Present" || status === "On Duty",
            projectId: selectedProject
          }
          return next
        })
        
        // Persist per-project attendance to sessionStorage
        if (typeof window !== 'undefined' && selectedProject) {
          try {
            const currentData = { ...attendanceData }
            currentData[attendanceKey] = {
              status,
              checkIn: status === "Present" || status === "On Duty" ? timestamp : attendanceData[attendanceKey]?.checkIn,
              checkOut: attendanceData[attendanceKey]?.checkOut,
              present: status === "Present" || status === "On Duty",
              projectId: selectedProject
            }
            sessionStorage.setItem(`attendanceData:${selectedProject}`, JSON.stringify(currentData))
          } catch {}
        }

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
    // Guard: require selected project for project-scoped attendance fetching
    if (!selectedProject) return
    try {
      const today = new Date().toISOString().split("T")[0]
      const res = await fetch(`/api/attendance?date=${today}&monthlyEmployees=true${selectedProject ? `&projectId=${encodeURIComponent(selectedProject)}` : ""}` , {
        cache: "no-store",
        headers: { Accept: "application/json" },
      })
      const raw = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = (raw as any)?.message
        if (res.status === 401) {
          toast.error("Unauthorized. Please sign in to view live attendance.")
        } else {
          toast.error(msg || "Failed to fetch attendance.")
        }
        return
      }

      const records: any[] = Array.isArray(raw) ? (raw as any[]) : ((raw as any)?.data || [])
      const map: Record<string, { status: AttendanceStatus; checkIn?: string; checkOut?: string; present: boolean; projectId: string }> = {}
      for (const rec of records) {
        const eid = typeof rec.employeeId === "string" ? rec.employeeId : (rec.employeeId as any)?._id || String(rec.employeeId)
        if (!eid) continue
        
        // Get project ID from record or use selected project
        const projectId = (rec as any).projectId || selectedProject
        if (!projectId) continue
        
        // Create a unique key for this employee-project combination
        const attendanceKey = `${projectId}_${eid}`
        
        const statusNorm = normalizeAttendanceStatus((rec as any).status, (rec as any).present)
        map[attendanceKey] = {
          status: statusNorm,
          checkIn: (rec as any).checkIn,
          checkOut: (rec as any).checkOut,
          present: statusNorm === "Present" || statusNorm === "On Duty",
          projectId: projectId
        }
      }
      setAttendanceData(map)
      // Persist per-project attendance to sessionStorage
      if (typeof window !== 'undefined' && selectedProject) {
        try {
          sessionStorage.setItem(`attendanceData:${selectedProject}`, JSON.stringify(map))
        } catch {}
      }
    } catch (err) {
      console.error("Error fetching live attendance:", err)
    }
  }

  useEffect(() => {
    // Refetch attendance when project changes and keep polling with fresh scope
    // Rehydrate cached attendance data for the selected project first
    if (typeof window !== 'undefined' && selectedProject) {
      const key = `attendanceData:${selectedProject}`
      const cached = sessionStorage.getItem(key)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          if (parsed && typeof parsed === 'object') {
            setAttendanceData(parsed)
          }
        } catch {}
      } else {
        setAttendanceData({})
      }
    } else {
      setAttendanceData({})
    }

    fetchAttendanceRealtime()

    const interval = setInterval(fetchAttendanceRealtime, 30000)
    return () => clearInterval(interval)
  }, [selectedProject])
  // Fetch shift data whenever employees list changes
  useEffect(() => {
    const hasShiftEmployees = employees.some((e) => (e.workType || "").toLowerCase() === "shift")
    if (!hasShiftEmployees) return

    fetchShiftsRealtime()

    // Set up interval for real-time synchronization (every 10 seconds)
    const interval = setInterval(fetchShiftsRealtime, 10000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, selectedProject])

  // Reset local shift cache when switching projects to avoid cross-project mixing
  useEffect(() => {
    if (!selectedProject) {
      setShiftData({})
      return
    }
    // Rehydrate cached shift data for the selected project immediately
    if (typeof window !== 'undefined') {
      const key = `shiftData:${selectedProject}`
      const cached = sessionStorage.getItem(key)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          if (parsed && typeof parsed === 'object') {
            setShiftData(parsed)
          }
        } catch {}
      } else {
        setShiftData({})
      }
    }
    // Then fetch fresh data from DB to keep it up-to-date
    fetchShiftsRealtime()
  }, [selectedProject])
  // Save/update shift assignment for an employee
  const saveShift = async (employeeId: string, shifts: number, perShiftSalary: number) => {
    try {
      const today = new Date().toISOString().split("T")[0]
      const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null

      // Require project selection for project-scoped shift saving
      if (!selectedProject) {
        toast.error("Select a project before saving shifts")
        return false
      }

      const res = await fetch(`/api/employee-shifts`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "Authorization": `Bearer ${userId}` } : {})
        },
        body: JSON.stringify({ employeeId, projectId: selectedProject, date: today, shifts, perShiftSalary }),
      })

      const doc = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error((doc as any)?.message || "Failed to save shift.")
        return false
      }
      const s = typeof (doc as any)?.shifts === "number" ? (doc as any).shifts : shifts
      const pay = typeof (doc as any)?.perShiftSalary === "number" ? (doc as any).perShiftSalary : perShiftSalary
      setShiftData((prev) => ({ ...prev, [employeeId]: { shifts: s, perShiftSalary: pay, totalPay: (doc as any)?.totalPay } }))
      // Do not update employees[].shiftsWorked; display derives from shiftData per selected project
      toast.success("Shift updated successfully")
      return true
    } catch (err) {
      console.error("Error saving shift:", err)
      toast.error("Failed to save shift. Please try again.")
      return false
    }
  }

  // Group employees by project - only include projects that have assigned employees
  const projectsWithEmployees = useMemo(() => {
    const projectMap = new Map<string, ProjectWithEmployees>()
    
    // Group employees by their projects - only create project entries when employees are assigned
    employees.forEach(employee => {
      const assignedProjects = Array.isArray((employee as any).assignedProjects)
        ? (employee as any).assignedProjects
        : []
      
      // Handle modern assignedProjects array
      assignedProjects.forEach((assignment: any) => {
        const projectId = assignment.projectId
        if (!projectId) return
        
        // Create project entry if it doesn't exist yet
        if (!projectMap.has(projectId)) {
          const projectData = projects.find(p => p._id === projectId)
          if (!projectData) return // Skip if project not found
          
          projectMap.set(projectId, {
            ...projectData,
            employees: [],
            isActive: selectedProject === projectId
          })
        }
        
        // Add employee to project
        const project = projectMap.get(projectId)!
        if (!project.employees.some(e => e._id === employee._id)) {
          project.employees.push(employee)
        }
      })
      
      // Handle legacy single projectId
      if (employee.projectId) {
        const projectId = employee.projectId
        
        // Create project entry if it doesn't exist yet
        if (!projectMap.has(projectId)) {
          const projectData = projects.find(p => p._id === projectId)
          if (!projectData) return // Skip if project not found
          
          projectMap.set(projectId, {
            ...projectData,
            employees: [],
            isActive: selectedProject === projectId
          })
        }
        
        // Add employee to project
        const project = projectMap.get(projectId)!
        if (!project.employees.some(e => e._id === employee._id)) {
          project.employees.push(employee)
        }
      }
    })
    
    return Array.from(projectMap.values())
  }, [projects, employees, selectedProject])

  // Filter employees based on selected project and search term
  const filteredEmployees = useMemo(() => {
    let filtered = employees
    
    // Filter by selected project if any
    if (selectedProject) {
      filtered = filtered.filter(emp => {
        const assignedProjects = Array.isArray((emp as any).assignedProjects)
          ? (emp as any).assignedProjects
          : []
        
        return assignedProjects.some((assignment: any) => 
          String(assignment.projectId) === selectedProject
        ) || String(emp.projectId) === selectedProject
      })
    }
    
    // Apply search filter
    const term = search.trim().toLowerCase()
    if (term) {
      filtered = filtered.filter((e) =>
        [e.name, e.email, e.role, e.position, e.workType, e.status]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term))
      )
    }
    
    return filtered
  }, [employees, selectedProject, search])

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
            onClick={() => {
              setSelectedProject(null)
              fetchEmployees()
            }}
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

      {/* Project Cards */}
      {!selectedProject && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projectsWithEmployees.map((project) => (
          <Card 
            key={project._id}
            className={`cursor-pointer transition-all duration-200 ${
              project.isActive 
                ? 'ring-2 ring-primary shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedProject(project.isActive ? null : project._id)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium truncate">{project.title}</CardTitle>
              <Badge variant="outline" className="ml-2">
                {project.employees.length} {project.employees.length === 1 ? 'Employee' : 'Employees'}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Click to {project.isActive ? 'hide' : 'view'} assigned employees
              </p>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {/* Employee Cards */}
      {selectedProject && (
        <div className="space-y-4 transition-all duration-300 ease-out">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">
                {projects.find((p) => p._id === selectedProject)?.title || "Selected Project"}
              </h3>
              <p className="text-sm text-muted-foreground">Assigned employees</p>
            </div>
            <Button variant="outline" onClick={() => setSelectedProject(null)}>Back to projects</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEmployees.map((emp) => (
          <Card key={emp._id} className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm">
            <CardContent className="p-6">
             
              <div className="flex items-start gap-4">
                {/* Avatar intentionally commented out to keep current UI */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 text-center md:text-left">
                      <h2 className="font-semibold text-xl md:text-2xl leading-tight truncate">{emp.name}</h2>
                      {(emp.role || emp.position) && <p className="text-sm mt-1 text-pretty">{emp.role || emp.position}</p>}
                      <div className="mt-1 flex items-center justify-center md:justify-start gap-2 text-xs text-muted-foreground">
                        <Briefcase className="w-3 h-3" />
                        <span>
                          {(() => {
                            // Handle modern assignedProjects array format
                            const assignedProjects = Array.isArray((emp as any).assignedProjects)
                              ? (emp as any).assignedProjects
                              : [];
                            
                            // Get project titles from assignedProjects
                            let titles = assignedProjects
                              .map((assignment: any) => {
                                // First try to use projectTitle if it exists in the assignment
                                if (assignment.projectTitle) return assignment.projectTitle;
                                
                                // Otherwise look up the project title from projects array
                                return projects.find((p) => 
                                  String(p._id) === String(assignment.projectId)
                                )?.title;
                              })
                              .filter(Boolean);
                            
                            // Fallback to legacy single projectId if no titles found
                            if (titles.length === 0 && (emp as any).projectId) {
                              const projectTitle = projects.find((p) => 
                                String(p._id) === String((emp as any).projectId)
                              )?.title;
                              
                              if (projectTitle) titles.push(projectTitle);
                            }
                            
                            // Return formatted project list or "No project" message
                            return titles.length > 0 
                              ? `Projects: ${titles.join(', ')}` 
                              : 'No project';
                          })()}
                        </span>
                      </div>
                    </div>
                    {emp.status && (
                      <Badge variant={getStatusVariant(emp.status)} className="self-center md:self-auto shrink-0 text-xs">
                        {emp.status}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-4 space-y-3 text-center md:text-left">
                    {emp.email && (
                      <div className="flex items-center justify-center md:justify-start gap-3 text-sm group">
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
                      <div className="flex items-center justify-center md:justify-start gap-3 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{emp.phone}</span>
                      </div>
                    )}

                    {(emp.workType || typeof emp.salary === "number") && (
                      <div className="flex items-center justify-center md:justify-start gap-3 text-sm">
                        <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">
                          {emp.workType}
                          {emp.workType?.toLowerCase() === "shift" && (
                            <span className="ml-2 text-xs bg-secondary px-2 py-1 rounded">
                              {(typeof shiftData[emp._id]?.shifts === "number" ? shiftData[emp._id]!.shifts : 0)} shifts
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {/* other info blocks remain commented to preserve current UI */}
                  </div>

                  {/* Shift Management - Only for Shift-based employees */}
                  {(emp.workType || "").toLowerCase() === "shift" && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Today's Shifts:</span>
                          <Badge variant="outline" className="text-xs">
                            {typeof shiftData[emp._id]?.shifts === "number"
                              ? shiftData[emp._id]?.shifts
                              : (emp.shiftsWorked ?? 0)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={String(shiftData[emp._id]?.shifts ?? emp.shiftsWorked ?? 0)}
                            onValueChange={(value) => {
                              const v = Number.parseFloat(value)
                              setShiftData((prev) => ({
                                ...prev,
                                [emp._id]: {
                                  shifts: isNaN(v) ? 0 : v,
                                  perShiftSalary:
                                    typeof prev[emp._id]?.perShiftSalary === "number"
                                      ? prev[emp._id]!.perShiftSalary
                                      : typeof emp.salary === "number"
                                        ? emp.salary
                                        : 0,
                                },
                              }))
                            }}
                          >
                            <SelectTrigger className="w-24 h-8 text-xs bg-white hover:bg-gray-50">
                              <SelectValue placeholder="Shifts" />
                            </SelectTrigger>
                            <SelectContent>
                              {[0, 0.5, 1, 1.5, 2, 2.5, 3].map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                  {n}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            className="w-28 h-8 text-xs"
                            value={String(
                              typeof shiftData[emp._id]?.perShiftSalary === "number"
                                ? shiftData[emp._id]!.perShiftSalary
                                : typeof emp.salary === "number"
                                  ? emp.salary
                                  : 0,
                            )}
                            onChange={(e) => {
                              const v = Number.parseFloat(e.target.value)
                              setShiftData((prev) => ({
                                ...prev,
                                [emp._id]: {
                                  shifts:
                                    typeof prev[emp._id]?.shifts === "number" ? prev[emp._id]!.shifts : (emp.shiftsWorked ?? 0),
                                  perShiftSalary: isNaN(v) ? 0 : v,
                                },
                              }))
                            }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              saveShift(
                                emp._id,
                                typeof shiftData[emp._id]?.shifts === "number"
                                  ? shiftData[emp._id]!.shifts
                                  : (emp.shiftsWorked ?? 0),
                                typeof shiftData[emp._id]?.perShiftSalary === "number"
                                  ? shiftData[emp._id]!.perShiftSalary
                                  : typeof emp.salary === "number"
                                    ? emp.salary
                                    : 0,
                              )
                            }
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                      {typeof shiftData[emp._id]?.totalPay === "number" && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Total Pay: ₹{shiftData[emp._id]!.totalPay!.toFixed(2)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Daily Shift Selection - Only for Daily employees */}
                  {(emp.workType || "").toLowerCase() === "daily" && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-sm font-medium">Shifts Today (0–3, 0.5-step)</span>
                        <Select
                          value={String(typeof shiftData[emp._id]?.shifts === "number" ? shiftData[emp._id]!.shifts : 0)}
                          onValueChange={(val) => {
                            const num = Number.parseFloat(val)
                            const clamped = Math.max(0, Math.min(3, Math.round((isNaN(num) ? 0 : num) * 2) / 2))
                            const perShift =
                              typeof emp.salary === "number"
                                ? emp.salary
                                : typeof shiftData[emp._id]?.perShiftSalary === "number"
                                  ? shiftData[emp._id]!.perShiftSalary!
                                  : 0
                            setShiftData((prev) => ({
                              ...prev,
                              [emp._id]: {
                                shifts: clamped,
                                perShiftSalary: perShift,
                                totalPay: clamped * perShift,
                              },
                            }))
                            saveShift(emp._id, clamped, perShift)
                          }}
                        >
                          <SelectTrigger className="h-8 w-24 px-2 py-1">
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
                      <div className="mt-2 text-xs text-muted-foreground">
                        {/* Per Shift: ₹{(typeof emp.salary === "number" ? emp.salary : (typeof shiftData[emp._id]?.perShiftSalary === "number" ? shiftData[emp._id]!.perShiftSalary! : 0)).toFixed(2)} • Today's Pay: ₹{(((typeof shiftData[emp._id]?.shifts === "number" ? shiftData[emp._id]!.shifts : 0) * (typeof emp.salary === "number" ? emp.salary : (typeof shiftData[emp._id]?.perShiftSalary === "number" ? shiftData[emp._id]!.perShiftSalary! : 0))) || 0).toFixed(2)} */}
                      </div>
                    </div>
                  )}

                  {/* Attendance Management - Only for Monthly employees */}
                  {emp.workType === "Monthly" && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{"Today's Status:"}</span>
                          {(selectedProject ? attendanceData[`${selectedProject}_${emp._id}`]?.status : emp.attendance?.status) ? (
                            <Badge
                              variant={
                                (selectedProject ? attendanceData[`${selectedProject}_${emp._id}`]?.status : emp.attendance?.status) === "Present"
                                  ? "default"
                                  : (selectedProject ? attendanceData[`${selectedProject}_${emp._id}`]?.status : emp.attendance?.status) === "On Duty"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="text-xs"
                            >
                              {normalizeAttendanceStatus(selectedProject ? attendanceData[`${selectedProject}_${emp._id}`]?.status : emp.attendance?.status)}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Not Set
                            </Badge>
                          )}
                        </div>

                        <Select
                          value={(selectedProject ? attendanceData[`${selectedProject}_${emp._id}`]?.status : emp.attendance?.status) || ""}
                          onValueChange={(value) => handleAttendanceChange(emp._id, value as AttendanceStatus)}
                        >
                          <SelectTrigger
                            className={`w-32 h-8 text-xs ${(selectedProject ? attendanceData[`${selectedProject}_${emp._id}`]?.status : emp.attendance?.status) === "Present"
                                ? "bg-green-100 hover:bg-green-100/80"
                                : (selectedProject ? attendanceData[`${selectedProject}_${emp._id}`]?.status : emp.attendance?.status) === "Absent"
                                  ? "bg-red-100 hover:bg-red-100/80"
                                  : (selectedProject ? attendanceData[`${selectedProject}_${emp._id}`]?.status : emp.attendance?.status) === "On Duty"
                                    ? "bg-yellow-100 hover:bg-yellow-100/80"
                                    : "bg-white hover:bg-gray-50"
                              }`}
                          >
                            <SelectValue placeholder="Set Status" />
                          </SelectTrigger>
                          <SelectContent>
                            {attendanceOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <option.icon className="w-4 h-4" />
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {(selectedProject ? attendanceData[`${selectedProject}_${emp._id}`]?.checkIn : emp.attendance?.checkIn) && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {"Check-in: "}
                          {new Date(selectedProject ? (attendanceData[`${selectedProject}_${emp._id}`]?.checkIn as string) : (emp.attendance!.checkIn as string)).toLocaleTimeString()}
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
        </div>
      )}

      {selectedProject && filteredEmployees.length === 0 && !loading && !error && (
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

"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Package, CheckCircle, AlertTriangle, Loader2 } from "lucide-react"
import SupervisorReports from "@/components/management/supervisor-reports"
import ProjectsManagement from "@/components/management/supervisor-projects"
import MaterialsManagement from "@/components/management/materials-management"
import EmployeeManagement from "@/components/management/supervisor-employee"

export default function SupervisorDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [tasksError, setTasksError] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Array<{
    _id: string
    title: string
    status: "Pending" | "In Progress" | "Completed"
    priority: "Low" | "Medium" | "High"
    projectTitle?: string
  }>>([])
  const [statsLoading, setStatsLoading] = useState(false)
  const [stats, setStats] = useState({
    tasksCompleted: "0/0",
    materialsUsed: "0%",
    safetyIssues: "0",
  })

  const today = useMemo(() => {
    const d = new Date()
    // format as YYYY-MM-DD for API compatibility if needed
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  }, [])

  const loadStats = async () => {
    try {
      setStatsLoading(true)
      const supervisorId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
      const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null

      // Tasks completed: from loaded tasks state (fallback to fetching if empty)
      let tasksData = tasks
      if ((tasksData?.length ?? 0) === 0) {
        try {
          const supId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
          if (supId) {
            const res = await fetch(`/api/tasks?supervisorId=${encodeURIComponent(supId)}`, { cache: 'no-store' })
            if (res.ok) tasksData = await res.json()
          }
        } catch {}
      }
      const totalTasks = tasksData?.length || 0
      const completedTasks = (tasksData || []).filter((t: any) => t.status === 'Completed').length
      const tasksCompleted = `${completedTasks}/${totalTasks}`

      // Materials used: derive a percentage from material-requests status for this supervisor
      let materialsUsed = '0%'
      try {
        const supId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
        const mrUrl = supId && role === 'supervisor'
          ? `/api/material-requests?supervisorId=${encodeURIComponent(supId)}`
          : `/api/material-requests`
        const mrRes = await fetch(mrUrl, { cache: 'no-store' })
        if (mrRes.ok) {
          const items: any[] = await mrRes.json()
          const total = items.length
          const progressed = items.filter((m) => {
            const s = (m.status || '').toLowerCase()
            return s === 'approved' || s === 'completed' || s === 'issued' || s === 'delivered'
          }).length
          const pct = total > 0 ? Math.round((progressed / total) * 100) : 0
          materialsUsed = `${pct}%`
        }
      } catch {}

      // Safety issues: derive from tasks with High priority and not completed
      const issues = (tasksData || []).filter((t: any) => t.priority === 'High' && t.status !== 'Completed').length
      const safetyIssues = String(issues)

      setStats({ tasksCompleted, materialsUsed, safetyIssues })
    } finally {
      setStatsLoading(false)
    }
  }

  // Load tasks assigned to this supervisor
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoadingTasks(true)
        setTasksError(null)
        const supervisorId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
        const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null
        if (!supervisorId || role !== 'supervisor') {
          setTasks([])
          return
        }
        const res = await fetch(`/api/tasks?supervisorId=${encodeURIComponent(supervisorId)}`)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.message || 'Failed to load tasks')
        }
        const data = await res.json()
        const mapped = (data || []).map((t: any) => ({
          _id: t._id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          projectTitle: t.projectTitle || t.projectId?.title,
        }))
        setTasks(mapped)
      } catch (e: any) {
        setTasksError(e?.message || 'Failed to load tasks')
      } finally {
        setLoadingTasks(false)
      }
    }

    fetchTasks()
  }, [])

  // Load top stats once and whenever tasks change
  useEffect(() => {
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.length])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
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

  const renderContent = () => {
    switch (activeSection) {
      case "task":
        return <ProjectsManagement />
      case "employee":
        return <EmployeeManagement />
      // case "attendance":
      //   return <AttendanceManagement />
      case "reports":
        return <SupervisorReports />  
      case "materials":
        return <MaterialsManagement />
      default:
        return (
          <div className="space-y-6">
            {/* Today's Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {statsLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : stats.tasksCompleted}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Materials Used</CardTitle>
                  <Package className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {statsLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : stats.materialsUsed}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Safety Issues</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {statsLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : stats.safetyIssues}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Removed Daily Log and Attendance widgets from the dashboard view */}

            {/* Current Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Tasks</CardTitle>
                <CardDescription>Current task assignments and status</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTasks && (
                  <p className="text-sm text-muted-foreground">Loading tasks...</p>
                )}
                {tasksError && (
                  <p className="text-sm text-red-600">{tasksError}</p>
                )}
                {!loadingTasks && !tasksError && (
                  <div className="space-y-4">
                    {tasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No tasks assigned.</p>
                    ) : (
                      tasks.map((task) => (
                        <div key={task._id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{task.title}</h4>
                            {task.projectTitle && (
                              <p className="text-xs text-muted-foreground mb-2">Project: {task.projectTitle}</p>
                            )}
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                              <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setActiveSection("task")}>
                            Update
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions (Materials only) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Material Request
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Request additional materials</p>
                  <Button className="w-full" onClick={() => setActiveSection("materials")}>
                    Request Materials
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )
    }
  }

  return (
    <DashboardLayout userRole="supervisor" activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderContent()}
    </DashboardLayout>
  )
}

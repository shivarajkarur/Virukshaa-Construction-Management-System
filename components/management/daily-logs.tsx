"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import {
  Plus,
  Edit,
  Eye,
  Calendar,
  Search,
  Filter,
  ClipboardList,
  Camera,
  Users,
  Package,
  AlertTriangle,
  Cloud,
  FileText,
} from "lucide-react"

interface DailyLog {
  id: number
  date: string
  projectId: number
  projectName: string
  supervisor: string
  workProgress: string
  materialsUsed: string
  workersPresent: number
  totalWorkers: number
  safetyIssues: string
  weatherConditions: string
  photos: string[]
  nextDayPlan: string
  status: "Draft" | "Submitted" | "Approved"
}

export default function DailyLogsManagement() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [dateFilter, setDateFilter] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null)
  const [viewingLog, setViewingLog] = useState<DailyLog | null>(null)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    projectId: "",
    workProgress: "",
    materialsUsed: "",
    workersPresent: "",
    totalWorkers: "",
    safetyIssues: "",
    weatherConditions: "",
    nextDayPlan: "",
  })

  const projects = [
    { id: 1, name: "Downtown Office Complex" },
    { id: 2, name: "Residential Tower A" },
    { id: 3, name: "Industrial Warehouse" },
  ]

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      // Mock data for daily logs
      const mockLogs: DailyLog[] = [
        {
          id: 1,
          date: "2024-11-12",
          projectId: 1,
          projectName: "Downtown Office Complex",
          supervisor: "Mike Wilson",
          workProgress: "Foundation work completed for Block A. Started ground floor construction.",
          materialsUsed: "200 bags cement, 50 tons steel bars, 5000 bricks",
          workersPresent: 28,
          totalWorkers: 32,
          safetyIssues: "Minor cut on worker's hand - first aid provided",
          weatherConditions: "Sunny, 75°F",
          photos: ["progress1.jpg", "progress2.jpg", "progress3.jpg"],
          nextDayPlan: "Continue ground floor construction, install electrical conduits",
          status: "Submitted",
        },
        {
          id: 2,
          date: "2024-11-11",
          projectId: 1,
          projectName: "Downtown Office Complex",
          supervisor: "Mike Wilson",
          workProgress: "Continued foundation work. 80% complete.",
          materialsUsed: "150 bags cement, 30 tons steel bars, 3000 bricks",
          workersPresent: 30,
          totalWorkers: 32,
          safetyIssues: "None reported",
          weatherConditions: "Partly cloudy, 72°F",
          photos: ["day2_1.jpg", "day2_2.jpg"],
          nextDayPlan: "Complete foundation work, prepare for ground floor",
          status: "Approved",
        },
        {
          id: 3,
          date: "2024-11-10",
          projectId: 2,
          projectName: "Residential Tower A",
          supervisor: "Mike Wilson",
          workProgress: "Site preparation and excavation work started.",
          materialsUsed: "Fuel for excavators, safety equipment",
          workersPresent: 15,
          totalWorkers: 24,
          safetyIssues: "None reported",
          weatherConditions: "Clear, 68°F",
          photos: ["excavation1.jpg"],
          nextDayPlan: "Continue excavation, set up temporary facilities",
          status: "Draft",
        },
      ]
      setLogs(mockLogs)
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedProject = projects.find((p) => p.id === Number.parseInt(formData.projectId))
      const newLog: DailyLog = {
        id: logs.length + 1,
        date: formData.date,
        projectId: Number.parseInt(formData.projectId),
        projectName: selectedProject?.name || "",
        supervisor: "Mike Wilson", // Current supervisor
        workProgress: formData.workProgress,
        materialsUsed: formData.materialsUsed,
        workersPresent: Number.parseInt(formData.workersPresent),
        totalWorkers: Number.parseInt(formData.totalWorkers),
        safetyIssues: formData.safetyIssues,
        weatherConditions: formData.weatherConditions,
        photos: [],
        nextDayPlan: formData.nextDayPlan,
        status: "Draft",
      }

      if (editingLog) {
        setLogs(logs.map((log) => (log.id === editingLog.id ? { ...newLog, id: editingLog.id } : log)))
      } else {
        setLogs([newLog, ...logs])
      }

      setIsAddDialogOpen(false)
      setEditingLog(null)
      resetForm()
      toast({
        title: editingLog ? "Log Updated" : "Log Created",
        description: `Daily log has been ${editingLog ? "updated" : "created"} successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save log. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      projectId: "",
      workProgress: "",
      materialsUsed: "",
      workersPresent: "",
      totalWorkers: "",
      safetyIssues: "",
      weatherConditions: "",
      nextDayPlan: "",
    })
  }

  const openEditDialog = (log: DailyLog) => {
    setEditingLog(log)
    setFormData({
      date: log.date,
      projectId: log.projectId.toString(),
      workProgress: log.workProgress,
      materialsUsed: log.materialsUsed,
      workersPresent: log.workersPresent.toString(),
      totalWorkers: log.totalWorkers.toString(),
      safetyIssues: log.safetyIssues,
      weatherConditions: log.weatherConditions,
      nextDayPlan: log.nextDayPlan,
    })
    setIsAddDialogOpen(true)
  }

  const submitLog = (logId: number) => {
    setLogs(logs.map((log) => (log.id === logId ? { ...log, status: "Submitted" } : log)))
    toast({
      title: "Log Submitted",
      description: "Daily log has been submitted for approval.",
    })
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.workProgress.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "All" || log.status === statusFilter
    const matchesDate = !dateFilter || log.date === dateFilter
    return matchesSearch && matchesStatus && matchesDate
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800"
      case "Submitted":
        return "bg-blue-100 text-blue-800"
      case "Draft":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const stats = [
    {
      title: "Total Logs",
      value: logs.length.toString(),
      icon: ClipboardList,
      color: "text-blue-600",
    },
    {
      title: "This Week",
      value: logs
        .filter((log) => {
          const logDate = new Date(log.date)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return logDate >= weekAgo
        })
        .length.toString(),
      icon: Calendar,
      color: "text-green-600",
    },
    {
      title: "Pending Approval",
      value: logs.filter((log) => log.status === "Submitted").length.toString(),
      icon: FileText,
      color: "text-orange-600",
    },
    {
      title: "Draft Logs",
      value: logs.filter((log) => log.status === "Draft").length.toString(),
      icon: Edit,
      color: "text-purple-600",
    },
  ]

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading daily logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Daily Logs</h2>
          <p className="text-muted-foreground">Record and manage daily work progress logs</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              New Log Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLog ? "Edit Daily Log" : "Create Daily Log"}</DialogTitle>
              <DialogDescription>
                {editingLog ? "Update the daily work log entry" : "Record today's work progress and activities"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project *</Label>
                  <select
                    id="projectId"
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Select Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workProgress">Work Progress *</Label>
                <Textarea
                  id="workProgress"
                  value={formData.workProgress}
                  onChange={(e) => setFormData({ ...formData, workProgress: e.target.value })}
                  placeholder="Describe today's work progress and achievements..."
                  rows={3}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="materialsUsed">Materials Used</Label>
                <Textarea
                  id="materialsUsed"
                  value={formData.materialsUsed}
                  onChange={(e) => setFormData({ ...formData, materialsUsed: e.target.value })}
                  placeholder="List materials used and quantities..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workersPresent">Workers Present *</Label>
                  <Input
                    id="workersPresent"
                    type="number"
                    value={formData.workersPresent}
                    onChange={(e) => setFormData({ ...formData, workersPresent: e.target.value })}
                    placeholder="Number of workers present"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalWorkers">Total Workers *</Label>
                  <Input
                    id="totalWorkers"
                    type="number"
                    value={formData.totalWorkers}
                    onChange={(e) => setFormData({ ...formData, totalWorkers: e.target.value })}
                    placeholder="Total assigned workers"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weatherConditions">Weather Conditions</Label>
                <Input
                  id="weatherConditions"
                  value={formData.weatherConditions}
                  onChange={(e) => setFormData({ ...formData, weatherConditions: e.target.value })}
                  placeholder="e.g., Sunny, 75°F"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="safetyIssues">Safety Issues / Incidents</Label>
                <Textarea
                  id="safetyIssues"
                  value={formData.safetyIssues}
                  onChange={(e) => setFormData({ ...formData, safetyIssues: e.target.value })}
                  placeholder="Report any safety issues or incidents (write 'None' if no issues)..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextDayPlan">Next Day Plan</Label>
                <Textarea
                  id="nextDayPlan"
                  value={formData.nextDayPlan}
                  onChange={(e) => setFormData({ ...formData, nextDayPlan: e.target.value })}
                  placeholder="Outline tomorrow's planned activities..."
                  rows={2}
                />
              </div>
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline">
                  <Camera className="w-4 h-4 mr-2" />
                  Add Photos
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false)
                      setEditingLog(null)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : editingLog ? "Update Log" : "Save as Draft"}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-auto" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="All">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
          </select>
        </div>
        <Badge variant="secondary" className="self-center">
          {filteredLogs.length} Logs
        </Badge>
      </div>

      {/* Logs List */}
      <div className="space-y-4">
        {filteredLogs.map((log) => (
          <Card key={log.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{log.projectName}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(log.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {log.workersPresent}/{log.totalWorkers} Workers
                    </div>
                    {log.photos.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Camera className="w-4 h-4" />
                        {log.photos.length} Photos
                      </div>
                    )}
                  </div>
                </div>
                <Badge className={getStatusColor(log.status)}>{log.status}</Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">Work Progress:</h4>
                  <p className="text-sm text-muted-foreground">{log.workProgress}</p>
                </div>
                {log.materialsUsed && (
                  <div>
                    <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      Materials Used:
                    </h4>
                    <p className="text-sm text-muted-foreground">{log.materialsUsed}</p>
                  </div>
                )}
                {log.safetyIssues && (
                  <div>
                    <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Safety Issues:
                    </h4>
                    <p className="text-sm text-muted-foreground">{log.safetyIssues}</p>
                  </div>
                )}
                {log.weatherConditions && (
                  <div>
                    <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                      <Cloud className="w-4 h-4" />
                      Weather:
                    </h4>
                    <p className="text-sm text-muted-foreground">{log.weatherConditions}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewingLog(log)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
                {log.status === "Draft" && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(log)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button size="sm" onClick={() => submitLog(log.id)}>
                      Submit for Approval
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Log Dialog */}
      <Dialog open={!!viewingLog} onOpenChange={() => setViewingLog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Daily Log Details</DialogTitle>
            <DialogDescription>
              {viewingLog && `${viewingLog.projectName} - ${new Date(viewingLog.date).toLocaleDateString()}`}
            </DialogDescription>
          </DialogHeader>
          {viewingLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">Date:</h4>
                  <p className="text-sm">{new Date(viewingLog.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Status:</h4>
                  <Badge className={getStatusColor(viewingLog.status)}>{viewingLog.status}</Badge>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Work Progress:</h4>
                <p className="text-sm text-muted-foreground">{viewingLog.workProgress}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Materials Used:</h4>
                <p className="text-sm text-muted-foreground">{viewingLog.materialsUsed || "None specified"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">Workers Present:</h4>
                  <p className="text-sm">
                    {viewingLog.workersPresent} / {viewingLog.totalWorkers}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Weather:</h4>
                  <p className="text-sm">{viewingLog.weatherConditions || "Not specified"}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Safety Issues:</h4>
                <p className="text-sm text-muted-foreground">{viewingLog.safetyIssues || "None reported"}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Next Day Plan:</h4>
                <p className="text-sm text-muted-foreground">{viewingLog.nextDayPlan || "Not specified"}</p>
              </div>
              {viewingLog.photos.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Photos:</h4>
                  <div className="flex gap-2">
                    {viewingLog.photos.map((photo, index) => (
                      <Badge key={index} variant="outline">
                        {photo}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {filteredLogs.length === 0 && (
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No logs found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== "All" || dateFilter
              ? "Try adjusting your search or filter criteria"
              : "Start by creating your first daily log entry"}
          </p>
          {!searchTerm && statusFilter === "All" && !dateFilter && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Log
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

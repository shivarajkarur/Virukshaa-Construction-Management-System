"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Users, UserCheck, UserX, Clock, Calendar, Search, Filter, Plus, Save, Eye, Download } from "lucide-react"

interface Worker {
  id: number
  name: string
  role: string
  department: string
  avatar?: string
}

interface AttendanceRecord {
  id: number
  date: string
  projectId: number
  projectName: string
  workers: {
    workerId: number
    workerName: string
    status: "Present" | "Absent" | "Late" | "Half Day"
    checkIn?: string
    checkOut?: string
    notes?: string
  }[]
  totalWorkers: number
  presentWorkers: number
  supervisor: string
}

export default function AttendanceManagement() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [projectFilter, setProjectFilter] = useState("All")
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedProject, setSelectedProject] = useState("")
  const [currentAttendance, setCurrentAttendance] = useState<{ [key: number]: string }>({})
  const [viewingRecord, setViewingRecord] = useState<AttendanceRecord | null>(null)
  const [loading, setLoading] = useState(true)

  const projects = [
    { id: 1, name: "Downtown Office Complex" },
    { id: 2, name: "Residential Tower A" },
    { id: 3, name: "Industrial Warehouse" },
  ]

  useEffect(() => {
    fetchAttendanceRecords()
    fetchWorkers()
  }, [])

  const fetchAttendanceRecords = async () => {
    try {
      // Mock attendance data
      const mockRecords: AttendanceRecord[] = [
        {
          id: 1,
          date: "2024-11-12",
          projectId: 1,
          projectName: "Downtown Office Complex",
          workers: [
            {
              workerId: 1,
              workerName: "John Doe",
              status: "Present",
              checkIn: "08:00",
              checkOut: "17:00",
            },
            {
              workerId: 2,
              workerName: "Jane Smith",
              status: "Present",
              checkIn: "08:15",
              checkOut: "17:15",
            },
            {
              workerId: 3,
              workerName: "Bob Johnson",
              status: "Absent",
            },
            {
              workerId: 4,
              workerName: "Alice Brown",
              status: "Late",
              checkIn: "08:45",
              checkOut: "17:30",
              notes: "Traffic delay",
            },
          ],
          totalWorkers: 4,
          presentWorkers: 3,
          supervisor: "Mike Wilson",
        },
        {
          id: 2,
          date: "2024-11-11",
          projectId: 1,
          projectName: "Downtown Office Complex",
          workers: [
            {
              workerId: 1,
              workerName: "John Doe",
              status: "Present",
              checkIn: "07:55",
              checkOut: "17:05",
            },
            {
              workerId: 2,
              workerName: "Jane Smith",
              status: "Present",
              checkIn: "08:00",
              checkOut: "17:00",
            },
            {
              workerId: 3,
              workerName: "Bob Johnson",
              status: "Present",
              checkIn: "08:10",
              checkOut: "17:10",
            },
            {
              workerId: 4,
              workerName: "Alice Brown",
              status: "Half Day",
              checkIn: "08:00",
              checkOut: "12:00",
              notes: "Medical appointment",
            },
          ],
          totalWorkers: 4,
          presentWorkers: 4,
          supervisor: "Mike Wilson",
        },
      ]
      setAttendanceRecords(mockRecords)
    } catch (error) {
      console.error("Error fetching attendance records:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkers = async () => {
    try {
      // Mock workers data
      const mockWorkers: Worker[] = [
        { id: 1, name: "John Doe", role: "Mason", department: "Construction" },
        { id: 2, name: "Jane Smith", role: "Carpenter", department: "Construction" },
        { id: 3, name: "Bob Johnson", role: "Electrician", department: "Electrical" },
        { id: 4, name: "Alice Brown", role: "Plumber", department: "Plumbing" },
        { id: 5, name: "Charlie Wilson", role: "Heavy Equipment Operator", department: "Operations" },
        { id: 6, name: "Diana Martinez", role: "Safety Inspector", department: "Safety" },
      ]
      setWorkers(mockWorkers)
    } catch (error) {
      console.error("Error fetching workers:", error)
    }
  }

  const handleMarkAttendance = async () => {
    if (!selectedProject) {
      toast({
        title: "Error",
        description: "Please select a project first.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const project = projects.find((p) => p.id === Number.parseInt(selectedProject))
      const attendanceData = workers.map((worker) => ({
        workerId: worker.id,
        workerName: worker.name,
        status: (currentAttendance[worker.id] || "Absent") as "Present" | "Absent" | "Late" | "Half Day",
        checkIn: currentAttendance[worker.id] === "Present" ? "08:00" : undefined,
        checkOut: currentAttendance[worker.id] === "Present" ? "17:00" : undefined,
      }))

      const newRecord: AttendanceRecord = {
        id: attendanceRecords.length + 1,
        date: selectedDate,
        projectId: Number.parseInt(selectedProject),
        projectName: project?.name || "",
        workers: attendanceData,
        totalWorkers: workers.length,
        presentWorkers: attendanceData.filter((w) => w.status === "Present" || w.status === "Late").length,
        supervisor: "Mike Wilson",
      }

      setAttendanceRecords([newRecord, ...attendanceRecords])
      setIsMarkingAttendance(false)
      setCurrentAttendance({})
      setSelectedProject("")

      toast({
        title: "Attendance Marked",
        description: `Attendance for ${selectedDate} has been recorded successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark attendance. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesSearch = record.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDate = !dateFilter || record.date === dateFilter
    const matchesProject = projectFilter === "All" || record.projectId === Number.parseInt(projectFilter)
    return matchesSearch && matchesDate && matchesProject
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-800"
      case "Late":
        return "bg-yellow-100 text-yellow-800"
      case "Half Day":
        return "bg-blue-100 text-blue-800"
      case "Absent":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Present":
        return <UserCheck className="w-4 h-4" />
      case "Late":
        return <Clock className="w-4 h-4" />
      case "Half Day":
        return <Clock className="w-4 h-4" />
      case "Absent":
        return <UserX className="w-4 h-4" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  const stats = [
    {
      title: "Total Records",
      value: attendanceRecords.length.toString(),
      icon: Calendar,
      color: "text-blue-600",
    },
    {
      title: "This Week",
      value: attendanceRecords
        .filter((record) => {
          const recordDate = new Date(record.date)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return recordDate >= weekAgo
        })
        .length.toString(),
      icon: Clock,
      color: "text-green-600",
    },
    {
      title: "Avg. Attendance",
      value:
        attendanceRecords.length > 0
          ? `${Math.round(
              attendanceRecords.reduce((sum, record) => sum + (record.presentWorkers / record.totalWorkers) * 100, 0) /
                attendanceRecords.length,
            )}%`
          : "0%",
      icon: UserCheck,
      color: "text-purple-600",
    },
    {
      title: "Today's Present",
      value: (() => {
        const today = new Date().toISOString().split("T")[0]
        const todayRecord = attendanceRecords.find((r) => r.date === today)
        return todayRecord ? `${todayRecord.presentWorkers}/${todayRecord.totalWorkers}` : "0/0"
      })(),
      icon: Users,
      color: "text-orange-600",
    },
  ]

  if (loading && attendanceRecords.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading attendance records...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Attendance Management</h2>
          <p className="text-muted-foreground">Track and manage worker attendance records</p>
        </div>
        <Dialog open={isMarkingAttendance} onOpenChange={setIsMarkingAttendance}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Mark Attendance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Mark Daily Attendance</DialogTitle>
              <DialogDescription>Record worker attendance for the selected date and project</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="attendanceDate" className="text-sm font-medium">
                    Date *
                  </label>
                  <Input
                    id="attendanceDate"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="attendanceProject" className="text-sm font-medium">
                    Project *
                  </label>
                  <select
                    id="attendanceProject"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
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

              <div className="space-y-4">
                <h3 className="font-medium">Worker Attendance</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {workers.map((worker) => (
                    <div key={worker.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={worker.avatar || "/placeholder.svg"} alt={worker.name} />
                          <AvatarFallback>
                            {worker.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{worker.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {worker.role} - {worker.department}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {["Present", "Late", "Half Day", "Absent"].map((status) => (
                          <label key={status} className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name={`worker-${worker.id}`}
                              value={status}
                              checked={currentAttendance[worker.id] === status}
                              onChange={(e) =>
                                setCurrentAttendance({
                                  ...currentAttendance,
                                  [worker.id]: e.target.value,
                                })
                              }
                              className="sr-only"
                            />
                            <Badge
                              className={`cursor-pointer ${
                                currentAttendance[worker.id] === status
                                  ? getStatusColor(status)
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {getStatusIcon(status)}
                              <span className="ml-1 text-xs">{status}</span>
                            </Badge>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsMarkingAttendance(false)
                    setCurrentAttendance({})
                    setSelectedProject("")
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleMarkAttendance} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : "Save Attendance"}
                </Button>
              </div>
            </div>
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
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-auto" />
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="All">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        <Badge variant="secondary" className="self-center">
          {filteredRecords.length} Records
        </Badge>
      </div>

      {/* Attendance Records */}
      <div className="space-y-4">
        {filteredRecords.map((record) => (
          <Card key={record.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{record.projectName}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(record.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {record.presentWorkers}/{record.totalWorkers} Present
                    </div>
                    <div className="flex items-center gap-1">
                      <UserCheck className="w-4 h-4" />
                      {Math.round((record.presentWorkers / record.totalWorkers) * 100)}% Attendance
                    </div>
                  </div>
                </div>
                <Badge
                  className={
                    record.presentWorkers / record.totalWorkers >= 0.9
                      ? "bg-green-100 text-green-800"
                      : record.presentWorkers / record.totalWorkers >= 0.7
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }
                >
                  {Math.round((record.presentWorkers / record.totalWorkers) * 100)}% Attendance
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex flex-wrap gap-2">
                  {record.workers.slice(0, 6).map((worker) => (
                    <div key={worker.workerId} className="flex items-center gap-2 p-2 border rounded-lg">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {worker.workerName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{worker.workerName}</span>
                      <Badge className={getStatusColor(worker.status)} size="sm">
                        {getStatusIcon(worker.status)}
                        <span className="ml-1">{worker.status}</span>
                      </Badge>
                    </div>
                  ))}
                  {record.workers.length > 6 && (
                    <div className="flex items-center justify-center p-2 border rounded-lg text-sm text-muted-foreground">
                      +{record.workers.length - 6} more
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewingRecord(record)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Record Dialog */}
      <Dialog open={!!viewingRecord} onOpenChange={() => setViewingRecord(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
            <DialogDescription>
              {viewingRecord && `${viewingRecord.projectName} - ${new Date(viewingRecord.date).toLocaleDateString()}`}
            </DialogDescription>
          </DialogHeader>
          {viewingRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{viewingRecord.presentWorkers}</div>
                  <div className="text-sm text-muted-foreground">Present</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {viewingRecord.totalWorkers - viewingRecord.presentWorkers}
                  </div>
                  <div className="text-sm text-muted-foreground">Absent</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round((viewingRecord.presentWorkers / viewingRecord.totalWorkers) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Attendance Rate</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Worker Details</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {viewingRecord.workers.map((worker) => (
                    <div key={worker.workerId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {worker.workerName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h5 className="font-medium">{worker.workerName}</h5>
                          {worker.notes && <p className="text-xs text-muted-foreground">{worker.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {worker.checkIn && (
                          <div className="text-xs text-muted-foreground">
                            In: {worker.checkIn} {worker.checkOut && `| Out: ${worker.checkOut}`}
                          </div>
                        )}
                        <Badge className={getStatusColor(worker.status)}>
                          {getStatusIcon(worker.status)}
                          <span className="ml-1">{worker.status}</span>
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {filteredRecords.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No attendance records found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || dateFilter || projectFilter !== "All"
              ? "Try adjusting your search or filter criteria"
              : "Start by marking attendance for your workers"}
          </p>
          {!searchTerm && !dateFilter && projectFilter === "All" && (
            <Button onClick={() => setIsMarkingAttendance(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Mark First Attendance
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

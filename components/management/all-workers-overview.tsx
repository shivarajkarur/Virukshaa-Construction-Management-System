"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Users,
  UserCheck,
  Truck,
  Search,
  Filter,
  Download,
  Eye,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Briefcase,
  Award,
} from "lucide-react"

interface Worker {
  id: number
  name: string
  email: string
  phone: string
  type: "Supervisor" | "Employee" | "Supplier"
  role?: string
  department?: string
  location?: string
  status: "Active" | "On Leave" | "Inactive" | "Pending"
  joinDate: string
  avatar?: string
  projects?: number
  experience?: string
  category?: string
  rating?: number
  supervisor?: string
  salary?: string
}

export default function AllWorkersOverview() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllWorkers()
  }, [])

  const fetchAllWorkers = async () => {
    try {
      // Fetch data from all endpoints
      const [supervisorsRes, employeesRes, suppliersRes] = await Promise.all([
        fetch("/api/supervisors"),
        fetch("/api/employees"),
        fetch("/api/suppliers"),
      ])

      const [supervisors, employees, suppliers] = await Promise.all([
        supervisorsRes.json(),
        employeesRes.json(),
        suppliersRes.json(),
      ])

      // Combine and format data
      const allWorkers: Worker[] = [
        ...supervisors.map((s: any) => ({
          ...s,
          type: "Supervisor" as const,
          role: "Supervisor",
        })),
        ...employees.map((e: any) => ({
          ...e,
          type: "Employee" as const,
        })),
        ...suppliers.map((s: any) => ({
          ...s,
          type: "Supplier" as const,
          role: "Supplier",
        })),
      ]

      setWorkers(allWorkers)
    } catch (error) {
      console.error("Error fetching workers:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredWorkers = workers.filter((worker) => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = (
      (worker.name && worker.name.toLowerCase().includes(searchTermLower)) ||
      (worker.email && worker.email.toLowerCase().includes(searchTermLower)) ||
      (worker.role && worker.role.toLowerCase().includes(searchTermLower)) ||
      (worker.department && worker.department.toLowerCase().includes(searchTermLower))
    );
    const matchesType = typeFilter === "All" || worker.type === typeFilter
    const matchesStatus = statusFilter === "All" || worker.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "On Leave":
        return "bg-yellow-100 text-yellow-800"
      case "Pending":
        return "bg-blue-100 text-blue-800"
      case "Inactive":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Supervisor":
        return "bg-purple-100 text-purple-800"
      case "Employee":
        return "bg-blue-100 text-blue-800"
      case "Supplier":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Supervisor":
        return <UserCheck className="w-4 h-4" />
      case "Employee":
        return <Users className="w-4 h-4" />
      case "Supplier":
        return <Truck className="w-4 h-4" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  const stats = [
    {
      title: "Total Workers",
      value: workers.length.toString(),
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Supervisors",
      value: workers.filter((w) => w.type === "Supervisor").length.toString(),
      icon: UserCheck,
      color: "text-purple-600",
    },
    {
      title: "Employees",
      value: workers.filter((w) => w.type === "Employee").length.toString(),
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Suppliers",
      value: workers.filter((w) => w.type === "Supplier").length.toString(),
      icon: Truck,
      color: "text-orange-600",
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading workforce data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">All Workers Overview</h2>
          <p className="text-muted-foreground">Complete workforce management and overview</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}>
            <Eye className="w-4 h-4 mr-2" />
            {viewMode === "grid" ? "Table View" : "Grid View"}
          </Button>
        </div>
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
            placeholder="Search all workers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="p-2 border rounded-md">
            <option value="All">All Types</option>
            <option value="Supervisor">Supervisors</option>
            <option value="Employee">Employees</option>
            <option value="Supplier">Suppliers</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <Badge variant="secondary" className="self-center">
          {filteredWorkers.length} Total
        </Badge>
      </div>

      {/* Content */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "grid" | "table")}>
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkers.map((worker) => (
              <Card key={`${worker.type}-${worker.id}`} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={worker.avatar || "/placeholder.svg"} alt={worker.name} />
                        <AvatarFallback>
                          {worker.name ? worker.name.split(" ").map((n) => n[0]).join("") : '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{worker.name}</h3>
                        <p className="text-sm text-muted-foreground">{worker.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={getTypeColor(worker.type)}>{worker.type}</Badge>
                      <Badge className={getStatusColor(worker.status)}>{worker.status}</Badge>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{worker.phone}</span>
                    </div>
                    {worker.role && (
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <span>{worker.role}</span>
                      </div>
                    )}
                    {worker.department && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{worker.department}</span>
                      </div>
                    )}
                    {worker.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{worker.location}</span>
                      </div>
                    )}
                    {worker.supervisor && (
                      <div className="flex items-center gap-2 text-sm">
                        <UserCheck className="w-4 h-4 text-muted-foreground" />
                        <span>Supervisor: {worker.supervisor}</span>
                      </div>
                    )}
                    {worker.salary && (
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        <span>{worker.salary}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>Joined: {new Date(worker.joinDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Mail className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="table" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workers Directory</CardTitle>
              <CardDescription>Complete list of all workers in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Role/Position</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkers.map((worker) => (
                    <TableRow key={`${worker.type}-${worker.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={worker.avatar || "/placeholder.svg"} alt={worker.name} />
                            <AvatarFallback>
                              {worker.name ? worker.name.split(" ").map((n) => n[0]).join("") : '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{worker.name}</div>
                            <div className="text-sm text-muted-foreground">{worker.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(worker.type)}>   
                          <span className="flex items-center gap-1">
                            {getTypeIcon(worker.type)}   
                            {worker.type}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>{worker.role || "-"}</TableCell>
                      <TableCell>{worker.department || worker.category || "-"}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(worker.status)}>{worker.status}</Badge>
                      </TableCell>
                      <TableCell>{worker.phone}</TableCell>
                      <TableCell>{new Date(worker.joinDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Mail className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {filteredWorkers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No workers found</h3>
          <p className="text-muted-foreground">
            {searchTerm || typeFilter !== "All" || statusFilter !== "All"
              ? "Try adjusting your search or filter criteria"
              : "No workers have been added to the system yet"}
          </p>
        </div>
      )}
    </div>
  )
}

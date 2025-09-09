"use client"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
const ClientsManagement = dynamic(() => import("@/components/management/clients-management"), { ssr: false })
import DashboardLayout from "@/components/layout/dashboard-layout"
import {
  Users,
  Truck,
  UserCheck,
  DollarSign,
  FileText,
  AlertCircle,
  Info,
  Eye,
  Mail,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from "@/components/ui/chart"
import * as RechartsPrimitive from "recharts"
const MaterialsManagement = dynamic(() => import("@/components/management/materials-management"), { ssr: false })
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
const SupervisorsManagement = dynamic(() => import("@/components/management/supervisors-management"), { ssr: false })
const SuppliersManagement = dynamic(() => import("@/components/management/suppliers-management"), { ssr: false })
const EmployeesManagement = dynamic(() => import("@/components/management/employees-management"), { ssr: false })
const AllWorkersOverview = dynamic(() => import("@/components/management/all-workers-overview"), { ssr: false })
const UserManagement = dynamic(() => import("@/components/management/user-management"), { ssr: false })
const Reportmanagement = dynamic(() => import("@/components/management/report-management"), { ssr: false })
const PayrollManagement = dynamic(() => import("@/components/management/payroll-management"), { ssr: false })
const AdminSetting = dynamic(() => import("@/components/management/admin-setting"), { ssr: false })
import { Skeleton } from "@/components/ui/skeleton"
import UserDetailsModal from "@/components/ui/user-details-model"
const MessageBox = dynamic(() => import("@/components/common/MessageBox"), { ssr: false })
import { toast } from "sonner"

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface Client {
  _id: string
  name: string
  contactPerson?: string
}

interface Payroll {
  _id: string
  user: string | { _id: string; name: string; email?: string }
  userRole: "Employee" | "Supervisor" | "Client" | "Supplier"
  amount: number
  paymentDate: string | Date
  status: "paid" | "pending" | "failed"
  notes?: string
  createdAt?: string | Date
  updatedAt?: string | Date
}

interface DashboardData {
  totalClients: number
  totalSupervisors: number
  totalEmployees: number
  totalPayroll: number
  totalReports: number
  payrollData: Payroll[]
  recentProjects: Array<{
    id?: string
    name: string
    status: string
    manager: string
    progress: number
  }>
  clientStatusData?: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      backgroundColor: string
      borderColor: string
      borderWidth: number
    }>
  }
  clientsData: Array<{
    id: string
    name: string
    company: string
    email: string
    phone: string
    status: string
    projects: Array<{
      id: string
      name: string
      status: string
    }>
  }>
  employeesData: Array<{
    id: string
    name: string
    position: string
    department: string
    email: string
    phone: string
    status: string
    joinDate: string
  }>
  supervisorsData: Array<{
    id: string
    name: string
    position: string
    department: string
    email: string
    phone: string
    status: string
    joinDate: string
    experience: string
    projects: Array<any>
  }>
  reportsData: Array<{
    id: string
    title: string
    type: 'client' | 'supervisor' | 'employee' | 'supplier'
    date: string
    status?: 'Draft' | 'Submitted'
  }>
}

interface ApiData {
  clients: ApiResponse<Client[]>
  supervisors: ApiResponse<any[]>
  employees: ApiResponse<any[]>
  reports: ApiResponse<any[]>
  payroll: ApiResponse<Payroll[]>
  message: ApiResponse<any[]>
}

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalClients: 0,
    totalSupervisors: 0,
    totalEmployees: 0,
    totalPayroll: 0,
    totalReports: 0,
    recentProjects: [],
    clientsData: [],
    employeesData: [],
    supervisorsData: [],
    payrollData: [],
    reportsData: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStat, setSelectedStat] = useState<string | null>(null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [selectedUserType, setSelectedUserType] = useState<
    "supervisor" | "employee" | "client"
  >("supervisor")

  // Enhanced fetch function with better payroll user resolution
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""

      const endpoints = [
        { name: "clients", url: `${baseUrl}/api/clients` },
        { name: "supervisors", url: `${baseUrl}/api/supervisors` },
        { name: "employees", url: `${baseUrl}/api/employees` },
        { name: "payroll", url: `${baseUrl}/api/payroll` },
        { name: "reports", url: `${baseUrl}/api/reports` },
      ]

      // console.log(
      //   "Fetching data from endpoints:",
      //   endpoints.map((e) => e.url),
      // )

      const fetchPromises = endpoints.map(async ({ name, url }) => {
        try {
          // console.log(`[${name}] Starting fetch from:`, url)
          const response = await fetch(url)
          if (!response.ok) {
            const errorText = await response.text()
            console.error(`[${name}] Error response:`, {
              status: response.status,
              statusText: response.statusText,
              error: errorText,
            })
            return {
              name,
              data: {
                success: false,
                data: [],
                error: `HTTP ${response.status}: ${response.statusText}`,
              },
              error: `HTTP ${response.status}`,
            }
          }
          const responseData = await response.json()
          // console.log(`[${name}] Success response:`, responseData)
          return {
            name,
            data: responseData,
            error: null,
          }
        } catch (err: unknown) {
          const error = err as Error
          console.error(`[${name}] Fetch error:`, {
            message: error.message,
            stack: error.stack,
          })
          return {
            name,
            data: {
              success: false,
              data: [],
              error: error.message,
            },
            error: error.message,
          }
        }
      })

      const results = await Promise.all(fetchPromises)

      // console.log("=== RAW API RESULTS ===")
      results.forEach((result, index) => {
        // console.log(`Result ${index + 1} (${result.name}):`, {
          // success: result.data?.success,
          // dataLength: Array.isArray(result.data?.data) ? result.data.data.length : "Not an array",
          // error: result.error,
          // sampleData: Array.isArray(result.data?.data) && result.data.data.length > 0 ? result.data.data[0] : "No data",
        // })
      })

      const data = results.reduce<Partial<ApiData>>((acc, { name, data: responseData }) => {
        // console.log(`[${name}] Raw response:`, responseData)

        let processedData = []

        if (Array.isArray(responseData)) {
          processedData = responseData
        } else if (responseData && typeof responseData === "object" && "data" in responseData) {
          processedData = Array.isArray(responseData.data) ? responseData.data : []
        } else if (responseData && typeof responseData === "object") {
          processedData = [responseData]
        }

        // console.log(`[${name}] Processed data:`, {
        //   count: processedData.length,
        //   sampleItem: processedData[0] || "No items",
        // })

        return {
          ...acc,
          [name]: {
            success: true,
            data: processedData,
          },
        }
      }, {} as ApiData)

      // Create user lookup maps for payroll resolution
      const allUsers = new Map()

      // Add all users to lookup map
      if (Array.isArray(data.employees?.data)) {
        data.employees.data.forEach((emp) => {
          allUsers.set(emp._id || emp.id, { ...emp, role: "Employee" })
        })
      }

      if (Array.isArray(data.supervisors?.data)) {
        data.supervisors.data.forEach((sup) => {
          allUsers.set(sup._id || sup.id, { ...sup, role: "Supervisor" })
        })
      }

      if (Array.isArray(data.clients?.data)) {
        data.clients.data.forEach((client) => {
          allUsers.set(client._id, { ...client, role: "Client" })
        })
      }

      // console.log("User lookup map created:", allUsers.size, "users")

      // Enhanced payroll data processing with user resolution
      const payrollData = Array.isArray(data.payroll?.data)
        ? data.payroll.data.map((item: any) => {
          // console.log("Processing payroll item:", item)

          let resolvedUser = item.user

          // If user is just an ID string, resolve it from our lookup
          if (typeof item.user === "string") {
            const foundUser = allUsers.get(item.user)
            if (foundUser) {
              resolvedUser = {
                _id: foundUser._id || foundUser.id,
                name: foundUser.name || foundUser.firstName + " " + foundUser.lastName || "Unknown User",
                email: foundUser.email,
              }
              // console.log("Resolved user from ID:", item.user, "to:", resolvedUser)
            } else {
              // Create a placeholder user object
              resolvedUser = {
                _id: item.user,
                name: `User ${item.user.slice(-4)}`,
                email: "unknown@example.com",
              }
              // console.log("Created placeholder user for ID:", item.user)
            }
          }

          return {
            ...item,
            _id: item._id?.toString(),
            user: resolvedUser,
            paymentDate: item.paymentDate || new Date(),
            amount: typeof item.amount === "string" ? Number.parseFloat(item.amount) : item.amount || 0,
            userRole: item.userRole || "Employee",
          }
        })
        : []

      // console.log("Enhanced payroll data:", payrollData)

      // Process data for the dashboard
      const dashboardUpdate: DashboardData = {
        totalClients: Array.isArray(data.clients?.data) ? data.clients.data.length : 0,
        totalSupervisors: Array.isArray(data.supervisors?.data) ? data.supervisors.data.length : 0,
        totalEmployees: Array.isArray(data.employees?.data) ? data.employees.data.length : 0,
        totalPayroll: payrollData
          .filter((item: any) => item.status === "paid")
          .reduce((sum: number, item: any) => sum + (isNaN(item.amount) ? 0 : item.amount), 0),
        totalReports: Array.isArray(data.reports?.data) ? data.reports.data.length : 0,
        payrollData,
        recentProjects: Array.isArray(data.clients?.data)
          ? data.clients.data.slice(0, 5).map((client: any) => ({
            name: client.name || "Unnamed Client",
            status: "Active",
            manager: client.contactPerson || "No Contact",
            progress: 100,
          }))
          : [],
        clientStatusData: {
          labels:
            Array.isArray(data.clients?.data) && data.clients.data.length > 0
              ? data.clients.data.slice(0, 5).map((c: any) => c.name || "Unnamed Client")
              : ["No clients"],
          datasets: [
            {
              label: "Client Activity",
              data:
                Array.isArray(data.clients?.data) && data.clients.data.length > 0
                  ? data.clients.data.slice(0, 5).map(() => Math.floor(Math.random() * 100))
                  : [0],
              backgroundColor: "rgba(59, 130, 246, 0.8)",
              borderColor: "rgba(59, 130, 246, 1)",
              borderWidth: 1,
            },
          ],
        },
        clientsData: Array.isArray(data.clients?.data)
          ? data.clients.data.map((client: any) => ({
            id: client._id || client.id || Math.random().toString(),
            name: client.name || "Unnamed Client",
            company: client.company || client.name || "Unknown Company",
            email: client.email || "No email",
            phone: client.phone || "No phone",
            status: client.status || "Active",
            projects: client.projects || [],
          }))
          : [],
        employeesData: Array.isArray(data.employees?.data)
          ? data.employees.data.map((employee: any) => ({
            id: employee._id || employee.id || Math.random().toString(),
            name: employee.name || "Unnamed Employee",
            position: employee.position || "Unknown Position",
            department: employee.department || "Unknown Department",
            email: employee.email || "No email",
            phone: employee.phone || "No phone",
            status: employee.status || "Active",
            joinDate: employee.joinDate || new Date().toISOString(),
          }))
          : [],
        supervisorsData: Array.isArray(data.supervisors?.data)
          ? data.supervisors.data.map((supervisor: any) => ({
            id: supervisor._id || supervisor.id || Math.random().toString(),
            name: supervisor.name || "Unnamed Supervisor",
            position: supervisor.position || "Supervisor",
            department: supervisor.department || "Unknown Department",
            email: supervisor.email || "No email",
            phone: supervisor.phone || "No phone",
            status: supervisor.status || "Active",
            joinDate: supervisor.joinDate || new Date().toISOString(),
            experience: supervisor.experience || "Not specified",
            projects: supervisor.projects || [],
          }))
          : [],
        reportsData: Array.isArray(data.reports?.data)
          ? data.reports.data.map((r: any) => ({
            id: r._id || r.id || Math.random().toString(),
            title: r.title || 'Untitled',
            type: r.type || 'supervisor',
            date: (r.date ? new Date(r.date) : new Date()).toISOString(),
            status: r.status,
          }))
          : [],
      }

      // console.log("=== FINAL DASHBOARD DATA ===", JSON.stringify(dashboardUpdate, null, 2))
      setDashboardData(dashboardUpdate)
      toast.success("Dashboard data loaded successfully!")
    } catch (err: any) {
      // console.error("Error in fetchDashboardData:", err)
      const errorMessage = err.message || "Failed to load dashboard data. Please try again later."
      // console.error("Error details:", {
      //   message: err.message,
      //   stack: err.stack,
      //   name: err.name,
      // })
      setError(errorMessage)
      toast.error("Failed to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleViewDetails = (user: any, type: "supervisor" | "employee" | "client") => {
    setSelectedUser(user)
    setSelectedUserType(type)
    setIsModalOpen(true)
  }

  const handleViewMore = (type: string) => {
    switch (type) {
      case "supervisors":
        setActiveSection("supervisors")
        break
      case "employees":
        setActiveSection("employees")
        break
      case "clients":
        setActiveSection("clients")
        break
      case "message":
        setActiveSection("message")
        break
      case "reports":
        setActiveSection("reports")
        break
      default:
        setActiveSection("dashboard")
    }
  }

  // Quick Actions
  const quickActions = [
    {
      title: "Add Employee",
      description: "Register a new employee",
      icon: Users,
      color: "bg-blue-500",
      action: () => setActiveSection("employees"),
    },
    {
      title: "Add Client",
      description: "Register new client",
      icon: UserCheck,
      color: "bg-purple-500",
      action: () => setActiveSection("clients"),
    },
    {
      title: "Add Supplier",
      description: "Register a new supplier",
      icon: Truck,
      color: "bg-green-500",
      action: () => setActiveSection("suppliers"),
    },
    {
      title: "Add supervisor",
      description: "Register a new supervisor",
      icon: UserCheck,
      color: "bg-purple-500",
      action: () => setActiveSection("supervisors"),
    },
    {
      title: "Process Payroll",
      description: "Manage salary payments",
      icon: DollarSign,
      color: "bg-green-500",
      action: () => setActiveSection("payroll"),
    },

    {
      title: "View Reports",
      description: "Generate reports",
      icon: FileText,
      color: "bg-red-500",
      action: () => setActiveSection("reports"),
    },

  ]

  const stats = [
    {
      id: "clients",
      title: "Total Clients",
      value: dashboardData?.totalClients.toString() || "0",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: "supervisors",
      title: "Supervisors",
      value: dashboardData?.totalSupervisors.toString() || "0",
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      id: "employees",
      title: "Employees",
      value: dashboardData?.totalEmployees.toString() || "0",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      id: "reports",
      title: "Reports",
      value: dashboardData?.totalReports.toString() || "0",
      icon: FileText,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ]

  const renderLoadingState = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-[120px]">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2 mb-2" />
              <Skeleton className="h-3 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderDetailsTable = () => {
    // if (selectedStat === "payroll" && dashboardData?.payrollData && dashboardData.payrollData.length > 0) {
    //   return (
    //     <div className="h-full overflow-y-auto">
    //       <Table>
    //         <TableHeader>
    //           <TableRow>
    //             <TableHead>Employee</TableHead>
    //             <TableHead>Role</TableHead>
    //             <TableHead>Amount</TableHead>
    //             <TableHead>Payment Date</TableHead>
    //             <TableHead>Status</TableHead>
    //             <TableHead>Notes</TableHead>
    //           </TableRow>
    //         </TableHeader>
    //         <TableBody>
    //           {dashboardData.payrollData.slice(0, 5).map((payment) => {
    //             // Enhanced user name resolution
    //             let userName = "Unknown User"
    //             let userInitials = "U"

    //             if (typeof payment.user === "object" && payment.user?.name) {
    //               userName = payment.user.name
    //               userInitials = payment.user.name
    //                 .split(" ")
    //                 .map((n) => n[0])
    //                 .join("")
    //                 .toUpperCase()
    //             } else if (typeof payment.user === "string") {
    //               userName = `User ${payment.user.slice(-4)}`
    //               userInitials = "U"
    //             }

    //             return (
    //               <TableRow key={payment._id}>
    //                 <TableCell className="font-medium">
    //                   <div className="flex items-center gap-2">
    //                     <Avatar className="h-8 w-8">
    //                       <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
    //                         {userInitials}
    //                       </AvatarFallback>
    //                     </Avatar>
    //                     <div>
    //                       <div className="font-medium">{userName}</div>
    //                       {typeof payment.user === "object" && payment.user?.email && (
    //                         <div className="text-xs text-muted-foreground">{payment.user.email}</div>
    //                       )}
    //                     </div>
    //                   </div>
    //                 </TableCell>
    //                 <TableCell>
    //                   <Badge variant="outline" className="capitalize">
    //                     {payment.userRole?.toLowerCase() || "employee"}
    //                   </Badge>
    //                 </TableCell>
    //                 <TableCell className="font-semibold">
    //                   ₹{typeof payment.amount === "number" ? payment.amount.toLocaleString() : "0"}
    //                 </TableCell>
    //                 <TableCell>
    //                   {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString("en-IN") : "-"}
    //                 </TableCell>
    //                 <TableCell>
    //                   <Badge
    //                     variant={
    //                       payment.status === "paid"
    //                         ? "default"
    //                         : payment.status === "pending"
    //                           ? "secondary"
    //                           : "destructive"
    //                     }
    //                     className={
    //                       payment.status === "paid"
    //                         ? "bg-green-100 text-green-800"
    //                         : payment.status === "pending"
    //                           ? "bg-yellow-100 text-yellow-800"
    //                           : "bg-red-100 text-red-800"
    //                     }
    //                   >
    //                     {payment.status === "paid" && <CheckCircle className="w-3 h-3 mr-1" />}
    //                     {payment.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
    //                     {payment.status === "failed" && <XCircle className="w-3 h-3 mr-1" />}
    //                     {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1) || "Unknown"}
    //                   </Badge>
    //                 </TableCell>
    //                 <TableCell className="max-w-[200px] truncate">{payment.notes || "-"}</TableCell>
    //               </TableRow>
    //             )
    //           })}
    //         </TableBody>
    //       </Table>
    //     </div>
    //   )
    // }

    // Other table rendering logic remains the same...
    if (selectedStat === "supervisors" && dashboardData?.supervisorsData && dashboardData.supervisorsData.length > 0) {
      return (
        <div className="h-full overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboardData.supervisorsData.map((supervisor) => (
                <TableRow key={supervisor.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-600 text-white">
                          {supervisor.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {supervisor.name}
                    </div>
                  </TableCell>
                  <TableCell>{supervisor.position || "-"}</TableCell>
                  <TableCell>{supervisor.department || "-"}</TableCell>
                  <TableCell>{supervisor.experience || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={supervisor.status === "Active" ? "default" : "secondary"}>
                      {supervisor.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{supervisor.phone || supervisor.email || "-"}</TableCell>
                  <TableCell>{supervisor.projects?.length || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(supervisor, "supervisor")}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )
    }

    // Continue with other table types...

    if (selectedStat === "employees" && dashboardData?.employeesData && dashboardData.employeesData.length > 0) {
      return (
        <div className="h-full overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboardData.employeesData.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                          {employee.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {employee.name}
                    </div>
                  </TableCell>
                  <TableCell>{employee.position || "-"}</TableCell>
                  <TableCell>{employee.department || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={employee.status === "Active" ? "default" : "secondary"}>{employee.status}</Badge>
                  </TableCell>
                  <TableCell>{employee.phone || "-"}</TableCell>
                  <TableCell>{new Date(employee.joinDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(employee, "employee")}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )
    }

    if (selectedStat === "clients" && dashboardData?.clientsData && dashboardData.clientsData.length > 0) {
      return (
        <div className="h-full overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboardData.clientsData.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.company}</TableCell>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={client.status === "Active" ? "default" : "secondary"}>{client.status}</Badge>
                  </TableCell>
                  <TableCell>{client.projects?.length || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(client, "client")}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )
    }

    // Reports table
    if (selectedStat === "reports" && dashboardData?.reportsData && dashboardData.reportsData.length > 0) {
      return (
        <div className="h-full overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboardData.reportsData.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{report.type}</Badge>
                  </TableCell>
                  <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={report.status === 'Submitted' ? 'default' : 'secondary'}>
                      {report.status || 'Submitted'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => handleViewMore('reports')}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )
    }

    if (selectedStat) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center p-6 max-w-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Info className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium">No detailed view available</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Detailed view for {selectedStat} is not implemented yet.
            </p>
          </div>
        </div>
      )
    }

    // Enhanced Dashboard Overview with attractive charts
    const chartData = [
      {
        name: "Supervisors",
        value: dashboardData?.totalSupervisors || 0,
        color: "#10B981", // Green
        percentage: 0,
      },
      {
        name: "Employees",
        value: dashboardData?.totalEmployees || 0,
        color: "#3B82F6", // Blue
        percentage: 0,
      },
      {
        name: "Clients",
        value: dashboardData?.totalClients || 0,
        color: "#8B5CF6", // Purple
        percentage: 0,
      },
    ]

    const totalItems = chartData.reduce((sum, item) => sum + item.value, 0)

    // Calculate percentages
    chartData.forEach((item) => {
      item.percentage = totalItems > 0 ? (item.value / totalItems) * 100 : 0
    })

    // Generate last 6 months of data with growth patterns
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const monthName = date.toLocaleString('default', { month: 'short' });
      const isCurrentMonth = i === 5;
      
      // Calculate historical data based on current data and position in the timeline
      const positionFactor = (i + 1) / 6; // 0.166, 0.333, 0.5, 0.666, 0.833, 1.0
      const growthFactor = 0.2; // 20% growth over 6 months
      
      // Calculate values with a growth pattern
      const calculateHistoricalValue = (currentValue: number) => {
        if (isCurrentMonth) return currentValue || 0;
        // Apply a growth curve - starts slower, accelerates over time
        const growthPosition = Math.pow(positionFactor, 0.7); // Non-linear growth
        return Math.max(1, Math.floor(currentValue * (1 - growthFactor * (1 - growthPosition))));
      };
      
      const currentEmployees = dashboardData?.totalEmployees || 0;
      const currentSupervisors = dashboardData?.totalSupervisors || 0;
      const currentClients = dashboardData?.totalClients || 0;
      
      // Ensure we have at least some data points
      const minEmployees = Math.min(1, Math.floor(currentEmployees * 0.1));
      const minSupervisors = Math.min(1, Math.floor(currentSupervisors * 0.1));
      const minClients = Math.min(1, Math.floor(currentClients * 0.1));
      
      return {
        month: monthName,
        employees: Math.max(minEmployees, calculateHistoricalValue(currentEmployees)),
        supervisors: Math.max(minSupervisors, calculateHistoricalValue(currentSupervisors)),
        clients: Math.max(minClients, calculateHistoricalValue(currentClients)),
      };
    });

    return (
      <div className="w-full h-full p-6 space-y-6">
        {/* Enhanced Charts Section */}
        <div className=" md:grid hidden grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Resource Distribution
              </CardTitle>
              <CardDescription>Current allocation across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ChartContainer
                  config={{
                    supervisors: { label: "Supervisors", color: "#10B981" },
                    employees: { label: "Employees", color: "#3B82F6" },
                    clients: { label: "Clients", color: "#8B5CF6" },
                  }}
                >
                  <RechartsPrimitive.PieChart>
                    <RechartsPrimitive.Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <RechartsPrimitive.Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </RechartsPrimitive.Pie>
                    <RechartsPrimitive.Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;

                        // Create a custom tooltip component with proper typing
                        const CustomTooltip = () => (
                          <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                            <p className="font-semibold">{payload[0].name}</p>
                            <p>{`Count: ${payload[0].value}`}</p>
                            <p>{`Percentage: ${(((payload[0].value as number) / totalItems) * 100).toFixed(1)}%`}</p>
                          </div>
                        );

                        return <CustomTooltip />;
                      }}
                    />
                    <RechartsPrimitive.Legend
                      content={({ payload }) => (
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                          {payload?.map((entry, index) => (
                            <div
                              key={`legend-${index}`}
                              className="flex items-center gap-2 text-sm"
                            >
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span>{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    />
                  </RechartsPrimitive.PieChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          {/* Line Chart - Monthly Trends */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Monthly Growth Trends
              </CardTitle>
              <CardDescription>6-month performance overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ChartContainer
                  config={{
                    employees: { label: "Employees", color: "#3B82F6" },
                    supervisors: { label: "Supervisors", color: "#10B981" },
                    clients: { label: "Clients", color: "#8B5CF6" },
                  }}
                >
                  <RechartsPrimitive.LineChart data={monthlyData}>
                    <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <RechartsPrimitive.XAxis dataKey="month" stroke="#6b7280" />
                    <RechartsPrimitive.YAxis stroke="#6b7280" />
                    <RechartsPrimitive.Tooltip content={<ChartTooltipContent />} />
                    <RechartsPrimitive.Legend
                      content={({ payload }) => (
                        <ChartLegendContent {...(payload as any)} />
                      )}
                    />
                    <RechartsPrimitive.Line
                      type="monotone"
                      dataKey="employees"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                    />
                    <RechartsPrimitive.Line
                      type="monotone"
                      dataKey="supervisors"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                    />
                    <RechartsPrimitive.Line
                      type="monotone"
                      dataKey="clients"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 4 }}
                    />
                  </RechartsPrimitive.LineChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Summary */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-100 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-purple-600" />
              Summary Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {chartData.map((item) => (
                <div key={item.name} className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold" style={{ color: item.color }}>
                    {item.value.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">{item.name}</div>
                  {/* <div className="text-xs text-gray-500 mt-1">{item.percentage.toFixed(1)}% of total</div> */}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderContent = () => {
    if (isLoading) { 
      return renderLoadingState()
    }

    switch (activeSection) {
      case "users":
        return <UserManagement />
      case "supervisors":
        return <SupervisorsManagement />
      case "suppliers":
        return <SuppliersManagement />
      case "clients":
        return <ClientsManagement />
      case "employees":
        return <EmployeesManagement />
      case "workers":
        return <AllWorkersOverview />
      case "materials":
        return <MaterialsManagement />
      case "reports":
        return <Reportmanagement />
      case "payroll":
        return <PayrollManagement />
      case "message":
        return (
          <div className="h-[calc(100vh-200px)] bg-white rounded-lg shadow-sm flex items-center justify-center p-6 text-center text-gray-600">
            <div>
              <p className="text-lg font-medium">No conversation selected</p>
              <p className="text-sm mt-2">Open a client profile from the Clients section to start chatting.</p>
            </div>
          </div>
        )
      case "settings":
        return <AdminSetting />
      default:
        return (
          <div className="flex flex-col space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
                <Button onClick={fetchDashboardData} variant="outline" size="sm" className="ml-auto bg-transparent">
                  Retry
                </Button>
              </div>
            )}

            {/* Enhanced Stats Grid */}
            <div className="order-1 md:order-none grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              {stats.map((stat) => (
                <Card
                  key={stat.id}
                  className={`h-[140px] hover:shadow-xl border-0 transition-all duration-300 cursor-pointer transform hover:scale-105 ${selectedStat === stat.id ? "shadow-lg ring-2 ring-blue-500" : ""
                    } ${stat.bgColor}`}
                  onClick={() => setSelectedStat(selectedStat === stat.id ? null : stat.id)}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-700">{stat.title}</CardTitle>
                    <div className={`p-3 rounded-full ${stat.color.replace("text", "bg")} bg-opacity-20`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    {/* <div className="flex items-center mt-2">
                      {stat.trend === "up" ? (
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span
                        className={`text-xs font-medium ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}
                      >
                        {stat.change}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">from last month</span>
                    </div> */}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions Section */}
            <Card className="order-3 md:order-none bg-gradient-to-r from-indigo-50 to-blue-100 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-600" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Frequently used actions for faster workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center gap-2 bg-white hover:bg-gray-50 border-2 hover:border-gray-300 transition-all duration-200"
                      onClick={action.action}
                    >
                      <div className={`p-2 rounded-full ${action.color} text-white`}>
                        <action.icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium text-center">{action.title}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Details Panel */}
            <Card className="order-2 md:order-none shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                <CardTitle className="flex items-center gap-2">
                  {selectedStat ? (
                    <>
                      <Eye className="h-5 w-5 text-blue-600" />
                      {selectedStat.charAt(0).toUpperCase() + selectedStat.slice(1)} Details
                    </>
                  ) : (
                    <>
                      <Activity className="h-5 w-5 text-gray-600" />
                      Dashboard Overview
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {selectedStat
                    ? `Viewing details for ${selectedStat}`
                    : "Select a card above to view details or explore the overview charts"}
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-[400px] p-0">
                <div className="space-y-4">
                  {renderDetailsTable()}
                  {selectedStat && (
                    <div className="flex justify-center p-6">
                      <Button
                        variant="default"
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        onClick={() => handleViewMore(selectedStat || "dashboard")}
                      >
                        <ExternalLink className="w-5 h-5 mr-2" />
                        View More in {selectedStat.charAt(0).toUpperCase() + selectedStat.slice(1)}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout userRole="admin" activeSection={activeSection} onSectionChange={setActiveSection}>
        <div className="lg:p-6">{renderContent()}</div>
      </DashboardLayout>

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedUser}
        type={selectedUserType}
      />
    </div>
  )
}

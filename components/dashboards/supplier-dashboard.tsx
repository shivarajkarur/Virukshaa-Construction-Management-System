"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Package,
  Truck,
  DollarSign,
  AlertTriangle,
  Home,
  ShoppingCart,
  BarChart3,
  Settings,
  Menu,
  Bell,
  LogOut,
  User,
} from "lucide-react"
import SupplierOrdersManagement from "@/components/management/supplier-orders"
import SupplierInventoryManagement from "@/components/management/supplier-inventory"
import SupplierDeliveriesManagement from "@/components/management/supplier-deliveries"
import SupplierReportsManagement from "@/components/management/supplier-reports"
import SupplierSettingsManagement from "@/components/management/supplier-settings"

const sidebarItems = [
  { title: "Dashboard", icon: Home, key: "dashboard" },
  { title: "Orders", icon: ShoppingCart, key: "orders" },
  { title: "Inventory", icon: Package, key: "inventory" },
  { title: "Deliveries", icon: Truck, key: "deliveries" },
  { title: "Reports", icon: BarChart3, key: "reports" },
  { title: "Settings", icon: Settings, key: "settings" },
]

export default function SupplierDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("userEmail")
    router.push("/")
  }

  const supplierStats = [
    {
      title: "Active Orders",
      value: "23",
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: "+12%",
    },
    {
      title: "Pending Deliveries",
      value: "8",
      icon: Truck,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      trend: "+5%",
    },
    {
      title: "Monthly Revenue",
      value: "$45K",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: "+18%",
    },
    {
      title: "Low Stock Items",
      value: "5",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      trend: "-2%",
    },
  ]

  const recentOrders = [
    {
      id: "ORD-001",
      project: "Downtown Office Complex",
      client: "ABC Construction",
      items: "Cement, Steel Bars, Bricks",
      amount: "$18,250",
      status: "Processing",
      priority: "High",
      delivery: "Nov 15, 2024",
      time: "2 hours ago",
    },
    {
      id: "ORD-002",
      project: "Residential Tower A",
      client: "Urban Developers",
      items: "Concrete Mix, Sand",
      amount: "$5,975",
      status: "Delivered",
      priority: "Medium",
      delivery: "Nov 10, 2024",
      time: "1 day ago",
    },
    {
      id: "ORD-003",
      project: "Shopping Mall Renovation",
      client: "Retail Constructors",
      items: "Paint, Tiles, Fixtures",
      amount: "$12,100",
      status: "Pending",
      priority: "Low",
      delivery: "Nov 20, 2024",
      time: "3 hours ago",
    },
  ]

  const inventory = [
    { item: "Portland Cement", stock: 1200, unit: "bags", reorderLevel: 200, status: "Good", value: "$15,000" },
    { item: "Steel Reinforcement Bars", stock: 50, unit: "tons", reorderLevel: 100, status: "Low", value: "$42,500" },
    { item: "Red Bricks", stock: 25000, unit: "units", reorderLevel: 5000, status: "Good", value: "$11,250" },
    { item: "Concrete Mix", stock: 80, unit: "bags", reorderLevel: 150, status: "Low", value: "$1,260" },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-800 border-green-200"
      case "Processing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStockStatus = (current: number, reorder: number) => {
    if (current <= reorder) return { color: "text-red-600", status: "Low Stock", bgColor: "bg-red-50" }
    if (current <= reorder * 1.5) return { color: "text-yellow-600", status: "Medium Stock", bgColor: "bg-yellow-50" }
    return { color: "text-green-600", status: "Good Stock", bgColor: "bg-green-50" }
  }

  const getSectionTitle = () => {
    const section = sidebarItems.find((item) => item.key === activeSection)
    return section ? section.title : "Dashboard"
  }

  const renderContent = () => {
    switch (activeSection) {
      case "orders":
        return <SupplierOrdersManagement />
      case "inventory":
        return <SupplierInventoryManagement />
      case "deliveries":
        return <SupplierDeliveriesManagement />
      case "reports":
        return <SupplierReportsManagement />
      case "settings":
        return <SupplierSettingsManagement />
      default:
        return (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-100">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to BuildMart Supplies!</h1>
              <p className="text-gray-600">
                Manage your orders, inventory, and deliveries from your supplier dashboard.
              </p>
            </div>

            {/* Supplier Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {supplierStats.map((stat) => (
                <Card key={stat.title} className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <p className="text-xs text-green-600 mt-1">{stat.trend} from last month</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Recent Orders */}
              <div className="xl:col-span-2">
                <Card className="h-fit">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">Recent Orders</CardTitle>
                        <CardDescription>Latest material orders from construction projects</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setActiveSection("orders")}>
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentOrders.map((order) => (
                        <div
                          key={order.id}
                          className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900">{order.id}</h4>
                                <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                                <Badge className={getPriorityColor(order.priority)}>{order.priority}</Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{order.project}</p>
                              <p className="text-sm text-gray-500">{order.client}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-gray-900">{order.amount}</p>
                              <p className="text-sm text-gray-500">Due: {order.delivery}</p>
                            </div>
                          </div>

                          <div className="text-sm text-gray-600 mb-3">
                            <span className="font-medium">Items:</span> {order.items}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{order.time}</span>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Inventory Overview */}
              <div>
                <Card className="h-fit">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">Inventory Status</CardTitle>
                        <CardDescription>Current stock levels and alerts</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setActiveSection("inventory")}>
                        Manage
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {inventory.map((item, index) => {
                        const stockStatus = getStockStatus(item.stock, item.reorderLevel)
                        return (
                          <div key={index} className="p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900 text-sm">{item.item}</h4>
                              <Badge className={`${stockStatus.color} ${stockStatus.bgColor} border`}>
                                {stockStatus.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                              <span>
                                Stock: {item.stock.toLocaleString()} {item.unit}
                              </span>
                              <span>Value: {item.value}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card
                className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => setActiveSection("deliveries")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    Schedule Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Schedule and track material deliveries to project sites</p>
                  <Button className="w-full">Schedule Delivery</Button>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => setActiveSection("inventory")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Package className="w-5 h-5 text-green-600" />
                    </div>
                    Manage Inventory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Update stock levels and manage inventory alerts</p>
                  <Button className="w-full">Manage Stock</Button>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => setActiveSection("reports")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                    </div>
                    View Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Access business analytics and performance reports</p>
                  <Button className="w-full">View Reports</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Supplier Portal</h2>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              ×
            </Button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  setActiveSection(item.key)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                  activeSection === item.key
                    ? "bg-green-50 text-green-700 border-r-2 border-green-600"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.title}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Supplier Portal</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">{getSectionTitle()}</span>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" alt="User" />
                    <AvatarFallback className="bg-green-100 text-green-600">BM</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">BuildMart Supplies</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {localStorage.getItem("userEmail") || "supplier@buildmart.com"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveSection("settings")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveSection("settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dashboard content */}
        <main className="flex-1 overflow-auto p-6">{renderContent()}</main>
      </div>
    </div>
  )
}

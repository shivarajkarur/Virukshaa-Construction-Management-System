"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Download, TrendingUp, DollarSign, Package, Truck } from "lucide-react"

export default function SupplierReportsManagement() {
  const [dateRange, setDateRange] = useState("last30days")

  // Sample data for charts
  const salesData = [
    { month: "Jan", revenue: 45000, orders: 23, deliveries: 21 },
    { month: "Feb", revenue: 52000, orders: 28, deliveries: 26 },
    { month: "Mar", revenue: 48000, orders: 25, deliveries: 24 },
    { month: "Apr", revenue: 61000, orders: 32, deliveries: 30 },
    { month: "May", revenue: 55000, orders: 29, deliveries: 28 },
    { month: "Jun", revenue: 67000, orders: 35, deliveries: 33 },
    { month: "Jul", revenue: 59000, orders: 31, deliveries: 29 },
    { month: "Aug", revenue: 72000, orders: 38, deliveries: 36 },
    { month: "Sep", revenue: 68000, orders: 36, deliveries: 34 },
    { month: "Oct", revenue: 74000, orders: 39, deliveries: 37 },
    { month: "Nov", revenue: 81000, orders: 42, deliveries: 40 },
  ]

  const inventoryData = [
    { name: "Cement & Concrete", value: 35, color: "#8884d8" },
    { name: "Steel & Metal", value: 25, color: "#82ca9d" },
    { name: "Masonry", value: 20, color: "#ffc658" },
    { name: "Aggregates", value: 12, color: "#ff7300" },
    { name: "Finishing Materials", value: 8, color: "#00ff00" },
  ]

  const topClients = [
    { name: "ABC Construction", orders: 15, revenue: 125000 },
    { name: "Urban Developers", orders: 12, revenue: 98000 },
    { name: "Retail Constructors", orders: 10, revenue: 87000 },
    { name: "Industrial Solutions", orders: 8, revenue: 76000 },
    { name: "Elite Builders", orders: 7, revenue: 65000 },
  ]

  const topProducts = [
    { name: "Portland Cement", quantity: 2500, revenue: 31250 },
    { name: "Steel Reinforcement Bars", quantity: 450, revenue: 382500 },
    { name: "Red Bricks", quantity: 85000, revenue: 38250 },
    { name: "Concrete Mix", quantity: 1200, revenue: 18900 },
    { name: "Sand", quantity: 800, revenue: 20000 },
  ]

  const deliveryPerformance = [
    { metric: "On-Time Deliveries", value: "94%", trend: "+2%" },
    { metric: "Average Delivery Time", value: "2.3 days", trend: "-0.2 days" },
    { metric: "Delivery Success Rate", value: "98%", trend: "+1%" },
    { metric: "Customer Satisfaction", value: "4.7/5", trend: "+0.1" },
  ]

  const reportStats = [
    { title: "Total Revenue", value: "$681K", icon: DollarSign, color: "text-green-600", change: "+12%" },
    { title: "Total Orders", value: "328", icon: Package, color: "text-blue-600", change: "+8%" },
    { title: "Deliveries Made", value: "312", icon: Truck, color: "text-orange-600", change: "+5%" },
    { title: "Active Clients", value: "45", icon: TrendingUp, color: "text-purple-600", change: "+15%" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Reports & Analytics</h2>
          <p className="text-muted-foreground">Business insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="last3months">Last 3 Months</option>
            <option value="last6months">Last 6 Months</option>
            <option value="lastyear">Last Year</option>
          </select>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Report Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reports Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                    <CardDescription>Monthly revenue over the past year</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]} />
                        <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Orders vs Deliveries */}
                <Card>
                  <CardHeader>
                    <CardTitle>Orders vs Deliveries</CardTitle>
                    <CardDescription>Monthly comparison of orders and deliveries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="orders" fill="#8884d8" name="Orders" />
                        <Bar dataKey="deliveries" fill="#82ca9d" name="Deliveries" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {deliveryPerformance.map((metric, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">{metric.metric}</p>
                        <p className="text-2xl font-bold">{metric.value}</p>
                        <p className="text-xs text-green-600">{metric.trend}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="sales" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Sales */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Sales Performance</CardTitle>
                    <CardDescription>Revenue and order trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]} />
                        <Bar dataKey="revenue" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top Products */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Selling Products</CardTitle>
                    <CardDescription>Best performing products by revenue</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topProducts.map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-muted-foreground">Qty: {product.quantity.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${product.revenue.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Inventory Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory Distribution</CardTitle>
                    <CardDescription>Stock distribution by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={inventoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {inventoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Stock Levels */}
                <Card>
                  <CardHeader>
                    <CardTitle>Current Stock Levels</CardTitle>
                    <CardDescription>Inventory status overview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">12</p>
                          <p className="text-sm text-muted-foreground">Good Stock</p>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-lg">
                          <p className="text-2xl font-bold text-yellow-600">3</p>
                          <p className="text-sm text-muted-foreground">Medium Stock</p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg">
                          <p className="text-2xl font-bold text-red-600">2</p>
                          <p className="text-sm text-muted-foreground">Low Stock</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Items Needing Reorder</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Steel Reinforcement Bars</span>
                            <span className="text-red-600">50 tons</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Concrete Mix</span>
                            <span className="text-red-600">80 bags</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="deliveries" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Delivery Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Performance</CardTitle>
                    <CardDescription>Monthly delivery statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="deliveries" stroke="#82ca9d" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Delivery Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Key Delivery Metrics</CardTitle>
                    <CardDescription>Performance indicators</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {deliveryPerformance.map((metric, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{metric.metric}</h4>
                            <p className="text-sm text-muted-foreground">Current period</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold">{metric.value}</p>
                            <p className="text-sm text-green-600">{metric.trend}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="clients" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Clients */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Clients by Revenue</CardTitle>
                    <CardDescription>Best performing client relationships</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topClients.map((client, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{client.name}</h4>
                            <p className="text-sm text-muted-foreground">{client.orders} orders</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${client.revenue.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Client Growth */}
                <Card>
                  <CardHeader>
                    <CardTitle>Client Growth</CardTitle>
                    <CardDescription>New vs returning clients</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">12</p>
                          <p className="text-sm text-muted-foreground">New Clients</p>
                          <p className="text-xs text-green-600">+20% from last month</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">33</p>
                          <p className="text-sm text-muted-foreground">Returning Clients</p>
                          <p className="text-xs text-green-600">+5% from last month</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Client Satisfaction</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: "94%" }}></div>
                          </div>
                          <span className="text-sm font-medium">94%</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Based on delivery feedback</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Package, Clock, CheckCircle, XCircle, Eye, Edit, Plus, Calendar, MapPin, User } from "lucide-react"

export default function SupplierOrdersManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const orders = [
    {
      id: "ORD-001",
      project: "Downtown Office Complex",
      client: "ABC Construction",
      items: [
        { name: "Portland Cement", quantity: 500, unit: "bags", price: 12.5 },
        { name: "Steel Reinforcement Bars", quantity: 200, unit: "tons", price: 850.0 },
        { name: "Red Bricks", quantity: 10000, unit: "units", price: 0.45 },
      ],
      totalAmount: "$180,250",
      status: "Processing",
      orderDate: "Nov 8, 2024",
      requestedDelivery: "Nov 15, 2024",
      deliveryAddress: "123 Downtown Ave, Los Angeles, CA",
      contactPerson: "John Smith",
      contactPhone: "+1 (555) 123-4567",
      notes: "Urgent delivery required for foundation work",
      priority: "High",
    },
    {
      id: "ORD-002",
      project: "Residential Tower A",
      client: "Urban Developers",
      items: [
        { name: "Concrete Mix", quantity: 300, unit: "bags", price: 15.75 },
        { name: "Sand", quantity: 50, unit: "tons", price: 25.0 },
      ],
      totalAmount: "$5,975",
      status: "Delivered",
      orderDate: "Nov 5, 2024",
      requestedDelivery: "Nov 10, 2024",
      deliveryAddress: "456 Residential Blvd, Los Angeles, CA",
      contactPerson: "Sarah Johnson",
      contactPhone: "+1 (555) 987-6543",
      notes: "Standard delivery schedule",
      priority: "Medium",
    },
    {
      id: "ORD-003",
      project: "Shopping Mall Renovation",
      client: "Retail Constructors",
      items: [
        { name: "Paint", quantity: 100, unit: "gallons", price: 35.0 },
        { name: "Ceramic Tiles", quantity: 500, unit: "sq ft", price: 4.5 },
        { name: "Light Fixtures", quantity: 50, unit: "units", price: 125.0 },
      ],
      totalAmount: "$12,100",
      status: "Pending",
      orderDate: "Nov 12, 2024",
      requestedDelivery: "Nov 20, 2024",
      deliveryAddress: "789 Mall Drive, Los Angeles, CA",
      contactPerson: "Mike Davis",
      contactPhone: "+1 (555) 456-7890",
      notes: "Coordinate with interior design team",
      priority: "Low",
    },
    {
      id: "ORD-004",
      project: "Warehouse Expansion",
      client: "Industrial Solutions",
      items: [
        { name: "Steel Beams", quantity: 25, unit: "units", price: 450.0 },
        { name: "Insulation Material", quantity: 200, unit: "sq ft", price: 8.75 },
      ],
      totalAmount: "$13,000",
      status: "Cancelled",
      orderDate: "Nov 1, 2024",
      requestedDelivery: "Nov 8, 2024",
      deliveryAddress: "321 Industrial Way, Los Angeles, CA",
      contactPerson: "Lisa Chen",
      contactPhone: "+1 (555) 321-0987",
      notes: "Order cancelled due to design changes",
      priority: "Medium",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-800"
      case "Processing":
        return "bg-blue-100 text-blue-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Delivered":
        return <CheckCircle className="w-4 h-4" />
      case "Processing":
        return <Clock className="w-4 h-4" />
      case "Pending":
        return <Package className="w-4 h-4" />
      case "Cancelled":
        return <XCircle className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

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

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Order Management</h2>
          <p className="text-muted-foreground">Track and manage material orders from clients</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Order
        </Button>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter((order) => order.status === "Processing").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter((order) => order.status === "Delivered").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$211K</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{order.id}</CardTitle>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{order.status}</span>
                    </Badge>
                    <Badge className={getPriorityColor(order.priority)}>{order.priority}</Badge>
                  </div>
                  <CardDescription>
                    {order.project} • {order.client}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{order.totalAmount}</p>
                  <p className="text-sm text-muted-foreground">Delivery: {order.requestedDelivery}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Items Summary */}
              <div>
                <h4 className="font-medium mb-2">Items ({order.items.length})</h4>
                <div className="text-sm text-muted-foreground">
                  {order.items.map((item, index) => (
                    <span key={index}>
                      {item.name} ({item.quantity} {item.unit}){index < order.items.length - 1 && ", "}
                    </span>
                  ))}
                </div>
              </div>

              {/* Order Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Ordered: {order.orderDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{order.contactPerson}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{order.deliveryAddress}</span>
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Order Details - {order.id}</DialogTitle>
                      <DialogDescription>{order.project}</DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="details" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="details">Order Details</TabsTrigger>
                        <TabsTrigger value="items">Items</TabsTrigger>
                        <TabsTrigger value="delivery">Delivery Info</TabsTrigger>
                      </TabsList>

                      <TabsContent value="details" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Order ID</Label>
                            <p className="text-sm text-muted-foreground">{order.id}</p>
                          </div>
                          <div>
                            <Label>Status</Label>
                            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                          </div>
                          <div>
                            <Label>Project</Label>
                            <p className="text-sm text-muted-foreground">{order.project}</p>
                          </div>
                          <div>
                            <Label>Client</Label>
                            <p className="text-sm text-muted-foreground">{order.client}</p>
                          </div>
                          <div>
                            <Label>Order Date</Label>
                            <p className="text-sm text-muted-foreground">{order.orderDate}</p>
                          </div>
                          <div>
                            <Label>Total Amount</Label>
                            <p className="text-lg font-semibold">{order.totalAmount}</p>
                          </div>
                        </div>
                        {order.notes && (
                          <div>
                            <Label>Notes</Label>
                            <p className="text-sm text-muted-foreground">{order.notes}</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="items" className="space-y-4">
                        <div className="space-y-3">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <h4 className="font-medium">{item.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {item.quantity} {item.unit} × ${item.price}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">${(item.quantity * item.price).toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="delivery" className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <Label>Delivery Address</Label>
                            <p className="text-sm text-muted-foreground">{order.deliveryAddress}</p>
                          </div>
                          <div>
                            <Label>Contact Person</Label>
                            <p className="text-sm text-muted-foreground">{order.contactPerson}</p>
                          </div>
                          <div>
                            <Label>Contact Phone</Label>
                            <p className="text-sm text-muted-foreground">{order.contactPhone}</p>
                          </div>
                          <div>
                            <Label>Requested Delivery Date</Label>
                            <p className="text-sm text-muted-foreground">{order.requestedDelivery}</p>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>

                {order.status === "Pending" && (
                  <Button size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Process Order
                  </Button>
                )}

                {order.status === "Processing" && (
                  <Button size="sm">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Delivered
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No orders found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}

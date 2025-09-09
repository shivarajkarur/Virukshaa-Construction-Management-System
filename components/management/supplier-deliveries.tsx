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
import { Truck, Calendar, MapPin, Clock, CheckCircle, AlertCircle, Plus, Eye, Edit } from "lucide-react"

export default function SupplierDeliveriesManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const deliveries = [
    {
      id: "DEL-001",
      orderId: "ORD-001",
      project: "Downtown Office Complex",
      client: "ABC Construction",
      items: [
        { name: "Portland Cement", quantity: 500, unit: "bags" },
        { name: "Steel Bars", quantity: 200, unit: "tons" },
      ],
      status: "In Transit",
      scheduledDate: "Nov 15, 2024",
      scheduledTime: "10:00 AM",
      deliveryAddress: "123 Downtown Ave, Los Angeles, CA",
      contactPerson: "John Smith",
      contactPhone: "+1 (555) 123-4567",
      driverName: "Mike Johnson",
      driverPhone: "+1 (555) 987-1234",
      vehicleNumber: "TRK-001",
      estimatedArrival: "10:30 AM",
      actualDelivery: null,
      notes: "Coordinate with site supervisor for unloading",
      priority: "High",
    },
    {
      id: "DEL-002",
      orderId: "ORD-002",
      project: "Residential Tower A",
      client: "Urban Developers",
      items: [
        { name: "Concrete Mix", quantity: 300, unit: "bags" },
        { name: "Sand", quantity: 50, unit: "tons" },
      ],
      status: "Delivered",
      scheduledDate: "Nov 10, 2024",
      scheduledTime: "2:00 PM",
      deliveryAddress: "456 Residential Blvd, Los Angeles, CA",
      contactPerson: "Sarah Johnson",
      contactPhone: "+1 (555) 987-6543",
      driverName: "Tom Wilson",
      driverPhone: "+1 (555) 456-7890",
      vehicleNumber: "TRK-002",
      estimatedArrival: "2:00 PM",
      actualDelivery: "2:15 PM",
      notes: "Delivered successfully, signed by site manager",
      priority: "Medium",
    },
    {
      id: "DEL-003",
      orderId: "ORD-003",
      project: "Shopping Mall Renovation",
      client: "Retail Constructors",
      items: [
        { name: "Paint", quantity: 100, unit: "gallons" },
        { name: "Tiles", quantity: 500, unit: "sq ft" },
      ],
      status: "Scheduled",
      scheduledDate: "Nov 20, 2024",
      scheduledTime: "9:00 AM",
      deliveryAddress: "789 Mall Drive, Los Angeles, CA",
      contactPerson: "Mike Davis",
      contactPhone: "+1 (555) 456-7890",
      driverName: "TBD",
      driverPhone: "TBD",
      vehicleNumber: "TBD",
      estimatedArrival: "9:00 AM",
      actualDelivery: null,
      notes: "Special handling required for paint materials",
      priority: "Low",
    },
    {
      id: "DEL-004",
      orderId: "ORD-004",
      project: "Warehouse Expansion",
      client: "Industrial Solutions",
      items: [{ name: "Steel Beams", quantity: 25, unit: "units" }],
      status: "Delayed",
      scheduledDate: "Nov 8, 2024",
      scheduledTime: "11:00 AM",
      deliveryAddress: "321 Industrial Way, Los Angeles, CA",
      contactPerson: "Lisa Chen",
      contactPhone: "+1 (555) 321-0987",
      driverName: "Bob Martinez",
      driverPhone: "+1 (555) 654-3210",
      vehicleNumber: "TRK-003",
      estimatedArrival: "2:00 PM",
      actualDelivery: null,
      notes: "Delayed due to traffic congestion",
      priority: "Medium",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-800"
      case "In Transit":
        return "bg-blue-100 text-blue-800"
      case "Scheduled":
        return "bg-yellow-100 text-yellow-800"
      case "Delayed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Delivered":
        return <CheckCircle className="w-4 h-4" />
      case "In Transit":
        return <Truck className="w-4 h-4" />
      case "Scheduled":
        return <Calendar className="w-4 h-4" />
      case "Delayed":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
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

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch =
      delivery.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.client.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || delivery.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Delivery Management</h2>
          <p className="text-muted-foreground">Schedule and track material deliveries</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Delivery
        </Button>
      </div>

      {/* Delivery Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveries.filter((d) => d.status === "In Transit").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deliveries.filter((d) => d.status === "Delivered" && d.scheduledDate === "Nov 10, 2024").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delayed</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveries.filter((d) => d.status === "Delayed").length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Management */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Tracking</CardTitle>
          <CardDescription>Monitor and manage all delivery schedules</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active Deliveries</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search deliveries..."
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
                  <option value="in transit">In Transit</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>

              {/* Active Deliveries */}
              <div className="space-y-4">
                {filteredDeliveries
                  .filter((d) => d.status === "In Transit" || d.status === "Delayed")
                  .map((delivery) => (
                    <Card key={delivery.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-lg">{delivery.id}</CardTitle>
                              <Badge className={getStatusColor(delivery.status)}>
                                {getStatusIcon(delivery.status)}
                                <span className="ml-1">{delivery.status}</span>
                              </Badge>
                              <Badge className={getPriorityColor(delivery.priority)}>{delivery.priority}</Badge>
                            </div>
                            <CardDescription>
                              {delivery.project} • {delivery.client}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{delivery.scheduledDate}</p>
                            <p className="text-sm text-muted-foreground">ETA: {delivery.estimatedArrival}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Delivery Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate">{delivery.deliveryAddress}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {delivery.driverName} • {delivery.vehicleNumber}
                            </span>
                          </div>
                        </div>

                        {/* Items Summary */}
                        <div>
                          <h4 className="font-medium mb-2">Items ({delivery.items.length})</h4>
                          <div className="text-sm text-muted-foreground">
                            {delivery.items.map((item, index) => (
                              <span key={index}>
                                {item.name} ({item.quantity} {item.unit}){index < delivery.items.length - 1 && ", "}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Notes */}
                        {delivery.notes && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm">{delivery.notes}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                Track Delivery
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Delivery Tracking - {delivery.id}</DialogTitle>
                                <DialogDescription>{delivery.project}</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Status</Label>
                                    <Badge className={getStatusColor(delivery.status)}>{delivery.status}</Badge>
                                  </div>
                                  <div>
                                    <Label>Priority</Label>
                                    <Badge className={getPriorityColor(delivery.priority)}>{delivery.priority}</Badge>
                                  </div>
                                  <div>
                                    <Label>Driver</Label>
                                    <p className="text-sm text-muted-foreground">{delivery.driverName}</p>
                                  </div>
                                  <div>
                                    <Label>Vehicle</Label>
                                    <p className="text-sm text-muted-foreground">{delivery.vehicleNumber}</p>
                                  </div>
                                  <div>
                                    <Label>Contact Person</Label>
                                    <p className="text-sm text-muted-foreground">{delivery.contactPerson}</p>
                                  </div>
                                  <div>
                                    <Label>Phone</Label>
                                    <p className="text-sm text-muted-foreground">{delivery.contactPhone}</p>
                                  </div>
                                </div>
                                <div>
                                  <Label>Delivery Address</Label>
                                  <p className="text-sm text-muted-foreground">{delivery.deliveryAddress}</p>
                                </div>
                                <div>
                                  <Label>Items</Label>
                                  <div className="space-y-2">
                                    {delivery.items.map((item, index) => (
                                      <div key={index} className="flex justify-between p-2 bg-muted rounded">
                                        <span>{item.name}</span>
                                        <span>
                                          {item.quantity} {item.unit}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Update Status
                          </Button>

                          {delivery.status === "In Transit" && (
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
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-4">
              <div className="space-y-4">
                {deliveries
                  .filter((d) => d.status === "Scheduled")
                  .map((delivery) => (
                    <Card key={delivery.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{delivery.id}</h4>
                              <Badge className={getStatusColor(delivery.status)}>
                                {getStatusIcon(delivery.status)}
                                <span className="ml-1">{delivery.status}</span>
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {delivery.project} • {delivery.client}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>
                                {delivery.scheduledDate} at {delivery.scheduledTime}
                              </span>
                              <span>{delivery.contactPerson}</span>
                            </div>
                          </div>
                          <Button size="sm">Assign Driver</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              <div className="space-y-4">
                {deliveries
                  .filter((d) => d.status === "Delivered")
                  .map((delivery) => (
                    <Card key={delivery.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{delivery.id}</h4>
                              <Badge className={getStatusColor(delivery.status)}>
                                {getStatusIcon(delivery.status)}
                                <span className="ml-1">{delivery.status}</span>
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {delivery.project} • {delivery.client}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Delivered: {delivery.actualDelivery}</span>
                              <span>Driver: {delivery.driverName}</span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            View Receipt
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

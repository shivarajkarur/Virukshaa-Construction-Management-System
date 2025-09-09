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
import { Package, AlertTriangle, Plus, Edit, TrendingUp, TrendingDown } from "lucide-react"

export default function SupplierInventoryManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const inventory = [
    {
      id: "INV-001",
      name: "Portland Cement",
      category: "Cement & Concrete",
      currentStock: 1200,
      unit: "bags",
      reorderLevel: 200,
      maxStock: 2000,
      unitPrice: 12.5,
      supplier: "CementCorp",
      lastRestocked: "Nov 5, 2024",
      location: "Warehouse A - Section 1",
      description: "High-grade Portland cement for construction",
      status: "Good Stock",
    },
    {
      id: "INV-002",
      name: "Steel Reinforcement Bars",
      category: "Steel & Metal",
      currentStock: 50,
      unit: "tons",
      reorderLevel: 100,
      maxStock: 300,
      unitPrice: 850.0,
      supplier: "SteelWorks Inc",
      lastRestocked: "Oct 28, 2024",
      location: "Warehouse B - Yard",
      description: "Grade 60 steel rebar for reinforcement",
      status: "Low Stock",
    },
    {
      id: "INV-003",
      name: "Red Bricks",
      category: "Masonry",
      currentStock: 25000,
      unit: "units",
      reorderLevel: 5000,
      maxStock: 50000,
      unitPrice: 0.45,
      supplier: "Brick Masters",
      lastRestocked: "Nov 8, 2024",
      location: "Warehouse C - Stack Area",
      description: "Standard red clay bricks",
      status: "Good Stock",
    },
    {
      id: "INV-004",
      name: "Concrete Mix",
      category: "Cement & Concrete",
      currentStock: 80,
      unit: "bags",
      reorderLevel: 150,
      maxStock: 500,
      unitPrice: 15.75,
      supplier: "MixMaster Co",
      lastRestocked: "Oct 25, 2024",
      location: "Warehouse A - Section 2",
      description: "Ready-mix concrete for various applications",
      status: "Low Stock",
    },
    {
      id: "INV-005",
      name: "Sand",
      category: "Aggregates",
      currentStock: 200,
      unit: "tons",
      reorderLevel: 50,
      maxStock: 400,
      unitPrice: 25.0,
      supplier: "Aggregate Solutions",
      lastRestocked: "Nov 10, 2024",
      location: "Warehouse B - Pit Area",
      description: "Fine construction sand",
      status: "Good Stock",
    },
    {
      id: "INV-006",
      name: "Paint - White",
      category: "Finishing Materials",
      currentStock: 45,
      unit: "gallons",
      reorderLevel: 20,
      maxStock: 100,
      unitPrice: 35.0,
      supplier: "ColorTech Paints",
      lastRestocked: "Nov 3, 2024",
      location: "Warehouse D - Paint Storage",
      description: "Premium white interior/exterior paint",
      status: "Good Stock",
    },
  ]

  const categories = ["All", "Cement & Concrete", "Steel & Metal", "Masonry", "Aggregates", "Finishing Materials"]

  const getStockStatus = (current: number, reorder: number, max: number) => {
    const percentage = (current / max) * 100
    if (current <= reorder)
      return {
        status: "Low Stock",
        color: "bg-red-100 text-red-800",
        icon: <AlertTriangle className="w-4 h-4" />,
      }
    if (percentage <= 30)
      return {
        status: "Medium Stock",
        color: "bg-yellow-100 text-yellow-800",
        icon: <TrendingDown className="w-4 h-4" />,
      }
    return {
      status: "Good Stock",
      color: "bg-green-100 text-green-800",
      icon: <TrendingUp className="w-4 h-4" />,
    }
  }

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.category.toLowerCase() === categoryFilter.toLowerCase()
    return matchesSearch && matchesCategory
  })

  const lowStockItems = inventory.filter((item) => item.currentStock <= item.reorderLevel)
  const totalValue = inventory.reduce((sum, item) => sum + item.currentStock * item.unitPrice, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Inventory Management</h2>
          <p className="text-muted-foreground">Track and manage your material inventory</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length - 1}</div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Management */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Overview</CardTitle>
          <CardDescription>Manage your stock levels and reorder alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="inventory" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="inventory">Current Stock</TabsTrigger>
              <TabsTrigger value="alerts">Low Stock Alerts</TabsTrigger>
              <TabsTrigger value="add-stock">Add/Update Stock</TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search inventory..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  {categories.map((category) => (
                    <option key={category} value={category.toLowerCase()}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Inventory Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredInventory.map((item) => {
                  const stockStatus = getStockStatus(item.currentStock, item.reorderLevel, item.maxStock)
                  return (
                    <Card key={item.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{item.name}</CardTitle>
                            <CardDescription>{item.category}</CardDescription>
                          </div>
                          <Badge className={stockStatus.color}>
                            {stockStatus.icon}
                            <span className="ml-1">{stockStatus.status}</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label>Current Stock</Label>
                            <p className="font-semibold">
                              {item.currentStock.toLocaleString()} {item.unit}
                            </p>
                          </div>
                          <div>
                            <Label>Reorder Level</Label>
                            <p className="text-muted-foreground">
                              {item.reorderLevel.toLocaleString()} {item.unit}
                            </p>
                          </div>
                          <div>
                            <Label>Unit Price</Label>
                            <p className="font-semibold">${item.unitPrice}</p>
                          </div>
                          <div>
                            <Label>Total Value</Label>
                            <p className="font-semibold">${(item.currentStock * item.unitPrice).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="text-sm">
                          <p>
                            <span className="font-medium">Location:</span> {item.location}
                          </p>
                          <p>
                            <span className="font-medium">Supplier:</span> {item.supplier}
                          </p>
                          <p>
                            <span className="font-medium">Last Restocked:</span> {item.lastRestocked}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{item.name}</DialogTitle>
                                <DialogDescription>{item.description}</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Item ID</Label>
                                    <p className="text-sm text-muted-foreground">{item.id}</p>
                                  </div>
                                  <div>
                                    <Label>Category</Label>
                                    <p className="text-sm text-muted-foreground">{item.category}</p>
                                  </div>
                                  <div>
                                    <Label>Current Stock</Label>
                                    <p className="text-sm text-muted-foreground">
                                      {item.currentStock} {item.unit}
                                    </p>
                                  </div>
                                  <div>
                                    <Label>Max Capacity</Label>
                                    <p className="text-sm text-muted-foreground">
                                      {item.maxStock} {item.unit}
                                    </p>
                                  </div>
                                  <div>
                                    <Label>Supplier</Label>
                                    <p className="text-sm text-muted-foreground">{item.supplier}</p>
                                  </div>
                                  <div>
                                    <Label>Location</Label>
                                    <p className="text-sm text-muted-foreground">{item.location}</p>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button size="sm" className="flex-1">
                            <Edit className="w-4 h-4 mr-2" />
                            Update Stock
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <div className="space-y-4">
                {lowStockItems.length > 0 ? (
                  lowStockItems.map((item) => (
                    <Card key={item.id} className="border-red-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Current: {item.currentStock} {item.unit} | Reorder Level: {item.reorderLevel}{" "}
                                {item.unit}
                              </p>
                            </div>
                          </div>
                          <Button size="sm">Reorder Now</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No low stock alerts at this time</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="add-stock" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item-name">Item Name</Label>
                  <Input id="item-name" placeholder="Enter item name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select className="w-full p-2 border rounded-md">
                    <option>Select category...</option>
                    {categories.slice(1).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" type="number" placeholder="Enter quantity" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <select className="w-full p-2 border rounded-md">
                    <option>bags</option>
                    <option>tons</option>
                    <option>units</option>
                    <option>gallons</option>
                    <option>sq ft</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit-price">Unit Price ($)</Label>
                  <Input id="unit-price" type="number" step="0.01" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorder-level">Reorder Level</Label>
                  <Input id="reorder-level" type="number" placeholder="Minimum stock level" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input id="supplier" placeholder="Supplier name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Storage Location</Label>
                  <Input id="location" placeholder="Warehouse location" />
                </div>
              </div>
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add to Inventory
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

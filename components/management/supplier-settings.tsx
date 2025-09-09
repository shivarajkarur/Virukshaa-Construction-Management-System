"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Building, CreditCard, Truck, Package, Save, Camera } from "lucide-react"

export default function SupplierSettingsManagement() {
  const [companyData, setCompanyData] = useState({
    companyName: "BuildMart Supplies",
    businessType: "Material Supplier",
    email: "contact@buildmart.com",
    phone: "+1 (555) 123-4567",
    address: "456 Industrial Blvd, Los Angeles, CA 90210",
    website: "www.buildmart.com",
    taxId: "12-3456789",
    licenseNumber: "SUP-2024-001",
    description: "Leading supplier of construction materials with over 20 years of experience",
    logo: "/placeholder.svg?height=100&width=100",
  })

  const [notifications, setNotifications] = useState({
    orderAlerts: true,
    deliveryUpdates: true,
    inventoryAlerts: true,
    paymentNotifications: true,
    systemUpdates: false,
    marketingEmails: false,
  })

  const [businessSettings, setBusinessSettings] = useState({
    operatingHours: "8:00 AM - 6:00 PM",
    deliveryRadius: "50",
    minimumOrderValue: "500",
    leadTime: "2-3",
    paymentTerms: "Net 30",
    autoAcceptOrders: false,
    requireSignature: true,
    allowPartialDelivery: true,
  })

  const [integrations, setIntegrations] = useState({
    gpsTracking: true,
    inventorySync: false,
    accountingSync: false,
    crmIntegration: false,
  })

  const handleCompanyUpdate = () => {
    console.log("Company data updated:", companyData)
    alert("Company information updated successfully!")
  }

  const handleNotificationUpdate = () => {
    console.log("Notifications updated:", notifications)
    alert("Notification preferences updated!")
  }

  const handleBusinessUpdate = () => {
    console.log("Business settings updated:", businessSettings)
    alert("Business settings updated!")
  }

  const handleIntegrationUpdate = () => {
    console.log("Integrations updated:", integrations)
    alert("Integration settings updated!")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Supplier Settings</h2>
          <p className="text-muted-foreground">Manage your supplier account and business preferences</p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="company" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="company">Company</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
            </TabsList>

            <TabsContent value="company" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Company Information</h3>

                {/* Company Logo */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={companyData.logo || "/placeholder.svg"} alt="Company Logo" />
                    <AvatarFallback>
                      <Building className="w-8 h-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">
                      <Camera className="w-4 h-4 mr-2" />
                      Change Logo
                    </Button>
                    <p className="text-sm text-muted-foreground mt-1">JPG, PNG or SVG. Max size 2MB.</p>
                  </div>
                </div>

                <Separator />

                {/* Company Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={companyData.companyName}
                      onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={companyData.businessType}
                      onChange={(e) => setCompanyData({ ...companyData, businessType: e.target.value })}
                    >
                      <option>Material Supplier</option>
                      <option>Equipment Rental</option>
                      <option>General Contractor</option>
                      <option>Specialty Contractor</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companyData.email}
                      onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={companyData.phone}
                      onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={companyData.website}
                      onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID</Label>
                    <Input
                      id="taxId"
                      value={companyData.taxId}
                      onChange={(e) => setCompanyData({ ...companyData, taxId: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Input
                    id="address"
                    value={companyData.address}
                    onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Company Description</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    value={companyData.description}
                    onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                  />
                </div>

                <Button onClick={handleCompanyUpdate}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Company Information
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="business" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Business Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="operatingHours">Operating Hours</Label>
                    <Input
                      id="operatingHours"
                      value={businessSettings.operatingHours}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, operatingHours: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryRadius">Delivery Radius (miles)</Label>
                    <Input
                      id="deliveryRadius"
                      type="number"
                      value={businessSettings.deliveryRadius}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, deliveryRadius: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minimumOrder">Minimum Order Value ($)</Label>
                    <Input
                      id="minimumOrder"
                      type="number"
                      value={businessSettings.minimumOrderValue}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, minimumOrderValue: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leadTime">Lead Time (days)</Label>
                    <Input
                      id="leadTime"
                      value={businessSettings.leadTime}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, leadTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={businessSettings.paymentTerms}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, paymentTerms: e.target.value })}
                    >
                      <option>Net 15</option>
                      <option>Net 30</option>
                      <option>Net 45</option>
                      <option>Net 60</option>
                      <option>Due on Receipt</option>
                    </select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Order & Delivery Preferences</h4>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-Accept Orders</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically accept orders that meet your criteria
                      </p>
                    </div>
                    <Switch
                      checked={businessSettings.autoAcceptOrders}
                      onCheckedChange={(checked) =>
                        setBusinessSettings({ ...businessSettings, autoAcceptOrders: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Delivery Signature</Label>
                      <p className="text-sm text-muted-foreground">Require signature confirmation for all deliveries</p>
                    </div>
                    <Switch
                      checked={businessSettings.requireSignature}
                      onCheckedChange={(checked) =>
                        setBusinessSettings({ ...businessSettings, requireSignature: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Partial Deliveries</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow partial deliveries when full order isn't available
                      </p>
                    </div>
                    <Switch
                      checked={businessSettings.allowPartialDelivery}
                      onCheckedChange={(checked) =>
                        setBusinessSettings({ ...businessSettings, allowPartialDelivery: checked })
                      }
                    />
                  </div>
                </div>

                <Button onClick={handleBusinessUpdate}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Business Settings
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Preferences</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Order Alerts</Label>
                      <p className="text-sm text-muted-foreground">Get notified when new orders are received</p>
                    </div>
                    <Switch
                      checked={notifications.orderAlerts}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, orderAlerts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Delivery Updates</Label>
                      <p className="text-sm text-muted-foreground">Receive updates on delivery status changes</p>
                    </div>
                    <Switch
                      checked={notifications.deliveryUpdates}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, deliveryUpdates: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Inventory Alerts</Label>
                      <p className="text-sm text-muted-foreground">Get alerts when inventory levels are low</p>
                    </div>
                    <Switch
                      checked={notifications.inventoryAlerts}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, inventoryAlerts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Payment Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications about payments and invoices</p>
                    </div>
                    <Switch
                      checked={notifications.paymentNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, paymentNotifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>System Updates</Label>
                      <p className="text-sm text-muted-foreground">Get notified about system maintenance and updates</p>
                    </div>
                    <Switch
                      checked={notifications.systemUpdates}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, systemUpdates: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">Receive promotional emails and marketing content</p>
                    </div>
                    <Switch
                      checked={notifications.marketingEmails}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, marketingEmails: checked })}
                    />
                  </div>
                </div>

                <Button onClick={handleNotificationUpdate}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Notification Preferences
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">System Integrations</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        GPS Tracking
                      </CardTitle>
                      <CardDescription>Track delivery vehicles in real-time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Enable GPS tracking for deliveries</span>
                        <Switch
                          checked={integrations.gpsTracking}
                          onCheckedChange={(checked) => setIntegrations({ ...integrations, gpsTracking: checked })}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Inventory Sync
                      </CardTitle>
                      <CardDescription>Sync with external inventory management systems</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Connect to inventory system</span>
                        <Switch
                          checked={integrations.inventorySync}
                          onCheckedChange={(checked) => setIntegrations({ ...integrations, inventorySync: checked })}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Accounting Sync
                      </CardTitle>
                      <CardDescription>Integrate with accounting software</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Sync with QuickBooks/Xero</span>
                        <Switch
                          checked={integrations.accountingSync}
                          onCheckedChange={(checked) => setIntegrations({ ...integrations, accountingSync: checked })}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        CRM Integration
                      </CardTitle>
                      <CardDescription>Connect with customer relationship management tools</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Sync customer data</span>
                        <Switch
                          checked={integrations.crmIntegration}
                          onCheckedChange={(checked) => setIntegrations({ ...integrations, crmIntegration: checked })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Button onClick={handleIntegrationUpdate}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Integration Settings
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

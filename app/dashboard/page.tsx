"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminDashboard from "@/components/dashboards/admin-dashboard"
import SupervisorDashboard from "@/components/dashboards/supervisor-dashboard"
import ClientDashboard from "@/components/dashboards/client-dashboard"
import SupplierDashboard from "@/components/dashboards/supplier-dashboard"

export default function Dashboard() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem("userRole")
    if (!role) {
      router.push("/")
      return
    }
    setUserRole(role)
  }, [router])

  if (!userRole) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const renderDashboard = () => {
    switch (userRole) {
      case "superadmin":
        return <AdminDashboard />
      case "supervisor":
        return <SupervisorDashboard />
      case "client":
        return <ClientDashboard />
      default:
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-semibold">Not Found</h1>
              <p className="text-muted-foreground">Role not recognized. Please login again.</p>
              <a href="/" className="text-blue-600 hover:underline">Go to Login</a>
            </div>
          </div>
        )
    }
  }

  return renderDashboard()
}

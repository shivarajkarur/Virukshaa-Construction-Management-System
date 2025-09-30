"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Eye, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { useClient } from "@/contexts/ClientContext"
import { toast } from "sonner"
import { format } from "date-fns"

export default function ClientPaymentsManagement() {
  const { client } = useClient()
  const [queryClientId, setQueryClientId] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<Array<{
    _id: string
    clientId: string
    projectId?: string
    invoiceNumber: string
    amount: number
    status: "Pending" | "Paid" | "Overdue"
    dueDate: string
    notes?: string
    createdAt: string
  }>>([])
  const [loading, setLoading] = useState(false)

  // Read clientId from URL (?clientId=...) as a fallback for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let cid = new URLSearchParams(window.location.search).get('clientId')
      if (!cid) {
        try {
          const ls = window.localStorage.getItem('userId')
          if (ls) cid = ls
        } catch {}
      }
      setQueryClientId(cid)
    }
  }, [])

  useEffect(() => {
    const fetchInvoices = async () => {
      const effectiveClientId = client?._id || queryClientId
      if (!effectiveClientId) return
      setLoading(true)
      try {
        const url = `/api/invoices?clientId=${effectiveClientId}&_t=${Date.now()}`
        console.log("[ClientPayments] fetching:", url, { clientFromContext: client?._id, queryClientId })
        const res = await fetch(url , { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to fetch invoices")
        const data = await res.json()
        const list = Array.isArray(data) ? data : (Array.isArray(data?.invoices) ? data.invoices : [])
        console.log("[ClientPayments] fetched invoices count:", list.length, { effectiveClientId })
        setInvoices(
          list.map((inv: any) => ({
            ...inv,
            // normalize to strings for dates
            dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString() : undefined,
            createdAt: inv.createdAt ? new Date(inv.createdAt).toISOString() : undefined,
          }))
        )
      } catch (e) {
        console.error(e)
        toast.error("Unable to load invoices")
        setInvoices([])
      } finally {
        setLoading(false)
      }
    }
    fetchInvoices()
  }, [client?._id, queryClientId])

  const currency = (n: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "INR" }).format(n)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Paid":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "Pending":
        return <Clock className="w-5 h-5 text-yellow-600" />
      case "Overdue":
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6 p-2 sm:p-0">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Payments</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Manage your project payments and invoices</p>
        </div>
      </div>
      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription className="text-sm sm:text-base">All invoices created for you by the admin</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="space-y-4">
            {loading && (
              <div className="p-6 text-center text-sm sm:text-base text-muted-foreground">Loading invoices...</div>
            )}
            {!loading && invoices.length === 0 && (
              <div className="p-6 text-center text-sm sm:text-base text-muted-foreground">
                No invoices available yet{!client?._id && queryClientId ? ' (using clientId from URL)' : ''}
              </div>
            )}

            {invoices.map((inv) => (
              <div key={inv._id} className="p-4 sm:p-5 border rounded-lg shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-base sm:text-lg">Invoice {inv.invoiceNumber}</h4>
                      <Badge className={`${getStatusColor(inv.status)} text-xs sm:text-sm px-3 py-1`}>
                        {getStatusIcon(inv.status)}
                        <span className="ml-1">{inv.status}</span>
                      </Badge>
                    </div>
                    {inv.notes && <p className="text-sm text-muted-foreground">{inv.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-lg sm:text-xl font-semibold">{currency(inv.amount)}</p>
                    <p className="text-sm text-muted-foreground">Due: {format(new Date(inv.dueDate), "PP")}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Invoice: {inv.invoiceNumber}</span>
                  {/* <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto py-2">
                      <Eye className="w-5 h-5 mr-2" />
                      View Invoice
                    </Button>
                    {inv.status === "Pending" && (
                      <Button size="sm" className="w-full sm:w-auto py-2">
                        <CreditCard className="w-5 h-5 mr-2" />
                        Pay Now
                      </Button>
                    )}
                  </div> */}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

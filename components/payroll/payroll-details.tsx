"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export interface PayrollDetail {
  _id: string
  user: {
    _id: string
    name: string
    email?: string
  } | string
  userRole: 'Employee' | 'Supervisor' | 'Client' | 'Supplier'
  amount: number
  paymentDate: string | Date
  status: 'paid' | 'pending' | 'failed'
  notes?: string
  createdAt?: string | Date
  updatedAt?: string | Date
}

interface PayrollDetailsProps {
  payrollData: PayrollDetail[]
  isLoading?: boolean
}

export function PayrollDetails({ payrollData = [], isLoading = false }: PayrollDetailsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading payroll data...</div>
      </div>
    )
  }

  if (!payrollData.length) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">No payroll records found</div>
      </div>
    )
  }

  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), 'MMM dd, yyyy')
    } catch (error) {
      return 'Invalid date'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default">Paid</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getUserName = (user: any) => {
    if (!user) return 'Unknown User'
    if (typeof user === 'string') return user
    return user.name || 'Unknown User'
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payrollData.map((payroll) => (
            <TableRow key={payroll._id}>
              <TableCell className="font-medium">
                {getUserName(payroll.user)}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {payroll.userRole.toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell>
                ${typeof payroll.amount === 'number' 
                  ? payroll.amount.toFixed(2) 
                  : '0.00'}
              </TableCell>
              <TableCell>{formatDate(payroll.paymentDate)}</TableCell>
              <TableCell>{getStatusBadge(payroll.status)}</TableCell>
              <TableCell className="text-muted-foreground">
                {payroll.notes || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default PayrollDetails

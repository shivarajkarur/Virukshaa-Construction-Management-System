"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, RefreshCw, Search, Mail, Phone, User, MapPin, Calendar, Briefcase, Clock } from "lucide-react"

type SupervisorEmployeeItem = {
    _id: string
    name: string
    email?: string
    phone?: string
    role?: string
    position?: string
    avatar?: string
    workType?: string
    shiftsWorked?: number
    joinDate?: string
    status?: string
    endDate?: string
    address?: string
}

export default function SupervisorEmployee() {
    const [employees, setEmployees] = useState<SupervisorEmployeeItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState("")

    const supervisorId = typeof window !== "undefined" ? localStorage.getItem("userId") : null
    const role = typeof window !== "undefined" ? localStorage.getItem("userRole") : null

    const fetchEmployees = async () => {
        if (!supervisorId || role !== "supervisor") {
            setEmployees([])
            setLoading(false)
            setError("You must be logged in as a supervisor to view assigned employees.")
            return
        }
        try {
            setLoading(true)
            setError(null)
            const res = await fetch(`/api/supervisors/${encodeURIComponent(supervisorId)}/employees`, { cache: "no-store" })
            if (!res.ok) {
                const msg = await res.json().catch(() => ({}))
                throw new Error(msg?.message || `Failed to load employees (HTTP ${res.status})`)
            }
            const data = await res.json()
            const mapped: SupervisorEmployeeItem[] = (data || []).map((e: any) => ({
                _id: e._id || e.id,
                name: e.name,
                email: e.email,
                phone: e.phone,
                role: e.role,
                position: e.position,
                avatar: e.avatar,
                workType: e.workType,
                shiftsWorked: e.shiftsWorked,
                joinDate: e.joinDate,
                status: e.status,
                endDate: e.endDate,
                address: e.address,
            }))
            setEmployees(mapped)
        } catch (e: any) {
            setError(e?.message || "Failed to load employees")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchEmployees()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const formatDate = (value?: string) => {
        if (!value) return ""
        const d = new Date(value)
        if (isNaN(d.getTime())) return value
        return d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase()
        if (!term) return employees
        return employees.filter((e) =>
            [e.name, e.email, e.role, e.position, e.workType, e.status]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(term)),
        )
    }, [employees, search])

    const getStatusVariant = (status?: string) => {
        if (!status) return "secondary"
        const s = status.toLowerCase()
        if (s.includes("active") || s.includes("working")) return "default"
        if (s.includes("inactive") || s.includes("terminated")) return "destructive"
        if (s.includes("pending")) return "secondary"
        return "outline"
    }

    const formatPhoneForWhatsApp = (phone: string) => {
        // Remove all non-numeric characters
        const cleaned = phone.replace(/[^0-9]/g, "")
        // If it doesn't start with country code, assume it needs one
        if (cleaned.length === 10 && !cleaned.startsWith("1")) {
            return "1" + cleaned // Add US country code
        }
        return cleaned
    }

    if (loading && employees.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading assigned employees...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">My Team</h2>
                        <p className="text-sm text-muted-foreground">Manage your assigned employees</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Search employees..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button
                        size="icon"
                        variant="outline"
                        onClick={() => fetchEmployees()}
                        title="Refresh"
                        disabled={loading}
                        className="shrink-0"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {error && (
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="p-4">
                        <p className="text-sm text-destructive">{error}</p>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Team</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{employees.length}</div>
                        <p className="text-xs text-muted-foreground">Employees reporting to you</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {employees.filter((e) => e.status?.toLowerCase().includes("active")).length}
                        </div>
                        <p className="text-xs text-muted-foreground">Currently working</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Shift Workers</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {employees.filter((e) => e.workType?.toLowerCase() === "shift").length}
                        </div>
                        <p className="text-xs text-muted-foreground">On shift schedule</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Search Results</CardTitle>
                        <Search className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{filtered.length}</div>
                        <p className="text-xs text-muted-foreground">Matching your search</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((emp) => (
                    <Card key={emp._id} className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <Avatar className="h-14 w-14 ring-2 ring-background shadow-sm">
                                    <AvatarImage src={emp.avatar || "/placeholder.svg"} alt={emp.name} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                        {(emp.name || "?")
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                            .toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-lg leading-tight truncate">{emp.name}</h3>
                                            {(emp.role || emp.position) && (
                                                <p className="text-sm text-muted-foreground mt-1">{emp.role || emp.position}</p>
                                            )}
                                        </div>
                                        {emp.status && (
                                            <Badge variant={getStatusVariant(emp.status)} className="shrink-0 text-xs">
                                                {emp.status}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        {emp.email && (
                                            <div className="flex items-center gap-3 text-sm group">
                                                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                                                <a
                                                    className="text-muted-foreground hover:text-primary transition-colors truncate"
                                                    href={`mailto:${emp.email}`}
                                                    title={emp.email}
                                                >
                                                    {emp.email}
                                                </a>
                                            </div>
                                        )}

                                        {emp.phone && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                                                <span className="text-muted-foreground">{emp.phone}</span>
                                            </div>
                                        )}

                                        {emp.workType && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                                                <span className="text-muted-foreground">
                                                    {emp.workType}
                                                    {emp.workType?.toLowerCase() === "shift" && typeof emp.shiftsWorked === "number" && (
                                                        <span className="ml-2 text-xs bg-secondary px-2 py-1 rounded">
                                                            {emp.shiftsWorked} shifts
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        )}

                                        {emp.joinDate && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                                <span className="text-muted-foreground">Joined {formatDate(emp.joinDate)}</span>
                                            </div>
                                        )}

                                        {emp.address && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                                                <span className="text-muted-foreground truncate" title={emp.address}>
                                                    {emp.address}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filtered.length === 0 && !loading && !error && (
                <div className="text-center py-16">
                    <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                        <Users className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{search ? "No employees found" : "No team members yet"}</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        {search
                            ? "Try adjusting your search terms or clearing the search to see all employees."
                            : "When employees are assigned to you, they will appear here."}
                    </p>
                    {search && (
                        <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setSearch("")}>
                            Clear search
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

// "use client"

// import type React from "react"
// import { useEffect, useMemo, useState } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Badge } from "@/components/ui/badge"
// import { Input } from "@/components/ui/input"
// import { Search, Download, PlusCircle, Filter, X, Edit, Calendar, Check, Trash2 } from "lucide-react"
// import { jsPDF } from "jspdf"
// import { useToast } from "@/hooks/use-toast"

// type User = {
//   _id: string
//   name: string
//   email: string
//   role: "client" | "supervisor" | "supplier" | "employee"
//   salary?: number
//   projectTotalAmount?: number
//   supplierAmount?: number
//   totalSupplyValue?: number
//   totalPaid: number
//   dueAmount: number
//   lastPaymentDate?: string
//   status: "active" | "inactive"
//   phone?: string
//   address?: string
//   projectMaterials?: Array<{
//     projectId: string
//     projectName?: string
//     materialType: string
//     quantity: number
//     pricePerUnit: number
//     totalAmount: number
//     amount: number
//     paidAmount?: number
//     dueAmount?: number
//     createdAt?: string
//   }>
//   selectedProjectId?: string
//   [key: string]: any
// }

// // 1) Move normalizeId above any usage (fix hoisting issue)
// function normalizeId(id: any): string {
//   try {
//     if (!id) return ""
//     if (typeof id === "string") return id
//     if (typeof id === "number") return String(id)
//     if (typeof id === "object") {
//       if ((id as any).$oid) return String((id as any).$oid)
//       if ((id as any)._id) return normalizeId((id as any)._id)
//       if (typeof (id as any).toHexString === "function") return (id as any).toHexString()
//       if (typeof (id as any).toString === "function") {
//         const s = (id as any).toString()
//         if (s && s !== "[object Object]") return s
//       }
//     }
//     return String(id)
//   } catch {
//     return ""
//   }
// }

// function toYMD(d: Date) {
//   const year = d.getFullYear()
//   const month = String(d.getMonth() + 1).padStart(2, "0")
//   const day = String(d.getDate()).padStart(2, "0")
//   return `${year}-${month}-${day}`
// }

// function normalizeDateString(input?: string) {
//   if (!input) return ""
//   const d = new Date(input)
//   if (isNaN(d.getTime())) return ""
//   return toYMD(d)
// }

// const PayrollManagement = () => {
//   const { toast } = useToast()
//   const [users, setUsers] = useState<User[]>([])
//   const [filteredUsers, setFilteredUsers] = useState<User[]>([])
//   const [searchTerm, setSearchTerm] = useState("")
//   const [selectedRole, setSelectedRole] = useState<"supervisor" | "employee" | "client" | "supplier" | "all">(
//     "supervisor",
//   )
//   const [isLoading, setIsLoading] = useState(true)
//   const [editingId, setEditingId] = useState<string | null>(null)
//   const [editForm, setEditForm] = useState<User | null>(null)
//   const [isSaving, setIsSaving] = useState(false)
//   const [isExporting, setIsExporting] = useState(false)
//   const [projects, setProjects] = useState<{ _id: string; name: string }[]>([])
//   const [supplierMaterials, setSupplierMaterials] = useState<Record<string, any[]>>({})
//   const [payrollBySupplier, setPayrollBySupplier] = useState<
//     Record<string, { totalPaid: number; lastPaymentDate?: string }>
//   >({})
//   const [selectedDate, setSelectedDate] = useState<string>("")
//   const [payrollRecords, setPayrollRecords] = useState<any[]>([])

//   // Memoized cache: userId-projectId -> materials[]
//   const materialsCache = useMemo(() => {
//     const map: Record<string, any[]> = {}
//     for (const u of users) {
//       if (u.role !== "supplier" || !Array.isArray(u.projectMaterials)) continue
//       const groups: Record<string, any[]> = {}
//       for (const m of u.projectMaterials) {
//         const pid = normalizeId(m.projectId)
//         if (!groups[pid]) groups[pid] = []
//         groups[pid].push(m)
//       }
//       for (const pid of Object.keys(groups)) {
//         map[`${u._id}-${pid}`] = groups[pid]
//       }
//     }
//     return map
//   }, [users])

//   const filteredPayroll = useMemo(() => {
//     if (!selectedDate) return []
//     const ymd = selectedDate
//     // Filter records by date and ensure fresh data after any edits
//     return payrollRecords.filter((r) => {
//       const recordDate = normalizeDateString(r.paymentDate)
//       return recordDate === ymd
//     })
//   }, [selectedDate, payrollRecords]) // Added payrollRecords dependency for real-time updates

//   const filteredTotalAmount = useMemo(
//     () => filteredPayroll.reduce((s, r) => s + Number(r.amount || 0), 0),
//     [filteredPayroll],
//   )

//   // Helper function to fetch with basic checks
//   const fetchWithErrorHandling = async (url: string) => {
//     try {
//       const response = await fetch(url)
//       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
//       const contentType = response.headers.get("content-type")
//       if (!contentType || !contentType.includes("application/json")) throw new Error("Response is not JSON")
//       return await response.json()
//     } catch (error) {
//       console.error(`Error fetching from ${url}:`, error)
//       return []
//     }
//   }

//   const fetchRoleData = async (url: string, role: User["role"]): Promise<User[]> => {
//     try {
//       const data = await fetchWithErrorHandling(url)
//       if (!Array.isArray(data)) return []
//       return data.map((item: any) => transformUserData(item, role))
//     } catch (err) {
//       console.warn(`Failed to fetch role data for ${role} from ${url}`, err)
//       return []
//     }
//   }

//   const fetchPayrollRecords = async (): Promise<any[]> => {
//     try {
//       const res = await fetch("/api/payroll", { cache: "no-store" })
//       if (!res.ok) return []
//       const data = await res.json()
//       return Array.isArray(data) ? data : data ? [data] : []
//     } catch (err) {
//       console.warn("Failed to fetch payroll records", err)
//       return []
//     }
//   }

//   const buildSupplierAggregates = (records: any[]) => {
//     const supplierRecords = Array.isArray(records)
//       ? records.filter((r: any) => (r.userRole || r.user_role || "").toString().toLowerCase().includes("supplier"))
//       : []

//     const agg: Record<string, { totalPaid: number; lastPaymentDate?: string }> = {}
//     const latestMaterialsBySupplier: Record<
//       string,
//       { materials: any[]; totalSupplyValue: number; dueAmount: number; __ts: number }
//     > = {}

//     for (const rec of supplierRecords) {
//       const userId = (rec.user && (rec.user._id || rec.user.id)) || rec.user || rec.userId
//       const key = normalizeId(userId)
//       if (!key) continue

//       const paid = Number(rec.amount || rec.totalPaid || 0)
//       const date = rec.paymentDate || rec.createdAt

//       if (!agg[key]) agg[key] = { totalPaid: 0, lastPaymentDate: date }
//       agg[key].totalPaid += paid
//       if (date && (!agg[key].lastPaymentDate || new Date(date) > new Date(agg[key].lastPaymentDate!))) {
//         agg[key].lastPaymentDate = date
//       }

//       const mats: any[] = rec.supplierMaterials || rec.materials || []
//       if (Array.isArray(mats) && mats.length > 0) {
//         const recTime = new Date(date || rec.updatedAt || rec.createdAt || Date.now()).getTime()
//         const existing = (latestMaterialsBySupplier as any)[key]?.__ts || 0
//         if (recTime >= existing) {
//           latestMaterialsBySupplier[key] = {
//             materials: mats.map((m: any) => ({
//               _id: m._id || undefined,
//               projectId: (m.projectId && (m.projectId._id || m.projectId.id || m.projectId)) || m.project || "default",
//               projectName: m.projectName || m.project?.name,
//               materialType: m.materialType || m.name || "Unknown",
//               quantity: Number(m.quantity || 0),
//               pricePerUnit: Number(m.pricePerUnit || (m.totalAmount || m.amount || 0) / (m.quantity || 1)),
//               totalAmount: Number(m.totalAmount || m.amount || 0),
//               amount: Number(m.totalAmount || m.amount || 0),
//               paidAmount: Number(m.paidAmount || 0),
//               dueAmount: Number(m.dueAmount || (m.totalAmount || m.amount || 0) - Number(m.paidAmount || 0)),
//               createdAt: m.supplyDate || m.date || m.createdAt,
//             })),
//             totalSupplyValue:
//               Number(rec.totalSupplyValue) ||
//               mats.reduce((s: number, m: any) => s + Number(m.totalAmount || m.amount || 0), 0) ||
//               0,
//             dueAmount: Number(rec.dueAmount || 0),
//             __ts: recTime,
//           }
//         }
//       }
//     }
//     return { agg, latestMaterialsBySupplier }
//   }

//   const handleProjectSelection = async (userId: string, projectId: string) => {
//     setUsers((prevUsers) =>
//       prevUsers.map((user) => (user._id === userId ? { ...user, selectedProjectId: projectId } : user)),
//     )
//     if (editForm && editForm._id === userId) {
//       setEditForm({ ...editForm, selectedProjectId: projectId })
//     }
//     if (projectId) {
//       await fetchSupplierMaterials(userId, projectId)
//     }
//   }

//   const getProjectMaterials = (userId: string, projectId: string) => {
//     const key = `${userId}-${normalizeId(projectId)}`
//     // Prefer the per-project cache populated by fetchSupplierMaterials (already filtered)
//     const supplierScoped = supplierMaterials[key] || supplierMaterials[`${userId}-${projectId}`]
//     if (supplierScoped) return supplierScoped
//     // Fallback to memoized grouping from users.projectMaterials
//     const cached = materialsCache[key]
//     if (cached) return cached
//     const user = users.find((u) => u._id === userId)
//     if (!user || !user.projectMaterials) return []
//     return user.projectMaterials.filter((material) => normalizeId(material.projectId) === normalizeId(projectId))
//   }

//   const loadAllSupplierMaterials = async () => {
//     const suppliers = users.filter((user) => user.role === "supplier")
//     for (const supplier of suppliers) {
//       await fetchSupplierMaterials(supplier._id)
//       await new Promise((resolve) => setTimeout(resolve, 50))
//     }
//   }

//   // Safer update for nested material fields
//   const updateMaterialField = (
//     userId: string,
//     projectId: string,
//     materialIndex: number,
//     field: string,
//     value: number,
//   ) => {
//     const user = users.find((u) => u._id === userId)
//     if (!user || !user.projectMaterials) return

//     setUsers((prevUsers) =>
//       prevUsers.map((u) => {
//         if (u._id !== userId) return u
//         const updatedMaterials = [...(u.projectMaterials || [])]
//         const matchingIndices: number[] = []
//         updatedMaterials.forEach((m, idx) => {
//           if (normalizeId(m.projectId) === normalizeId(projectId)) matchingIndices.push(idx)
//         })
//         const globalIndex = matchingIndices[materialIndex]
//         if (globalIndex !== undefined) {
//           updatedMaterials[globalIndex] = { ...updatedMaterials[globalIndex], [field]: value }
//         }
//         return { ...u, projectMaterials: updatedMaterials }
//       }),
//     )

//     if (editForm && editForm._id === userId) {
//       const updatedMaterials = [...(editForm.projectMaterials || [])]
//       const matchingIndices: number[] = []
//       updatedMaterials.forEach((m, idx) => {
//         if (normalizeId(m.projectId) === normalizeId(projectId)) matchingIndices.push(idx)
//       })
//       const globalIndex = matchingIndices[materialIndex]
//       if (globalIndex !== undefined) {
//         updatedMaterials[globalIndex] = { ...updatedMaterials[globalIndex], [field]: value }
//         setEditForm({ ...editForm, projectMaterials: updatedMaterials })
//       }
//     }
//   }

//   const fetchSupplierMaterials = async (userId: string, projectId?: string) => {
//     try {
//       const apiUrl = `/api/suppliers/${userId}/materials`
//       const response = await fetch(apiUrl, { cache: "no-store" })
//       if (response.ok) {
//         const raw = await response.json()
//         const allMaterials = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : raw ? [raw] : []
//         const transformedMaterials = Array.isArray(allMaterials)
//           ? allMaterials.map((material: any) => {
//               const qty = Number(material.quantity || material.qty || material.units || 0)
//               const price = Number(material.pricePerUnit || material.price || material.rate || 0)
//               const amountFallback = Number(
//                 material.amount ||
//                   material.totalAmount ||
//                   material.total ||
//                   material.cost ||
//                   (price && qty ? price * qty : 0) ||
//                   0,
//               )
//               const paid = Number(material.paidAmount || material.paid || 0)
//               return {
//                 _id: material._id || `${userId}-${material.materialType}-${Date.now()}`,
//                 materialType: material.materialType || material.name || material.type || "Unknown",
//                 projectId: normalizeId(material.projectId || material.project || material.project_id) || "default",
//                 amount: amountFallback,
//                 quantity: qty,
//                 pricePerUnit: price || (qty ? amountFallback / qty : 0),
//                 totalAmount: amountFallback,
//                 paidAmount: paid,
//                 dueAmount: Math.max(0, amountFallback - paid),
//                 createdAt: material.date || material.supplyDate || material.createdAt,
//               }
//             })
//           : []

//         const totalSupplyValue = transformedMaterials.reduce(
//           (sum, material) => sum + (material.amount || material.totalAmount || 0),
//           0,
//         )

//         setUsers((prevUsers) =>
//           prevUsers.map((user) => {
//             if (user._id !== userId) return user
//             // Only overwrite if we actually received materials
//             if (Array.isArray(transformedMaterials) && transformedMaterials.length > 0) {
//               return {
//                 ...user,
//                 projectMaterials: transformedMaterials,
//                 totalSupplyValue: totalSupplyValue > 0 ? totalSupplyValue : user.totalSupplyValue,
//               }
//             }
//             return user
//           }),
//         )

//         if (projectId) {
//           const pidNorm = normalizeId(projectId)
//           const projectMaterials = transformedMaterials.filter((m) => normalizeId(m.projectId) === pidNorm)
//           setSupplierMaterials((prev) => ({
//             ...prev,
//             [`${userId}-${pidNorm}`]: projectMaterials,
//           }))
//         }
//       } else {
//         const user = users.find((u) => u._id === userId)
//         if (user && user.projectMaterials) {
//           if (projectId) {
//             const pidNorm = normalizeId(projectId)
//             const projectMaterials = user.projectMaterials.filter((m) => normalizeId(m.projectId) === pidNorm)
//             setSupplierMaterials((prev) => ({
//               ...prev,
//               [`${userId}-${pidNorm}`]: projectMaterials,
//             }))
//           }
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching supplier materials:", error)
//       const user = users.find((u) => u._id === userId)
//       if (user && user.projectMaterials && projectId) {
//         const pidNorm = normalizeId(projectId)
//         const projectMaterials = user.projectMaterials.filter((m) => normalizeId(m.projectId) === pidNorm)
//         setSupplierMaterials((prev) => ({
//           ...prev,
//           [`${userId}-${pidNorm}`]: projectMaterials,
//         }))
//       }
//     }
//   }

//   const fetchProjects = async () => {
//     try {
//       const response = await fetch("/api/projects", { cache: "no-store" })
//       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
//       const projectsData = await response.json()
//       const transformedProjects = Array.isArray(projectsData)
//         ? projectsData.map((project) => ({
//             _id: project._id || project.id,
//             name: project.title || project.name || "Unnamed Project",
//           }))
//         : []
//       setProjects(transformedProjects)
//     } catch (error) {
//       console.error("Error fetching projects:", error)
//       setProjects([])
//     }
//   }

//   // Supplier due calculation that respects selected project and material paid splits
//   const calculateSupplierDue = (user: User): number => {
//     const mats = Array.isArray(user.projectMaterials) ? user.projectMaterials : []
//     const totalAll = mats.reduce((s, m) => s + Number(m.amount || m.totalAmount || 0), 0)
//     const paidAllExplicit = mats.reduce((s, m) => s + Number(m.paidAmount || 0), 0)

//     // If a project is selected, try to use material-level paid; otherwise distribute proportionally
//     if (user.selectedProjectId) {
//       const pmats = mats.filter((m) => normalizeId(m.projectId) === normalizeId(user.selectedProjectId))
//       const ptotal = pmats.reduce((s, m) => s + Number(m.amount || m.totalAmount || 0), 0)
//       const ppaidExplicit = pmats.reduce((s, m) => s + Number(m.paidAmount || 0), 0)

//       let ppaid = ppaidExplicit
//       if (ppaid === 0 && totalAll > 0 && user.totalPaid > 0) {
//         // proportional fallback if per-material paid not present
//         ppaid = (ptotal / totalAll) * user.totalPaid
//       }
//       return Math.max(0, ptotal - ppaid)
//     }

//     // All projects
//     const paid = paidAllExplicit > 0 ? paidAllExplicit : Number(user.totalPaid || 0)
//     const total = totalAll > 0 ? totalAll : Number(user.totalSupplyValue || 0)
//     return Math.max(0, total - paid)
//   }

//   // Generic helper
//   const calculateDueAmount = (user: User): number => {
//     switch (user.role) {
//       case "employee":
//       case "supervisor":
//         return Math.max(0, (user.salary || 0) - (user.totalPaid || 0))
//       case "client":
//         return Math.max(0, (user.projectTotalAmount || 0) - (user.totalPaid || 0))
//       case "supplier":
//         return calculateSupplierDue(user)
//       default:
//         return user.dueAmount || 0
//     }
//   }

//   // Fix name precedence and enhance role transforms
//   const transformUserData = (user: any, role: string): User => {
//     // Correct operator precedence for name
//     const name =
//       user.name ||
//       user.fullName ||
//       (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.companyName || "Unknown")

//     const baseUser: User = {
//       _id: user._id || user.id || Math.random().toString(36).slice(2),
//       name,
//       email: user.email || user.emailAddress || `${role}-${Date.now()}@example.com`,
//       role: role as User["role"],
//       status: user.status || user.employeeStatus || "active",
//       phone: user.phone || user.phoneNumber || user.mobile || "",
//       address: user.address || user.location || "",
//       lastPaymentDate:
//         user.lastPaymentDate || user.lastPayment || user.lastSalaryDate || new Date().toISOString().split("T")[0],
//       totalPaid: Number(user.totalPaid || user.paidAmount || user.totalSalaryPaid || user.amountPaid || 0),
//       dueAmount: 0,
//     }

//     let transformed: User = baseUser

//     if (role === "employee") {
//       const salary =
//         typeof user.salary === "string"
//           ? Number.parseFloat(user.salary.replace(/[^0-9.]/g, ""))
//           : Number(
//               user.salary ||
//                 user.monthlySalary ||
//                 user.basicSalary ||
//                 user.grossSalary ||
//                 user.netSalary ||
//                 user.amount ||
//                 0,
//             )
//       transformed = { ...baseUser, salary }
//     } else if (role === "supervisor") {
//       const salary =
//         typeof user.salary === "string"
//           ? Number.parseFloat(user.salary.replace(/[^0-9.]/g, ""))
//           : Number(user.salary || user.monthlySalary || user.supervisorSalary || 0)
//       transformed = { ...baseUser, salary }
//     } else if (role === "client") {
//       const projectTotalAmount = Number(
//         user.projectTotalAmount || user.totalAmount || user.contractValue || user.amount || 0,
//       )
//       transformed = { ...baseUser, projectTotalAmount }
//     } else if (role === "supplier") {
//       const rawMaterials = user.projectMaterials || user.materials || []
//       const supplierMaterials = Array.isArray(rawMaterials)
//         ? rawMaterials.map((material: any) => {
//             const qty = Number(material.quantity || material.qty || material.units || 0)
//             const price = Number(material.pricePerUnit || material.price || material.rate || 0)
//             const amountFallback = Number(
//               material.amount ||
//                 material.totalAmount ||
//                 material.total ||
//                 material.cost ||
//                 (price && qty ? price * qty : 0) ||
//                 0,
//             )
//             const paid = Number(material.paidAmount || material.paid || 0)
//             return {
//               _id:
//                 material._id || `${baseUser._id}-${material.materialType || material.name || "Unknown"}-${Date.now()}`,
//               materialType: material.materialType || material.name || material.type || "Unknown",
//               projectId: normalizeId(material.projectId || material.project || material.project_id) || "default",
//               amount: amountFallback,
//               quantity: qty,
//               pricePerUnit: price || (qty ? amountFallback / qty : 0),
//               totalAmount: amountFallback,
//               paidAmount: paid,
//               dueAmount: Math.max(0, amountFallback - paid),
//               createdAt: material.date || material.supplyDate || material.createdAt,
//             }
//           })
//         : []

//       const calcSupply = supplierMaterials.reduce((s, m) => s + Number(m.amount || m.totalAmount || 0), 0)
//       transformed = {
//         ...baseUser,
//         name: user.companyName || baseUser.name || "Unknown Supplier",
//         totalSupplyValue: Number(user.totalSupplyValue || user.totalAmount || user.contractValue || calcSupply || 0),
//         projectMaterials: supplierMaterials,
//         totalPaid: Number(baseUser.totalPaid || 0),
//       }
//     }

//     transformed.dueAmount = calculateDueAmount(transformed)
//     return transformed
//   }

//   useEffect(() => {
//     const fetchAllData = async () => {
//       try {
//         setIsLoading(true)
//         const [employees, clients, suppliers, supervisors] = await Promise.all([
//           fetchRoleData("/api/employees", "employee"),
//           fetchRoleData("/api/clients", "client"),
//           fetchRoleData("/api/suppliers", "supplier"),
//           fetchRoleData("/api/supervisors", "supervisor"),
//         ])
//         const allUsers = [...employees, ...clients, ...suppliers, ...supervisors]

//         if (allUsers.length === 0) {
//           toast({ variant: "destructive", description: "No data found. Please check your API endpoints." })
//         } else {
//           // Initial merge (payroll aggregates will refine in the other effect)
//           const merged = allUsers.map((u) => {
//             if (u.role === "supplier") {
//               const agg = payrollBySupplier[u._id]
//               if (agg) {
//                 return {
//                   ...u,
//                   totalPaid: Math.max(Number(u.totalPaid || 0), Number(agg.totalPaid || 0)),
//                   lastPaymentDate: agg.lastPaymentDate || u.lastPaymentDate,
//                   dueAmount: calculateDueAmount({
//                     ...u,
//                     totalPaid: Math.max(Number(u.totalPaid || 0), Number(agg.totalPaid || 0)),
//                   }),
//                 }
//               }
//             }
//             return u
//           })
//           setUsers(merged)
//           toast({ description: `Loaded ${allUsers.length} records` })
//         }
//       } catch (error) {
//         console.error("Error in fetchAllData:", error)
//         toast({ variant: "destructive", description: "Failed to load data. Please try again." })
//       } finally {
//         setIsLoading(false)
//       }
//     }
//     fetchAllData()
//     fetchProjects()
//   }, [])

//   useEffect(() => {
//     const loadPayroll = async () => {
//       try {
//         const records = await fetchPayrollRecords()
//         setPayrollRecords(records)
//         const { agg, latestMaterialsBySupplier } = buildSupplierAggregates(records)
//         setPayrollBySupplier(agg)
//         if (users.length > 0) {
//           setUsers((prev) =>
//             prev.map((u) => {
//               const uid = normalizeId(u._id)
//               if (u.role === "supplier" && agg[uid]) {
//                 const a = agg[uid]
//                 const latest = (latestMaterialsBySupplier as any)[uid]
//                 const mergedMaterials = latest?.materials || u.projectMaterials || []
//                 const mergedSupplyValue =
//                   latest?.totalSupplyValue ??
//                   (mergedMaterials.length
//                     ? mergedMaterials.reduce((s: number, m: any) => s + Number(m.amount || m.totalAmount || 0), 0)
//                     : (u.totalSupplyValue ?? 0))

//                 const result: User = {
//                   ...u,
//                   projectMaterials: mergedMaterials,
//                   totalSupplyValue: mergedSupplyValue,
//                   totalPaid: Math.max(Number(u.totalPaid || 0), Number(a.totalPaid || 0)),
//                   lastPaymentDate: a.lastPaymentDate || u.lastPaymentDate,
//                 }
//                 result.dueAmount = calculateDueAmount(result)
//                 return result
//               }
//               return u
//             }),
//           )
//         }
//       } catch (e) {
//         console.warn("Failed to load payroll aggregates", e)
//       }
//     }
//     loadPayroll()
//   }, [users.length])

//   useEffect(() => {
//     if (users.length > 0) {
//       loadAllSupplierMaterials()
//     }
//   }, [users.length])

//   useEffect(() => {
//     const filtered = users.filter((user) => {
//       const matchesRole = selectedRole === "all" || user.role === selectedRole
//       const matchesSearch =
//         searchTerm === "" ||
//         user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         (user.role === "supplier" &&
//           user.projectMaterials &&
//           user.projectMaterials.some((material) =>
//             material.materialType.toLowerCase().includes(searchTerm.toLowerCase()),
//           ))
//       return matchesRole && matchesSearch
//     })
//     setFilteredUsers(filtered)
//   }, [searchTerm, users, selectedRole])

//   const handleEdit = (user: User) => {
//     setEditingId(user._id)
//     setEditForm({ ...user })
//   }

//   const handleSave = async () => {
//     if (!editForm || !editForm.role || isSaving) return
//     setIsSaving(true)
//     const apiPath = `/api/${editForm.role.toLowerCase()}s`
//     const userId = editForm._id
//     const originalUser = users.find((u) => u._id === userId)
//     const originalPaid = originalUser ? originalUser.totalPaid : 0
//     const paymentAmount = (editForm.totalPaid || 0) - (originalPaid || 0)

//     try {
//       let apiData: any = { ...editForm }
//       switch (editForm.role) {
//         case "employee":
//           apiData = {
//             ...editForm,
//             salary: editForm.salary,
//             totalPaid: editForm.totalPaid,
//             dueAmount: editForm.dueAmount,
//             lastPaymentDate: editForm.lastPaymentDate,
//           }
//           break
//         case "supervisor":
//           apiData = {
//             ...editForm,
//             salary: editForm.salary,
//           }
//           break
//         case "client":
//           apiData = {
//             ...editForm,
//             projectTotalAmount: editForm.projectTotalAmount,
//           }
//           break
//         case "supplier":
//           apiData = {
//             _id: editForm._id,
//             name: editForm.name,
//             email: editForm.email,
//             role: editForm.role,
//             dueAmount: editForm.dueAmount,
//             status: editForm.status,
//             totalPaid: editForm.totalPaid,
//             lastPaymentDate: editForm.lastPaymentDate,
//           }
//           break
//       }

//       const response = await fetch(`${apiPath}/${userId}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(apiData),
//       })
//       if (!response.ok) {
//         const errorText = await response.text()
//         throw new Error(`Failed to save ${editForm.role}: ${response.status} - ${errorText}`)
//       }
//       const updatedUser = await response.json()
//       const prevUser = users.find((u) => u._id === userId)
//       let transformedUser = transformUserData(updatedUser, editForm.role)
//       // Preserve supplier materials/supply value if backend response doesn't carry them
//       if (editForm.role === "supplier") {
//         const keepMaterials = (
//           prevUser && Array.isArray(prevUser.projectMaterials) && prevUser.projectMaterials.length > 0
//             ? prevUser.projectMaterials
//             : Array.isArray(editForm.projectMaterials)
//               ? editForm.projectMaterials
//               : []
//         ) as any[]
//         const keepSupply =
//           (prevUser && typeof prevUser.totalSupplyValue === "number" ? prevUser.totalSupplyValue : undefined) ??
//           (typeof editForm.totalSupplyValue === "number" ? editForm.totalSupplyValue : undefined)

//         transformedUser = {
//           ...transformedUser,
//           projectMaterials: keepMaterials.length > 0 ? keepMaterials : transformedUser.projectMaterials,
//           totalSupplyValue: keepSupply ?? transformedUser.totalSupplyValue,
//           selectedProjectId:
//             prevUser?.selectedProjectId ?? editForm.selectedProjectId ?? transformedUser.selectedProjectId,
//         }
//         // If supply value is still missing/zero but we have materials, compute from them
//         if (
//           (transformedUser.totalSupplyValue === undefined || transformedUser.totalSupplyValue === 0) &&
//           Array.isArray(transformedUser.projectMaterials) &&
//           transformedUser.projectMaterials.length > 0
//         ) {
//           transformedUser.totalSupplyValue = transformedUser.projectMaterials.reduce(
//             (s: number, m: any) => s + Number(m.amount || m.totalAmount || 0),
//             0,
//           )
//         }
//         transformedUser.dueAmount = calculateDueAmount(transformedUser)
//       } else {
//         transformedUser.dueAmount = calculateDueAmount(transformedUser)
//       }

//       setUsers((prev) => prev.map((u) => (u._id === transformedUser._id ? transformedUser : u)))
//       // Refresh supplierMaterials cache for this supplier based on preserved materials
//       if (editForm.role === "supplier") {
//         const mats = Array.isArray(transformedUser.projectMaterials) ? transformedUser.projectMaterials : []
//         if (mats.length > 0) {
//           const grouped: Record<string, any[]> = {}
//           for (const m of mats) {
//             const pid = normalizeId((m as any).projectId)
//             if (!grouped[pid]) grouped[pid] = []
//             grouped[pid].push(m)
//           }
//           setSupplierMaterials((prev) => {
//             const next = { ...prev }
//             for (const pid of Object.keys(grouped)) {
//               next[`${userId}-${pid}`] = grouped[pid]
//             }
//             return next
//           })
//         }
//       }

//       if (paymentAmount > 0) {
//         try {
//           let payrollData: any = {
//             user: userId,
//             userRole: editForm.role,
//             amount: paymentAmount,
//             paymentDate: new Date(),
//             status: "paid",
//             notes: `Payment of ₹${paymentAmount} recorded for ${editForm.role} ${editForm.name}.`,
//           }
//           if (editForm.role === "supplier") {
//             const allMaterials = Array.isArray(editForm.projectMaterials) ? editForm.projectMaterials : []
//             const materialsForScope = editForm.selectedProjectId
//               ? allMaterials.filter((m) => normalizeId(m.projectId) === normalizeId(editForm.selectedProjectId))
//               : allMaterials
//             const computedTotalSupply = materialsForScope.reduce(
//               (s, m) => s + Number(m.amount || m.totalAmount || 0),
//               0,
//             )
//             payrollData = {
//               ...payrollData,
//               supplierMaterials: materialsForScope.map((m) => ({
//                 _id: m._id,
//                 projectId: m.projectId,
//                 projectName: m.projectName,
//                 materialType: m.materialType,
//                 quantity: Number(m.quantity || 0),
//                 pricePerUnit: Number(m.pricePerUnit || 0),
//                 totalAmount: Number(m.totalAmount || m.amount || 0),
//                 amount: Number(m.totalAmount || m.amount || 0),
//                 paidAmount: Number(m.paidAmount || 0),
//                 dueAmount: Number(m.dueAmount || (m.totalAmount || m.amount || 0) - Number(m.paidAmount || 0)),
//                 createdAt: m.createdAt,
//               })),
//               totalSupplyValue: Number(editForm.totalSupplyValue || computedTotalSupply || 0),
//               dueAmount: Math.max(
//                 0,
//                 Number(editForm.totalSupplyValue || computedTotalSupply || 0) - Number(editForm.totalPaid || 0),
//               ),
//             }
//           }

//           await fetch("/api/payroll", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(payrollData),
//           })
//         } catch (payrollError) {
//           console.warn("Failed to log payroll transaction:", payrollError)
//         }
//       }

//       setEditForm(null)
//       setEditingId(null)
//       toast({
//         description: `${editForm.role.charAt(0).toUpperCase() + editForm.role.slice(1)} ${editForm.name} updated successfully!`,
//       })
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
//       toast({ variant: "destructive", description: `Failed to save ${editForm.role}. Error: ${errorMessage}` })
//     } finally {
//       setIsSaving(false)
//     }
//   }

//   const handleInputChange = (field: string, value: string | number) => {
//     setEditForm((prev) => {
//       if (!prev) return prev
//       const newForm: User = { ...prev, [field]: value as any }
//       const numericValue = Number(value) || 0

//       switch (prev.role) {
//         case "employee":
//         case "supervisor": {
//           const currentSalary = field === "salary" ? numericValue : Number(newForm.salary) || 0
//           const currentPaid = field === "totalPaid" ? numericValue : Number(newForm.totalPaid) || 0
//           newForm.salary = currentSalary
//           newForm.totalPaid = currentPaid
//           newForm.dueAmount = Math.max(0, currentSalary - currentPaid)
//           break
//         }
//         case "client": {
//           const currentProjectAmount =
//             field === "projectTotalAmount" ? numericValue : Number(newForm.projectTotalAmount) || 0
//           const currentClientPaid = field === "totalPaid" ? numericValue : Number(newForm.totalPaid) || 0
//           newForm.projectTotalAmount = currentProjectAmount
//           newForm.totalPaid = currentClientPaid
//           newForm.dueAmount = Math.max(0, currentProjectAmount - currentClientPaid)
//           break
//         }
//         case "supplier": {
//           if (field === "totalPaid") {
//             const newTotalPaid = numericValue
//             newForm.totalPaid = newTotalPaid

//             if (newForm.selectedProjectId && newForm.projectMaterials) {
//               const pmats = newForm.projectMaterials.filter(
//                 (m) => normalizeId(m.projectId) === normalizeId(newForm.selectedProjectId),
//               )
//               const ptotal = pmats.reduce((s, m) => s + Number(m.amount || m.totalAmount || 0), 0)
//               const allTotal = newForm.projectMaterials.reduce((s, m) => s + Number(m.amount || m.totalAmount || 0), 0)
//               // proportional paid if individual paid not edited
//               const ppaidExplicit = pmats.reduce((s, m) => s + Number(m.paidAmount || 0), 0)
//               const ppaid = ppaidExplicit > 0 || allTotal === 0 ? ppaidExplicit : (ptotal / allTotal) * newTotalPaid
//               newForm.dueAmount = Math.max(0, ptotal - ppaid)
//             } else {
//               const allTotal = (newForm.projectMaterials || []).reduce(
//                 (s, m) => s + Number(m.amount || m.totalAmount || 0),
//                 0,
//               )
//               const baseTotal = allTotal || Number(newForm.totalSupplyValue || 0)
//               newForm.dueAmount = Math.max(0, baseTotal - newTotalPaid)
//             }

//             // distribute paid per material proportionally for UI feedback
//             if (newForm.projectMaterials && newForm.projectMaterials.length > 0) {
//               const totalMaterialValue = newForm.projectMaterials.reduce(
//                 (sum, m) => sum + Number(m.amount || m.totalAmount || 0),
//                 0,
//               )
//               if (totalMaterialValue > 0) {
//                 newForm.projectMaterials = newForm.projectMaterials.map((material) => {
//                   const part = Number(material.amount || material.totalAmount || 0)
//                   const mp = (part / totalMaterialValue) * newTotalPaid
//                   return {
//                     ...material,
//                     paidAmount: mp,
//                     dueAmount: Math.max(0, part - mp),
//                   }
//                 })
//               }
//             }
//           } else if (field === "totalSupplyValue") {
//             newForm.totalSupplyValue = numericValue
//             newForm.dueAmount = Math.max(0, numericValue - (newForm.totalPaid || 0))
//           }
//           break
//         }
//       }

//       if (field === "totalPaid" && numericValue > (prev.totalPaid || 0)) {
//         newForm.lastPaymentDate = new Date().toISOString()
//       }
//       return newForm
//     })
//   }

//   const handleExportToPDF = () => {
//     setIsExporting(true)
//     try {
//       const doc = new jsPDF()
//       const currentDate = new Date().toLocaleDateString()

//       doc.setFontSize(18)
//       doc.text("Payroll Management Report", 14, 22)
//       doc.setFontSize(10)
//       doc.text(`Generated on: ${currentDate}`, 14, 30)

//       const roles: Array<User["role"]> = ["employee", "supervisor", "client", "supplier"]
//       let startY = 40

//       roles.forEach((role) => {
//         const roleUsers = users.filter((user) => user.role === role)
//         if (roleUsers.length === 0) return

//         doc.setFontSize(14)
//         doc.text(`${role.charAt(0).toUpperCase() + role.slice(1)}s`, 14, startY)
//         startY += 10

//         const headers =
//           role === "supplier"
//             ? ["Name", "Email", "Materials", "Total Value", "Paid", "Due", "Status"]
//             : ["Name", "Email", "Phone", "Amount", "Total Paid", "Due", "Last Payment", "Status"]
//         const columnWidths = role === "supplier" ? [25, 35, 40, 25, 20, 20, 15] : [25, 40, 25, 20, 20, 20, 25, 15]

//         let x = 5
//         doc.setFontSize(9)
//         // @ts-ignore jspdf types
//         doc.setFont("helvetica", "bold")
//         headers.forEach((header, i) => {
//           doc.text(header, x, startY)
//           x += columnWidths[i]
//         })
//         startY += 4
//         doc.line(5, startY, 5 + columnWidths.reduce((a, b) => a + b, 0), startY)
//         startY += 4
//         // @ts-ignore jspdf types
//         doc.setFont("helvetica", "normal")

//         roleUsers.forEach((user) => {
//           if (startY > 280) {
//             doc.addPage()
//             startY = 20
//           }
//           let row: string[]

//           if (role === "supplier") {
//             const materialsText =
//               user.projectMaterials && user.projectMaterials.length > 0
//                 ? user.projectMaterials
//                     .slice(0, 2)
//                     .map((m) => `${m.materialType} (${m.quantity}×₹${m.pricePerUnit})`)
//                     .join(", ") + (user.projectMaterials.length > 2 ? "..." : "")
//                 : "No materials"
//             row = [
//               user.name || "N/A",
//               user.email || "N/A",
//               materialsText,
//               `₹${(user.totalSupplyValue || 0).toFixed(2)}`,
//               `₹${user.totalPaid?.toFixed(2) || "0.00"}`,
//               `₹${user.dueAmount?.toFixed(2) || "0.00"}`,
//               user.status || "N/A",
//             ]
//           } else {
//             let amount = "N/A"
//             switch (user.role) {
//               case "employee":
//               case "supervisor":
//                 amount = user.salary ? `₹${user.salary.toFixed(2)}` : "N/A"
//                 break
//               case "client":
//                 amount = user.projectTotalAmount ? `₹${user.projectTotalAmount.toFixed(2)}` : "N/A"
//                 break
//             }
//             row = [
//               user.name || "N/A",
//               user.email || "N/A",
//               user.phone || "N/A",
//               amount,
//               `₹${user.totalPaid?.toFixed(2) || "0.00"}`,
//               `₹${user.dueAmount?.toFixed(2) || "0.00"}`,
//               user.lastPaymentDate ? new Date(user.lastPaymentDate).toLocaleDateString() : "N/A",
//               user.status || "N/A",
//             ]
//           }

//           x = 5
//           row.forEach((cell, i) => {
//             const splitText = doc.splitTextToSize(cell, columnWidths[i] - 2)
//             doc.text(splitText, x + 1, startY + 5)
//             x += columnWidths[i]
//           })
//           startY += 10
//           if (startY < 280) {
//             doc.line(5, startY, 5 + columnWidths.reduce((a, b) => a + b, 0), startY)
//             startY += 2
//           }
//         })

//         startY += 15
//       })

//       doc.save(`payroll-report-${new Date().toISOString().split("T")[0]}.pdf`)
//       toast({ description: "PDF exported successfully!" })
//     } catch (error) {
//       console.error("Error generating PDF:", error)
//       toast({ variant: "destructive", description: "Failed to generate PDF" })
//     } finally {
//       setIsExporting(false)
//     }
//   }

//   const handleCancel = () => {
//     setEditingId(null)
//     setEditForm(null)
//   }

//   const getStatsForRole = (role: User["role"]) => {
//     const roleUsers = users.filter((user) => user.role === role)
//     let totalAmount = 0
//     let totalDue = 0
//     roleUsers.forEach((user) => {
//       switch (role) {
//         case "employee":
//         case "supervisor":
//           totalAmount += user.salary || 0
//           break
//         case "client":
//           totalAmount += user.projectTotalAmount || 0
//           break
//         case "supplier":
//           totalAmount +=
//             user.totalSupplyValue ||
//             user.projectMaterials?.reduce((sum: number, m: any) => sum + (m.amount || m.totalAmount || 0), 0) ||
//             0
//           break
//       }
//       totalDue += user.dueAmount || 0
//     })
//     return { totalAmount, totalDue, count: roleUsers.length }
//   }

//   const stats = [
//     {
//       title: "Supervisors",
//       role: "supervisor" as const,
//       ...getStatsForRole("supervisor"),
//       description: "Supervisor salaries",
//       color: "bg-purple-100 text-purple-800",
//     },
//     {
//       title: "Employees",
//       role: "employee" as const,
//       ...getStatsForRole("employee"),
//       description: "Employee salaries",
//       color: "bg-green-100 text-green-800",
//     },
//     {
//       title: "Clients",
//       role: "client" as const,
//       ...getStatsForRole("client"),
//       description: "Project values",
//       color: "bg-blue-100 text-blue-800",
//     },
//     {
//       title: "Suppliers",
//       role: "supplier" as const,
//       ...getStatsForRole("supplier"),
//       description: "Material costs",
//       color: "bg-amber-100 text-amber-800",
//     },
//   ]

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat("en-IN", {
//       style: "currency",
//       currency: "INR",
//       maximumFractionDigits: 0,
//     }).format(amount || 0)
//   }

//   const getAmountForRole = (user: User) => {
//     switch (user.role) {
//       case "employee":
//       case "supervisor":
//         return user.salary || 0
//       case "client":
//         return user.projectTotalAmount || 0
//       case "supplier":
//         return (
//           user.totalSupplyValue ||
//           user.projectMaterials?.reduce((sum: number, m: any) => sum + (m.amount || m.totalAmount || 0), 0) ||
//           0
//         )
//       default:
//         return 0
//     }
//   }

//   const getAmountFieldName = (role: string) => {
//     switch (role) {
//       case "client":
//         return "Project Amount"
//       case "supplier":
//         return "Material Cost"
//       default:
//         return "Salary"
//     }
//   }

//   const getSupplierProjectsWithMaterials = (user: User) => {
//     if (!user.projectMaterials) return []
//     const projectIds = new Set(user.projectMaterials.map((m) => normalizeId(m.projectId)))
//     return projects.filter((project) => projectIds.has(normalizeId(project._id)))
//   }

//   const handleMaterialChange = (userId: string, materialId: string, field: string, value: string | number) => {
//     setUsers((prevUsers) =>
//       prevUsers.map((user) => {
//         if (user._id !== userId) return user
//         const updatedMaterials = (user.projectMaterials || []).map((material) =>
//           material._id === materialId ? { ...material, [field]: value } : material,
//         )
//         return { ...user, projectMaterials: updatedMaterials }
//       }),
//     )
//     setEditForm((prev) => {
//       if (!prev) return prev
//       const updatedMaterials = (prev.projectMaterials || []).map((material) =>
//         material._id === materialId ? { ...material, [field]: value } : material,
//       )
//       return { ...prev, projectMaterials: updatedMaterials }
//     })
//   }

//   const handleDeleteMaterial = (userId: string, materialId: string) => {
//     setUsers((prevUsers) =>
//       prevUsers.map((user) => {
//         if (user._id !== userId) return user
//         const updatedMaterials = (user.projectMaterials || []).filter((material) => material._id !== materialId)
//         return { ...user, projectMaterials: updatedMaterials }
//       }),
//     )
//     setEditForm((prev) => {
//       if (!prev) return prev
//       const updatedMaterials = (prev.projectMaterials || []).filter((material) => material._id !== materialId)
//       return { ...prev, projectMaterials: updatedMaterials }
//     })
//   }

//   const handleAddMaterial = (userId: string, projectId: string) => {
//     const project = projects.find((p) => p._id === projectId)
//     if (!project) return

//     setUsers((prevUsers) =>
//       prevUsers.map((user) => {
//         if (user._id !== userId) return user
//         const newMaterial = {
//           _id: `${userId}-${projectId}-${Date.now()}`,
//           projectId: project._id,
//           projectName: project.name,
//           materialType: "New Material",
//           quantity: 1,
//           pricePerUnit: 100,
//           amount: 100,
//           totalAmount: 100,
//           paidAmount: 0,
//           dueAmount: 100,
//           createdAt: new Date().toISOString(),
//         }
//         const updatedMaterials = [...(user.projectMaterials || []), newMaterial]
//         return { ...user, projectMaterials: updatedMaterials }
//       }),
//     )

//     setEditForm((prev) => {
//       if (!prev) return prev
//       const newMaterial = {
//         _id: `${userId}-${projectId}-${Date.now()}`,
//         projectId: project._id,
//         projectName: project.name,
//         materialType: "New Material",
//         quantity: 1,
//         pricePerUnit: 100,
//         amount: 100,
//         totalAmount: 100,
//         paidAmount: 0,
//         dueAmount: 100,
//         createdAt: new Date().toISOString(),
//       }
//       const updatedMaterials = [...(prev.projectMaterials || []), newMaterial]
//       return { ...prev, projectMaterials: updatedMaterials }
//     })
//   }

//   const handleFormChange = (field: string, value: string) => {
//     setEditForm((prev) => {
//       if (!prev) return prev
//       return { ...prev, [field]: value }
//     })
//   }

//   const getAmountFieldKey = (role: string) => {
//     switch (role) {
//       case "employee":
//       case "supervisor":
//         return "salary"
//       case "client":
//         return "projectTotalAmount"
//       case "supplier":
//         return "totalSupplyValue"
//       default:
//         return ""
//     }
//   }

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString)
//     return date.toLocaleDateString()
//   }

//   const handleDelete = async (userId: string) => {
//     try {
//       const userToDelete = users.find((user) => user._id === userId)
//       if (!userToDelete) {
//         toast({ variant: "destructive", description: "User not found." })
//         return
//       }

//       const apiPath = `/api/${userToDelete.role.toLowerCase()}s`
//       const response = await fetch(`${apiPath}/${userId}`, { method: "DELETE" })

//       if (!response.ok) {
//         const errorText = await response.text()
//         throw new Error(`Failed to delete ${userToDelete.role}: ${response.status} - ${errorText}`)
//       }

//       setUsers((prev) => prev.filter((user) => user._id !== userId))
//       setFilteredUsers((prev) => prev.filter((user) => user._id !== userId))
//       toast({ description: `${userToDelete.role} ${userToDelete.name} deleted successfully!` })
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
//       toast({ variant: "destructive", description: `Failed to delete user. Error: ${errorMessage}` })
//     }
//   }

//   const updatePayrollAmount = async (recordId: string, newAmount: number) => {
//     try {
//       const response = await fetch(`/api/payroll/${recordId}`, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ amount: newAmount }),
//       })

//       if (response.ok) {
//         // Immediately update local state to reflect changes in filtered view
//         setPayrollRecords((prev) =>
//           prev.map((record) =>
//             record._id === recordId ? { ...record, amount: newAmount, updatedAt: new Date().toISOString() } : record,
//           ),
//         )

//         // Refresh aggregates for suppliers
//         const updatedRecords = await fetchPayrollRecords()
//         const { agg } = buildSupplierAggregates(updatedRecords)
//         setPayrollBySupplier(agg)

//         toast.success("Payment amount updated successfully")
//       } else {
//         toast.error("Failed to update payment amount")
//       }
//     } catch (error) {
//       console.error("Error updating payroll amount:", error)
//       toast.error("Error updating payment amount")
//     }
//   }

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center p-12">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//         <div>
//           <h2 className="text-2xl font-bold tracking-tight">Payroll Management</h2>
//           <p className="text-muted-foreground">Manage payments, salaries, and financial transactions</p>
//         </div>
//         <div className="flex items-center gap-2">
//           <Button
//             variant="outline"
//             size="sm"
//             className="h-8 gap-1 bg-transparent"
//             onClick={handleExportToPDF}
//             disabled={isExporting}
//           >
//             <Download className="h-3.5 w-3.5" />
//             <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
//               {isExporting ? "Exporting..." : "Export"}
//             </span>
//           </Button>
//           <Button size="sm" className="h-8 gap-1">
//             <PlusCircle className="h-3.5 w-3.5" />
//             <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Payment</span>
//           </Button>
//         </div>
//       </div>

//       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//         {stats.map((stat, index) => (
//           <Card
//             key={index}
//             className={`shadow-sm cursor-pointer transition-all hover:scale-105 ${
//               selectedRole === stat.role ? `${stat.color}` : ""
//             }`}
//             onClick={() => setSelectedRole(stat.role)}
//           >
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
//               <div className="h-8 w-8 rounded-full flex items-center justify-center">{stat.count}</div>
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{formatCurrency(stat.totalAmount)}</div>
//               <p className="text-xs text-muted-foreground">
//                 {stat.totalDue > 0 ? `${formatCurrency(stat.totalDue)} due` : "All caught up"}
//               </p>
//               <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       <Card>
//         <div className="p-4 border-b">
//           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//             <div className="relative w-full md:w-64">
//               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
//               <Input
//                 type="search"
//                 placeholder={selectedRole === "supplier" ? "Search suppliers or materials..." : "Search users..."}
//                 className="w-full pl-8"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="relative">
//                 <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   type="date"
//                   className="pl-8 w-[180px]"
//                   value={selectedDate}
//                   onChange={(e) => setSelectedDate(e.target.value)}
//                   aria-label="Filter by date"
//                 />
//               </div>
//               {selectedDate && (
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   className="h-8 gap-1 bg-transparent"
//                   onClick={() => setSelectedDate("")}
//                 >
//                   <X className="h-3.5 w-3.5" />
//                   <span>Clear</span>
//                 </Button>
//               )}
//               <Button variant="outline" size="sm" className="h-8 gap-1 bg-transparent">
//                 <Filter className="h-3.5 w-3.5" />
//                 <span>Filter</span>
//               </Button>
//             </div>
//           </div>
//         </div>

//         {selectedDate && (
//           <div className="px-4 py-3 border-b bg-muted/30">
//             <div className="flex items-center justify-between">
//               <div>
//                 <div className="text-sm font-medium">
//                   Payments on {new Date(selectedDate + "T00:00:00").toLocaleDateString()}
//                 </div>
//                 <div className="text-xs text-muted-foreground">
//                   {filteredPayroll.length} record{filteredPayroll.length !== 1 ? "s" : ""} • Total{" "}
//                   {new Intl.NumberFormat("en-IN", {
//                     style: "currency",
//                     currency: "INR",
//                     maximumFractionDigits: 0,
//                   }).format(filteredTotalAmount)}
//                 </div>
//               </div>
//               <Button variant="ghost" size="sm" onClick={() => setSelectedDate("")}>
//                 <X className="w-4 h-4 mr-1" /> Clear
//               </Button>
//             </div>

//             <div className="mt-3 rounded-md border bg-background">
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Time</TableHead>
//                     <TableHead>Recipient</TableHead>
//                     <TableHead>Role</TableHead>
//                     <TableHead className="text-right">Amount</TableHead>
//                     <TableHead>Details</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {filteredPayroll.length > 0 ? (
//                     filteredPayroll.map((rec) => {
//                       const timeStr = (() => {
//                         const d = new Date(rec.paymentDate || Date.now())
//                         return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
//                       })()
//                       const role = (rec.userRole || rec.user_role || "").toString().toLowerCase()
//                       const details =
//                         role === "supplier"
//                           ? (() => {
//                               const mats: any[] = rec.supplierMaterials || rec.materials || []
//                               const first = mats
//                                 .slice(0, 2)
//                                 .map((m) => `${m.materialType || m.name} (${m.quantity || 0})`)
//                                 .join(", ")
//                               const more = mats.length > 2 ? ` +${mats.length - 2} more` : ""
//                               return first || "Materials snapshot unavailable" + more
//                             })()
//                           : rec.notes || "—"
//                       return (
//                         <TableRow key={rec._id}>
//                           <TableCell>{timeStr}</TableCell>
//                           <TableCell className="font-medium">
//                             {rec.user?.name || rec.userName || rec.user || "N/A"}
//                           </TableCell>
//                           <TableCell>
//                             <Badge variant="outline" className="capitalize">
//                               {role || "unknown"}
//                             </Badge>
//                           </TableCell>
//                           <TableCell className="text-right">
//                             <div className="flex items-center justify-end gap-2">
//                               <Input
//                                 type="number"
//                                 value={rec.amount || 0}
//                                 onChange={(e) => {
//                                   const newAmount = Number.parseFloat(e.target.value) || 0
//                                   updatePayrollAmount(rec._id, newAmount)
//                                 }}
//                                 className="w-24 text-right text-sm"
//                                 min="0"
//                                 step="0.01"
//                               />
//                               <span className="text-xs text-muted-foreground">INR</span>
//                             </div>
//                           </TableCell>
//                           <TableCell className="text-xs text-muted-foreground">{details}</TableCell>
//                         </TableRow>
//                       )
//                     })
//                   ) : (
//                     <TableRow>
//                       <TableCell colSpan={5} className="h-16 text-center text-sm text-muted-foreground">
//                         No payments recorded on this date.
//                       </TableCell>
//                     </TableRow>
//                   )}
//                 </TableBody>
//               </Table>
//             </div>
//           </div>
//         )}

//         {selectedDate && (
//           <div className="px-4 py-2 border-t bg-muted/20">
//             <div className="flex items-center justify-between text-xs text-muted-foreground">
//               <span>Showing payments for {new Date(selectedDate + "T00:00:00").toLocaleDateString()}</span>
//               <span>Last updated: {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
//             </div>
//           </div>
//         )}

//         <div className="rounded-b-md border">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Name</TableHead>
//                 {selectedRole === "supplier" ? (
//                   <>
//                     <TableHead>Materials & Quantities</TableHead>
//                     <TableHead>Active Projects</TableHead>
//                     {/* <TableHead>Supply Status</TableHead> */}
//                     <TableHead className="text-right">Total Value</TableHead>
//                     <TableHead className="text-right">Amount</TableHead>
//                     <TableHead className="text-right">Due</TableHead>
//                   </>
//                 ) : (
//                   <>
//                     <TableHead>Email</TableHead>
//                     <TableHead className="text-right">{getAmountFieldName(selectedRole)}</TableHead>
//                     <TableHead className="text-right">Paid</TableHead>
//                     <TableHead className="text-right">Due</TableHead>
//                     <TableHead>Last Payment</TableHead>
//                   </>
//                 )}
//                 <TableHead>Status</TableHead>
//                 <TableHead className="w-[100px]">Action</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {filteredUsers.length > 0 ? (
//                 filteredUsers.map((user) => (
//                   <TableRow key={user._id}>
//                     <TableCell className="font-medium">
//                       <div className="font-medium">{user.name}</div>
//                       {user.phone && <div className="text-xs text-muted-foreground">{user.phone}</div>}
//                     </TableCell>

//                     {selectedRole === "supplier" ? (
//                       <>
//                         <TableCell className="max-w-[200px]">
//                           {user.projectMaterials?.length > 0 ? (
//                             <div className="space-y-1">
//                               {user.projectMaterials.slice(0, 3).map((material, idx) => (
//                                 <div key={idx} className="text-sm">
//                                   <span className="font-medium">{material.materialType}</span>
//                                   <span className="text-muted-foreground">:{material.quantity}</span>
//                                 </div>
//                               ))}
//                               {user.projectMaterials.length > 3 && (
//                                 <div className="text-xs text-muted-foreground">
//                                   +{user.projectMaterials.length - 3} more items
//                                 </div>
//                               )}
//                             </div>
//                           ) : (
//                             <span className="text-muted-foreground text-sm">No materials</span>
//                           )}
//                         </TableCell>

//                         <TableCell>
//                           <div className="space-y-1">
//                             {(() => {
//                               const supplierProjects = getSupplierProjectsWithMaterials(user)
//                               return supplierProjects.length > 0 ? (
//                                 <div className="flex flex-wrap gap-1">
//                                   {supplierProjects.slice(0, 2).map((project) => (
//                                     <Badge key={project._id} variant="secondary" className="text-xs">
//                                       {project.name}
//                                     </Badge>
//                                   ))}
//                                   {supplierProjects.length > 2 && (
//                                     <Badge variant="outline" className="text-xs">
//                                       +{supplierProjects.length - 2} more
//                                     </Badge>
//                                   )}
//                                 </div>
//                               ) : (
//                                 <span className="text-sm text-muted-foreground">No materials added</span>
//                               )
//                             })()}
//                           </div>
//                         </TableCell>

//                         {/* <TableCell>
//                           {(() => {
//                             const materials = user.projectMaterials || []
//                             if (materials.length === 0) {
//                               return <Badge variant="secondary">No supplies</Badge>
//                             }
//                             const totalValue = materials.reduce((sum, m) => sum + Number(m.amount || 0), 0)
//                             const totalPaid = materials.reduce((sum, m) => sum + Number(m.paidAmount || 0), 0)

//                             if (totalPaid >= totalValue && totalValue > 0) {
//                               return <Badge className="bg-green-100 text-green-800">Fully Paid</Badge>
//                             } else if (totalPaid > 0) {
//                               return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>
//                             } else {
//                               return <Badge className="bg-red-100 text-red-800">Unpaid</Badge>
//                             }
//                           })()}
//                         </TableCell> */}

//                         <TableCell className="text-right">
//                           {editingId === user._id && editForm ? (
//                             <div className="space-y-2">
//                               <span className="font-medium">
//                                 {formatCurrency(
//                                   (editForm.projectMaterials || []).reduce((sum, m) => sum + Number(m.amount || 0), 0),
//                                 )}
//                               </span>
//                             </div>
//                           ) : (
//                             <div>
//                               <div className="font-medium">
//                                 {formatCurrency(
//                                   (user.projectMaterials || []).reduce((sum, m) => sum + Number(m.amount || 0), 0),
//                                 )}
//                               </div>
//                             </div>
//                           )}
//                         </TableCell>

//                         <TableCell className="text-right">
//                           {editingId === user._id && editForm ? (
//                             <div className="space-y-1">
//                               <Input
//                                 type="number"
//                                 value={editForm.totalPaid || ""}
//                                 onChange={(e) => handleFormChange("totalPaid", e.target.value)}
//                                 className="h-7 text-right text-sm"
//                                 placeholder="Paid amount"
//                               />
//                             </div>
//                           ) : (
//                             <div>
//                               <div className="font-medium">{formatCurrency(user.totalPaid || 0)}</div>
//                             </div>
//                           )}
//                         </TableCell>
//                       </>
//                     ) : (
//                       <>
//                         <TableCell>{user.email}</TableCell>
//                         <TableCell className="text-right">
//                           {editingId === user._id && editForm ? (
//                             <Input
//                               type="number"
//                               value={editForm[getAmountFieldKey(selectedRole)] || ""}
//                               onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                                 handleInputChange(getAmountFieldKey(selectedRole), Number(e.target.value))
//                               }
//                               className="w-24"
//                             />
//                           ) : (
//                             formatCurrency(user[getAmountFieldKey(selectedRole)] || 0)
//                           )}
//                         </TableCell>
//                         <TableCell className="text-right">
//                           {editingId === user._id && editForm ? (
//                             <Input
//                               type="number"
//                               value={editForm.totalPaid || ""}
//                               onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                                 handleInputChange("totalPaid", Number(e.target.value))
//                               }
//                               className="w-24"
//                             />
//                           ) : (
//                             formatCurrency(user.totalPaid)
//                           )}
//                         </TableCell>
//                         <TableCell className="text-right">
//                           {editingId === user._id && editForm ? (
//                             <span className="text-muted-foreground">{formatCurrency(editForm.dueAmount || 0)}</span>
//                           ) : (
//                             formatCurrency(user.dueAmount || 0)
//                           )}
//                         </TableCell>
//                         <TableCell>
//                           {user.lastPaymentDate ? (
//                             <div>
//                               <div className="text-sm">{formatDate(user.lastPaymentDate)}</div>
//                               {/* <div className="text-xs text-muted-foreground">
//                                 {formatCurrency(user.lastPaymentAmount || 0)}
//                               </div> */}
//                             </div>
//                           ) : (
//                             <span className="text-muted-foreground">No payments</span>
//                           )}
//                         </TableCell>
//                       </>
//                     )}

//                     <TableCell>
//                       <div>
//                         <div className="text-right">{formatCurrency(user.dueAmount || 0)}</div>
//                       </div>
//                     </TableCell>

//                     <TableCell>
//                       {selectedRole === "supplier" ? (
//                         (() => {
//                           const totalValue = (user.projectMaterials || []).reduce(
//                             (sum, m) => sum + Number(m.amount || m.totalAmount || 0),
//                             0,
//                           )
//                           const totalPaid = user.totalPaid || 0
//                           const dueAmount = Math.max(0, totalValue - totalPaid)

//                           if (dueAmount === 0 && totalValue > 0) {
//                             return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>
//                           } else if (dueAmount > 0) {
//                             return <Badge variant="destructive">Outstanding</Badge>
//                           } else {
//                             return <Badge variant="secondary">No Supply</Badge>
//                           }
//                         })()
//                       ) : (
//                         <Badge
//                           className={
//                             user.dueAmount && user.dueAmount > 0
//                               ? "bg-red-100 text-red-800 hover:bg-red-100"
//                               : "bg-green-100 text-green-800 hover:bg-green-100"
//                           }
//                         >
//                           {user.dueAmount && user.dueAmount > 0 ? "Due" : "Paid"}
//                         </Badge>
//                       )}
//                     </TableCell>

//                     <TableCell>
//                       <div className="flex items-center gap-1">
//                         {editingId === user._id ? (
//                           <>
//                             <Button size="sm" onClick={handleSave} className="h-7 px-2">
//                               <Check className="h-3 w-3" />
//                             </Button>
//                             <Button
//                               size="sm"
//                               variant="outline"
//                               onClick={handleCancel}
//                               className="h-7 px-2 bg-transparent"
//                             >
//                               <X className="h-3 w-3" />
//                             </Button>
//                           </>
//                         ) : (
//                           <>
//                             <Button size="sm" variant="outline" onClick={() => handleEdit(user)} className="h-7 px-2">
//                               <Edit className="h-3 w-3" />
//                             </Button>
//                             <Button
//                               size="sm"
//                               variant="outline"
//                               onClick={() => handleDelete(user._id)}
//                               className="h-7 px-2 text-red-600 hover:text-red-700"
//                             >
//                               <Trash2 className="h-3 w-3" />
//                             </Button>
//                           </>
//                         )}
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               ) : (
//                 <TableRow>
//                   <TableCell colSpan={selectedRole === "supplier" ? 12 : 9} className="h-24 text-center">
//                     {`No users found for "${selectedRole}".`}
//                   </TableCell>
//                 </TableRow>
//               )}
//             </TableBody>
//           </Table>
//         </div>
//       </Card>
//     </div>
//   )
// }

// export default PayrollManagement


"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Search, Download, Filter, X, Edit, Calendar, Check, Trash2, Plus } from "lucide-react"
import { jsPDF } from "jspdf"
import { useToast } from "@/hooks/use-toast"

type User = {
  _id: string
  name: string
  email: string
  role: "client" | "supervisor" | "supplier" | "employee"
  salary?: number
  projectTotalAmount?: number
  supplierAmount?: number
  totalSupplyValue?: number
  totalPaid: number
  dueAmount: number
  lastPaymentDate?: string
  status: "active" | "inactive"
  phone?: string
  address?: string
  projectMaterials?: Array<{
    projectId: string
    projectName?: string
    materialType: string
    quantity: number
    pricePerUnit: number
    totalAmount: number
    amount: number
    paidAmount?: number
    dueAmount?: number
    createdAt?: string
  }>
  selectedProjectId?: string
  [key: string]: any
}

// 1) Move normalizeId above any usage (fix hoisting issue)
function normalizeId(id: any): string {
  try {
    if (!id) return ""
    if (typeof id === "string") return id
    if (typeof id === "number") return String(id)
    if (typeof id === "object") {
      if ((id as any).$oid) return String((id as any).$oid)
      if ((id as any)._id) return normalizeId((id as any)._id)
      if (typeof (id as any).toHexString === "function") return (id as any).toHexString()
      if (typeof (id as any).toString === "function") {
        const s = (id as any).toString()
        if (s && s !== "[object Object]") return s
      }
    }
    return String(id)
  } catch {
    return ""
  }
}

function toYMD(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function normalizeDateString(input?: string) {
  if (!input) return ""
  const d = new Date(input)
  if (isNaN(d.getTime())) return ""
  return toYMD(d)
}

const PayrollManagement = () => {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<"supervisor" | "employee" | "client" | "supplier" | "all">(
    "supervisor",
  )
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<User | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [selectedExportSections, setSelectedExportSections] = useState<string[]>(["all"])
  const [projects, setProjects] = useState<{ _id: string; name: string }[]>([])
  const [supplierMaterials, setSupplierMaterials] = useState<Record<string, any[]>>({})
  const [payrollBySupplier, setPayrollBySupplier] = useState<
    Record<string, { totalPaid: number; lastPaymentDate?: string }>
  >({})
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [payrollRecords, setPayrollRecords] = useState<any[]>([])

  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)
  const [addPaymentForm, setAddPaymentForm] = useState({
    role: "",
    userId: "",
    amount: "",
    description: "",
  })

  // Memoized cache: userId-projectId -> materials[]
  const materialsCache = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const u of users) {
      if (u.role !== "supplier" || !Array.isArray(u.projectMaterials)) continue
      const groups: Record<string, any[]> = {}
      for (const m of u.projectMaterials) {
        const pid = normalizeId(m.projectId)
        if (!groups[pid]) groups[pid] = []
        groups[pid].push(m)
      }
      for (const pid of Object.keys(groups)) {
        map[`${u._id}-${pid}`] = groups[pid]
      }
    }
    return map
  }, [users])

  const filteredPayroll = useMemo(() => {
    if (!selectedDate) return []
    const ymd = selectedDate
    // Filter records by date and ensure fresh data after any edits
    return payrollRecords.filter((r) => {
      const recordDate = normalizeDateString(r.paymentDate)
      return recordDate === ymd
    })
  }, [selectedDate, payrollRecords]) // Added payrollRecords dependency for real-time updates

  const filteredTotalAmount = useMemo(
    () => filteredPayroll.reduce((s, r) => s + Number(r.amount || 0), 0),
    [filteredPayroll],
  )

  // Helper function to fetch with basic checks
  const fetchWithErrorHandling = async (url: string) => {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) throw new Error("Response is not JSON")
      return await response.json()
    } catch (error) {
      console.error(`Error fetching from ${url}:`, error)
      return []
    }
  }

  const fetchRoleData = async (url: string, role: User["role"]): Promise<User[]> => {
    try {
      const data = await fetchWithErrorHandling(url)
      if (!Array.isArray(data)) return []
      return data.map((item: any) => transformUserData(item, role))
    } catch (err) {
      console.warn(`Failed to fetch role data for ${role} from ${url}`, err)
      return []
    }
  }

  const fetchPayrollRecords = async (): Promise<any[]> => {
    try {
      const res = await fetch("/api/payroll", { cache: "no-store" })
      if (!res.ok) return []
      const data = await res.json()
      return Array.isArray(data) ? data : data ? [data] : []
    } catch (err) {
      console.warn("Failed to fetch payroll records", err)
      return []
    }
  }

  const buildSupplierAggregates = (records: any[]) => {
    const supplierRecords = Array.isArray(records)
      ? records.filter((r: any) => (r.userRole || r.user_role || "").toString().toLowerCase().includes("supplier"))
      : []

    const agg: Record<string, { totalPaid: number; lastPaymentDate?: string }> = {}
    const latestMaterialsBySupplier: Record<
      string,
      { materials: any[]; totalSupplyValue: number; dueAmount: number; __ts: number }
    > = {}

    for (const rec of supplierRecords) {
      const userId = (rec.user && (rec.user._id || rec.user.id)) || rec.user || rec.userId
      const key = normalizeId(userId)
      if (!key) continue

      const paid = Number(rec.amount || rec.totalPaid || 0)
      const date = rec.paymentDate || rec.createdAt

      if (!agg[key]) agg[key] = { totalPaid: 0, lastPaymentDate: date }
      agg[key].totalPaid += paid
      if (date && (!agg[key].lastPaymentDate || new Date(date) > new Date(agg[key].lastPaymentDate!))) {
        agg[key].lastPaymentDate = date
      }

      const mats: any[] = rec.supplierMaterials || rec.materials || []
      if (Array.isArray(mats) && mats.length > 0) {
        const recTime = new Date(date || rec.updatedAt || rec.createdAt || Date.now()).getTime()
        const existing = (latestMaterialsBySupplier as any)[key]?.__ts || 0
        if (recTime >= existing) {
          latestMaterialsBySupplier[key] = {
            materials: mats.map((m: any) => ({
              _id: m._id || undefined,
              projectId: (m.projectId && (m.projectId._id || m.projectId.id || m.projectId)) || m.project || "default",
              projectName: m.projectName || m.project?.name,
              materialType: m.materialType || m.name || "Unknown",
              quantity: Number(m.quantity || 0),
              pricePerUnit: Number(m.pricePerUnit || (m.totalAmount || m.amount || 0) / (m.quantity || 1)),
              totalAmount: Number(m.totalAmount || m.amount || 0),
              amount: Number(m.totalAmount || m.amount || 0),
              paidAmount: Number(m.paidAmount || 0),
              dueAmount: Number(m.dueAmount || (m.totalAmount || m.amount || 0) - Number(m.paidAmount || 0)),
              createdAt: m.supplyDate || m.date || m.createdAt,
            })),
            totalSupplyValue:
              Number(rec.totalSupplyValue) ||
              mats.reduce((s: number, m: any) => s + Number(m.totalAmount || m.amount || 0), 0) ||
              0,
            dueAmount: Number(rec.dueAmount || 0),
            __ts: recTime,
          }
        }
      }
    }
    return { agg, latestMaterialsBySupplier }
  }

  const handleProjectSelection = async (userId: string, projectId: string) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => (user._id === userId ? { ...user, selectedProjectId: projectId } : user)),
    )
    if (editForm && editForm._id === userId) {
      setEditForm({ ...editForm, selectedProjectId: projectId })
    }
    if (projectId) {
      await fetchSupplierMaterials(userId, projectId)
    }
  }

  const getProjectMaterials = (userId: string, projectId: string) => {
    const key = `${userId}-${normalizeId(projectId)}`
    // Prefer the per-project cache populated by fetchSupplierMaterials (already filtered)
    const supplierScoped = supplierMaterials[key] || supplierMaterials[`${userId}-${projectId}`]
    if (supplierScoped) return supplierScoped
    // Fallback to memoized grouping from users.projectMaterials
    const cached = materialsCache[key]
    if (cached) return cached
    const user = users.find((u) => u._id === userId)
    if (!user || !user.projectMaterials) return []
    return user.projectMaterials.filter((material) => normalizeId(material.projectId) === normalizeId(projectId))
  }

  const loadAllSupplierMaterials = async () => {
    const suppliers = users.filter((user) => user.role === "supplier")
    for (const supplier of suppliers) {
      await fetchSupplierMaterials(supplier._id)
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }

  // Safer update for nested material fields
  const updateMaterialField = (
    userId: string,
    projectId: string,
    materialIndex: number,
    field: string,
    value: number,
  ) => {
    const user = users.find((u) => u._id === userId)
    if (!user || !user.projectMaterials) return

    setUsers((prevUsers) =>
      prevUsers.map((u) => {
        if (u._id !== userId) return u
        const updatedMaterials = [...(u.projectMaterials || [])]
        const matchingIndices: number[] = []
        updatedMaterials.forEach((m, idx) => {
          if (normalizeId(m.projectId) === normalizeId(projectId)) matchingIndices.push(idx)
        })
        const globalIndex = matchingIndices[materialIndex]
        if (globalIndex !== undefined) {
          updatedMaterials[globalIndex] = { ...updatedMaterials[globalIndex], [field]: value }
        }
        return { ...u, projectMaterials: updatedMaterials }
      }),
    )

    if (editForm && editForm._id === userId) {
      const updatedMaterials = [...(editForm.projectMaterials || [])]
      const matchingIndices: number[] = []
      updatedMaterials.forEach((m, idx) => {
        if (normalizeId(m.projectId) === normalizeId(projectId)) matchingIndices.push(idx)
      })
      const globalIndex = matchingIndices[materialIndex]
      if (globalIndex !== undefined) {
        updatedMaterials[globalIndex] = { ...updatedMaterials[globalIndex], [field]: value }
        setEditForm({ ...editForm, projectMaterials: updatedMaterials })
      }
    }
  }

  const fetchSupplierMaterials = async (userId: string, projectId?: string) => {
    try {
      const apiUrl = `/api/suppliers/${userId}/materials`
      const response = await fetch(apiUrl, { cache: "no-store" })
      if (response.ok) {
        const raw = await response.json()
        const allMaterials = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : raw ? [raw] : []
        const transformedMaterials = Array.isArray(allMaterials)
          ? allMaterials.map((material: any) => {
              const qty = Number(material.quantity || material.qty || material.units || 0)
              const price = Number(material.pricePerUnit || material.price || material.rate || 0)
              const amountFallback = Number(
                material.amount ||
                  material.totalAmount ||
                  material.total ||
                  material.cost ||
                  (price && qty ? price * qty : 0) ||
                  0,
              )
              const paid = Number(material.paidAmount || material.paid || 0)
              return {
                _id: material._id || `${userId}-${material.materialType}-${Date.now()}`,
                materialType: material.materialType || material.name || material.type || "Unknown",
                projectId: normalizeId(material.projectId || material.project || material.project_id) || "default",
                amount: amountFallback,
                quantity: qty,
                pricePerUnit: price || (qty ? amountFallback / qty : 0),
                totalAmount: amountFallback,
                paidAmount: paid,
                dueAmount: Math.max(0, amountFallback - paid),
                createdAt: material.date || material.supplyDate || material.createdAt,
              }
            })
          : []

        const totalSupplyValue = transformedMaterials.reduce(
          (sum, material) => sum + (material.amount || material.totalAmount || 0),
          0,
        )

        setUsers((prevUsers) =>
          prevUsers.map((user) => {
            if (user._id !== userId) return user
            // Only overwrite if we actually received materials
            if (Array.isArray(transformedMaterials) && transformedMaterials.length > 0) {
              return {
                ...user,
                projectMaterials: transformedMaterials,
                totalSupplyValue: totalSupplyValue > 0 ? totalSupplyValue : user.totalSupplyValue,
              }
            }
            return user
          }),
        )

        if (projectId) {
          const pidNorm = normalizeId(projectId)
          const projectMaterials = transformedMaterials.filter((m) => normalizeId(m.projectId) === pidNorm)
          setSupplierMaterials((prev) => ({
            ...prev,
            [`${userId}-${pidNorm}`]: projectMaterials,
          }))
        }
      } else {
        const user = users.find((u) => u._id === userId)
        if (user && user.projectMaterials) {
          if (projectId) {
            const pidNorm = normalizeId(projectId)
            const projectMaterials = user.projectMaterials.filter((m) => normalizeId(m.projectId) === pidNorm)
            setSupplierMaterials((prev) => ({
              ...prev,
              [`${userId}-${pidNorm}`]: projectMaterials,
            }))
          }
        }
      }
    } catch (error) {
      console.error("Error fetching supplier materials:", error)
      const user = users.find((u) => u._id === userId)
      if (user && user.projectMaterials && projectId) {
        const pidNorm = normalizeId(projectId)
        const projectMaterials = user.projectMaterials.filter((m) => normalizeId(m.projectId) === pidNorm)
        setSupplierMaterials((prev) => ({
          ...prev,
          [`${userId}-${pidNorm}`]: projectMaterials,
        }))
      }
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects", { cache: "no-store" })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const projectsData = await response.json()
      const transformedProjects = Array.isArray(projectsData)
        ? projectsData.map((project) => ({
            _id: project._id || project.id,
            name: project.title || project.name || "Unnamed Project",
          }))
        : []
      setProjects(transformedProjects)
    } catch (error) {
      console.error("Error fetching projects:", error)
      setProjects([])
    }
  }

  // Supplier due calculation that respects selected project and material paid splits
  const calculateSupplierDue = (user: User): number => {
    const mats = Array.isArray(user.projectMaterials) ? user.projectMaterials : []
    const totalAll = mats.reduce((s, m) => s + Number(m.amount || m.totalAmount || 0), 0)
    const paidAllExplicit = mats.reduce((s, m) => s + Number(m.paidAmount || 0), 0)

    // If a project is selected, try to use material-level paid; otherwise distribute proportionally
    if (user.selectedProjectId) {
      const pmats = mats.filter((m) => normalizeId(m.projectId) === normalizeId(user.selectedProjectId))
      const ptotal = pmats.reduce((s, m) => s + Number(m.amount || m.totalAmount || 0), 0)
      const ppaidExplicit = pmats.reduce((s, m) => s + Number(m.paidAmount || 0), 0)

      let ppaid = ppaidExplicit
      if (ppaid === 0 && totalAll > 0 && user.totalPaid > 0) {
        // proportional fallback if per-material paid not present
        ppaid = (ptotal / totalAll) * user.totalPaid
      }
      return Math.max(0, ptotal - ppaid)
    }

    // All projects
    const paid = paidAllExplicit > 0 ? paidAllExplicit : Number(user.totalPaid || 0)
    const total = totalAll > 0 ? totalAll : Number(user.totalSupplyValue || 0)
    return Math.max(0, total - paid)
  }

  // Generic helper
  const calculateDueAmount = (user: User): number => {
    switch (user.role) {
      case "employee":
      case "supervisor":
        return Math.max(0, (user.salary || 0) - (user.totalPaid || 0))
      case "client":
        return Math.max(0, (user.projectTotalAmount || 0) - (user.totalPaid || 0))
      case "supplier":
        return calculateSupplierDue(user)
      default:
        return user.dueAmount || 0
    }
  }

  // Fix name precedence and enhance role transforms
  const transformUserData = (user: any, role: string): User => {
    // Correct operator precedence for name
    const name =
      user.name ||
      user.fullName ||
      (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.companyName || "Unknown")

    const baseUser: User = {
      _id: user._id || user.id || Math.random().toString(36).slice(2),
      name,
      email: user.email || user.emailAddress || `${role}-${Date.now()}@example.com`,
      role: role as User["role"],
      status: user.status || user.employeeStatus || "active",
      phone: user.phone || user.phoneNumber || user.mobile || "",
      address: user.address || user.location || "",
      lastPaymentDate:
        user.lastPaymentDate || user.lastPayment || user.lastSalaryDate || new Date().toISOString().split("T")[0],
      totalPaid: Number(user.totalPaid || user.paidAmount || user.totalSalaryPaid || user.amountPaid || 0),
      dueAmount: 0,
    }

    let transformed: User = baseUser

    if (role === "employee") {
      const salary =
        typeof user.salary === "string"
          ? Number.parseFloat(user.salary.replace(/[^0-9.]/g, ""))
          : Number(
              user.salary ||
                user.monthlySalary ||
                user.basicSalary ||
                user.grossSalary ||
                user.netSalary ||
                user.amount ||
                0,
            )
      transformed = { ...baseUser, salary }
    } else if (role === "supervisor") {
      const salary =
        typeof user.salary === "string"
          ? Number.parseFloat(user.salary.replace(/[^0-9.]/g, ""))
          : Number(user.salary || user.monthlySalary || user.supervisorSalary || 0)
      transformed = { ...baseUser, salary }
    } else if (role === "client") {
      const projectTotalAmount = Number(
        user.projectTotalAmount || user.totalAmount || user.contractValue || user.amount || 0,
      )
      transformed = { ...baseUser, projectTotalAmount }
    } else if (role === "supplier") {
      const rawMaterials = user.projectMaterials || user.materials || []
      const supplierMaterials = Array.isArray(rawMaterials)
        ? rawMaterials.map((material: any) => {
            const qty = Number(material.quantity || material.qty || material.units || 0)
            const price = Number(material.pricePerUnit || material.price || material.rate || 0)
            const amountFallback = Number(
              material.amount ||
                material.totalAmount ||
                material.total ||
                material.cost ||
                (price && qty ? price * qty : 0) ||
                0,
            )
            const paid = Number(material.paidAmount || material.paid || 0)
            return {
              _id:
                material._id || `${baseUser._id}-${material.materialType || material.name || "Unknown"}-${Date.now()}`,
              materialType: material.materialType || material.name || material.type || "Unknown",
              projectId: normalizeId(material.projectId || material.project || material.project_id) || "default",
              amount: amountFallback,
              quantity: qty,
              pricePerUnit: price || (qty ? amountFallback / qty : 0),
              totalAmount: amountFallback,
              paidAmount: paid,
              dueAmount: Math.max(0, amountFallback - paid),
              createdAt: material.date || material.supplyDate || material.createdAt,
            }
          })
        : []

      const calcSupply = supplierMaterials.reduce((s, m) => s + Number(m.amount || m.totalAmount || 0), 0)
      transformed = {
        ...baseUser,
        name: user.companyName || baseUser.name || "Unknown Supplier",
        totalSupplyValue: Number(user.totalSupplyValue || user.totalAmount || user.contractValue || calcSupply || 0),
        projectMaterials: supplierMaterials,
        totalPaid: Number(baseUser.totalPaid || 0),
      }
    }

    transformed.dueAmount = calculateDueAmount(transformed)
    return transformed
  }

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true)
        const [employees, clients, suppliers, supervisors] = await Promise.all([
          fetchRoleData("/api/employees", "employee"),
          fetchRoleData("/api/clients", "client"),
          fetchRoleData("/api/suppliers", "supplier"),
          fetchRoleData("/api/supervisors", "supervisor"),
        ])
        const allUsers = [...employees, ...clients, ...suppliers, ...supervisors]

        if (allUsers.length === 0) {
          toast({ variant: "destructive", description: "No data found. Please check your API endpoints." })
        } else {
          // Initial merge (payroll aggregates will refine in the other effect)
          const merged = allUsers.map((u) => {
            if (u.role === "supplier") {
              const agg = payrollBySupplier[u._id]
              if (agg) {
                return {
                  ...u,
                  totalPaid: Math.max(Number(u.totalPaid || 0), Number(agg.totalPaid || 0)),
                  lastPaymentDate: agg.lastPaymentDate || u.lastPaymentDate,
                  dueAmount: calculateDueAmount({
                    ...u,
                    totalPaid: Math.max(Number(u.totalPaid || 0), Number(agg.totalPaid || 0)),
                  }),
                }
              }
            }
            return u
          })
          setUsers(merged)
          toast({ description: `Loaded ${allUsers.length} records` })
        }
      } catch (error) {
        console.error("Error in fetchAllData:", error)
        toast({ variant: "destructive", description: "Failed to load data. Please try again." })
      } finally {
        setIsLoading(false)
      }
    }
    fetchAllData()
    fetchProjects()
  }, [])

  useEffect(() => {
    const loadPayroll = async () => {
      try {
        const records = await fetchPayrollRecords()
        setPayrollRecords(records)
        const { agg, latestMaterialsBySupplier } = buildSupplierAggregates(records)
        setPayrollBySupplier(agg)
        if (users.length > 0) {
          setUsers((prev) =>
            prev.map((u) => {
              const uid = normalizeId(u._id)
              if (u.role === "supplier" && agg[uid]) {
                const a = agg[uid]
                const latest = (latestMaterialsBySupplier as any)[uid]
                const mergedMaterials = latest?.materials || u.projectMaterials || []
                const mergedSupplyValue =
                  latest?.totalSupplyValue ??
                  (mergedMaterials.length
                    ? mergedMaterials.reduce((s: number, m: any) => s + Number(m.amount || m.totalAmount || 0), 0)
                    : (u.totalSupplyValue ?? 0))

                const result: User = {
                  ...u,
                  projectMaterials: mergedMaterials,
                  totalSupplyValue: mergedSupplyValue,
                  totalPaid: Math.max(Number(u.totalPaid || 0), Number(a.totalPaid || 0)),
                  lastPaymentDate: a.lastPaymentDate || u.lastPaymentDate,
                }
                result.dueAmount = calculateDueAmount(result)
                return result
              }
              return u
            }),
          )
        }
      } catch (e) {
        console.warn("Failed to load payroll aggregates", e)
      }
    }
    loadPayroll()
  }, [users.length])

  useEffect(() => {
    if (users.length > 0) {
      loadAllSupplierMaterials()
    }
  }, [users.length])

  useEffect(() => {
    const filtered = users.filter((user) => {
      const matchesRole = selectedRole === "all" || user.role === selectedRole
      const matchesSearch =
        searchTerm === "" ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.role === "supplier" &&
          user.projectMaterials &&
          user.projectMaterials.some((material) =>
            material.materialType.toLowerCase().includes(searchTerm.toLowerCase()),
          ))
      return matchesRole && matchesSearch
    })
    setFilteredUsers(filtered)
  }, [searchTerm, users, selectedRole])

  const handleEdit = (user: User) => {
    setEditingId(user._id)
    setEditForm({ ...user })
  }

  const handleSave = async () => {
    if (!editForm || !editForm.role || isSaving) return
    setIsSaving(true)
    const apiPath = `/api/${editForm.role.toLowerCase()}s`
    const userId = editForm._id
    const originalUser = users.find((u) => u._id === userId)
    const originalPaid = originalUser ? originalUser.totalPaid : 0
    const paymentAmount = (editForm.totalPaid || 0) - (originalPaid || 0)

    try {
      let apiData: any = { ...editForm }
      switch (editForm.role) {
        case "employee":
          apiData = {
            ...editForm,
            salary: editForm.salary,
            totalPaid: editForm.totalPaid,
            dueAmount: editForm.dueAmount,
            lastPaymentDate: editForm.lastPaymentDate,
          }
          break
        case "supervisor":
          apiData = {
            ...editForm,
            salary: editForm.salary,
          }
          break
        case "client":
          apiData = {
            ...editForm,
            projectTotalAmount: editForm.projectTotalAmount,
          }
          break
        case "supplier":
          apiData = {
            _id: editForm._id,
            name: editForm.name,
            email: editForm.email,
            role: editForm.role,
            dueAmount: editForm.dueAmount,
            status: editForm.status,
            totalPaid: editForm.totalPaid,
            lastPaymentDate: editForm.lastPaymentDate,
          }
          break
      }

      const response = await fetch(`${apiPath}/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to save ${editForm.role}: ${response.status} - ${errorText}`)
      }
      const updatedUser = await response.json()
      const prevUser = users.find((u) => u._id === userId)
      let transformedUser = transformUserData(updatedUser, editForm.role)
      // Preserve supplier materials/supply value if backend response doesn't carry them
      if (editForm.role === "supplier") {
        const keepMaterials = (
          prevUser && Array.isArray(prevUser.projectMaterials) && prevUser.projectMaterials.length > 0
            ? prevUser.projectMaterials
            : Array.isArray(editForm.projectMaterials)
              ? editForm.projectMaterials
              : []
        ) as any[]
        const keepSupply =
          (prevUser && typeof prevUser.totalSupplyValue === "number" ? prevUser.totalSupplyValue : undefined) ??
          (typeof editForm.totalSupplyValue === "number" ? editForm.totalSupplyValue : undefined)

        transformedUser = {
          ...transformedUser,
          projectMaterials: keepMaterials.length > 0 ? keepMaterials : transformedUser.projectMaterials,
          totalSupplyValue: keepSupply ?? transformedUser.totalSupplyValue,
          selectedProjectId:
            prevUser?.selectedProjectId ?? editForm.selectedProjectId ?? transformedUser.selectedProjectId,
        }
        // If supply value is still missing/zero but we have materials, compute from them
        if (
          (transformedUser.totalSupplyValue === undefined || transformedUser.totalSupplyValue === 0) &&
          Array.isArray(transformedUser.projectMaterials) &&
          transformedUser.projectMaterials.length > 0
        ) {
          transformedUser.totalSupplyValue = transformedUser.projectMaterials.reduce(
            (s: number, m: any) => s + Number(m.amount || m.totalAmount || 0),
            0,
          )
        }
        transformedUser.dueAmount = calculateDueAmount(transformedUser)
      } else {
        transformedUser.dueAmount = calculateDueAmount(transformedUser)
      }

      setUsers((prev) => prev.map((u) => (u._id === transformedUser._id ? transformedUser : u)))
      // Refresh supplierMaterials cache for this supplier based on preserved materials
      if (editForm.role === "supplier") {
        const mats = Array.isArray(transformedUser.projectMaterials) ? transformedUser.projectMaterials : []
        if (mats.length > 0) {
          const grouped: Record<string, any[]> = {}
          for (const m of mats) {
            const pid = normalizeId((m as any).projectId)
            if (!grouped[pid]) grouped[pid] = []
            grouped[pid].push(m)
          }
          setSupplierMaterials((prev) => {
            const next = { ...prev }
            for (const pid of Object.keys(grouped)) {
              next[`${userId}-${pid}`] = grouped[pid]
            }
            return next
          })
        }
      }

      if (paymentAmount > 0) {
        try {
          let payrollData: any = {
            user: userId,
            userRole: editForm.role,
            amount: paymentAmount,
            paymentDate: new Date(),
            status: "paid",
            notes: `Payment of ₹${paymentAmount} recorded for ${editForm.role} ${editForm.name}.`,
          }
          if (editForm.role === "supplier") {
            const allMaterials = Array.isArray(editForm.projectMaterials) ? editForm.projectMaterials : []
            const materialsForScope = editForm.selectedProjectId
              ? allMaterials.filter((m) => normalizeId(m.projectId) === normalizeId(editForm.selectedProjectId))
              : allMaterials
            const computedTotalSupply = materialsForScope.reduce(
              (s, m) => s + Number(m.amount || m.totalAmount || 0),
              0,
            )
            payrollData = {
              ...payrollData,
              supplierMaterials: materialsForScope.map((m) => ({
                _id: m._id,
                projectId: m.projectId,
                projectName: m.projectName,
                materialType: m.materialType,
                quantity: Number(m.quantity || 0),
                pricePerUnit: Number(m.pricePerUnit || 0),
                totalAmount: Number(m.totalAmount || m.amount || 0),
                amount: Number(m.totalAmount || m.amount || 0),
                paidAmount: Number(m.paidAmount || 0),
                dueAmount: Number(m.dueAmount || (m.totalAmount || m.amount || 0) - Number(m.paidAmount || 0)),
                createdAt: m.createdAt,
              })),
              totalSupplyValue: Number(editForm.totalSupplyValue || computedTotalSupply || 0),
              dueAmount: Math.max(
                0,
                Number(editForm.totalSupplyValue || computedTotalSupply || 0) - Number(editForm.totalPaid || 0),
              ),
            }
          }

          await fetch("/api/payroll", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payrollData),
          })
        } catch (payrollError) {
          console.warn("Failed to log payroll transaction:", payrollError)
        }
      }

      setEditForm(null)
      setEditingId(null)
      toast({
        description: `${editForm.role.charAt(0).toUpperCase() + editForm.role.slice(1)} ${editForm.name} updated successfully!`,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      toast({ variant: "destructive", description: `Failed to save ${editForm.role}. Error: ${errorMessage}` })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setEditForm((prev) => {
      if (!prev) return prev
      const newForm: User = { ...prev, [field]: value as any }
      const numericValue = Number(value) || 0

      switch (prev.role) {
        case "employee":
        case "supervisor": {
          const currentSalary = field === "salary" ? numericValue : Number(newForm.salary) || 0
          const currentPaid = field === "totalPaid" ? numericValue : Number(newForm.totalPaid) || 0
          newForm.salary = currentSalary
          newForm.totalPaid = currentPaid
          newForm.dueAmount = Math.max(0, currentSalary - currentPaid)
          break
        }
        case "client": {
          const currentProjectAmount =
            field === "projectTotalAmount" ? numericValue : Number(newForm.projectTotalAmount) || 0
          const currentClientPaid = field === "totalPaid" ? numericValue : Number(newForm.totalPaid) || 0
          newForm.projectTotalAmount = currentProjectAmount
          newForm.totalPaid = currentClientPaid
          newForm.dueAmount = Math.max(0, currentProjectAmount - currentClientPaid)
          break
        }
        case "supplier": {
          if (field === "totalPaid") {
            const newTotalPaid = numericValue
            newForm.totalPaid = newTotalPaid

            if (newForm.selectedProjectId && newForm.projectMaterials) {
              const pmats = newForm.projectMaterials.filter(
                (m) => normalizeId(m.projectId) === normalizeId(newForm.selectedProjectId),
              )
              const ptotal = pmats.reduce((s, m) => s + Number(m.amount || m.totalAmount || 0), 0)
              const allTotal = newForm.projectMaterials.reduce((s, m) => s + Number(m.amount || m.totalAmount || 0), 0)
              // proportional paid if individual paid not edited
              const ppaidExplicit = pmats.reduce((s, m) => s + Number(m.paidAmount || 0), 0)
              const ppaid = ppaidExplicit > 0 || allTotal === 0 ? ppaidExplicit : (ptotal / allTotal) * newTotalPaid
              newForm.dueAmount = Math.max(0, ptotal - ppaid)
            } else {
              const allTotal = (newForm.projectMaterials || []).reduce(
                (s, m) => s + Number(m.amount || m.totalAmount || 0),
                0,
              )
              const baseTotal = allTotal || Number(newForm.totalSupplyValue || 0)
              newForm.dueAmount = Math.max(0, baseTotal - newTotalPaid)
            }

            // distribute paid per material proportionally for UI feedback
            if (newForm.projectMaterials && newForm.projectMaterials.length > 0) {
              const totalMaterialValue = newForm.projectMaterials.reduce(
                (sum, m) => sum + Number(m.amount || m.totalAmount || 0),
                0,
              )
              if (totalMaterialValue > 0) {
                newForm.projectMaterials = newForm.projectMaterials.map((material) => {
                  const part = Number(material.amount || material.totalAmount || 0)
                  const mp = (part / totalMaterialValue) * newTotalPaid
                  return {
                    ...material,
                    paidAmount: mp,
                    dueAmount: Math.max(0, part - mp),
                  }
                })
              }
            }
          } else if (field === "totalSupplyValue") {
            newForm.totalSupplyValue = numericValue
            newForm.dueAmount = Math.max(0, numericValue - (newForm.totalPaid || 0))
          }
          break
        }
      }

      if (field === "totalPaid" && numericValue > (prev.totalPaid || 0)) {
        newForm.lastPaymentDate = new Date().toISOString()
      }
      return newForm
    })
  }

  const handleExportToPDF = (sections: string[] = ["all"]) => {
    setIsExporting(true)
    try {
      const doc = new jsPDF()
      const currentDate = new Date().toLocaleDateString()
      const pageWidth = doc.internal.pageSize.width

      // Header with better styling
      doc.setFontSize(20)
      doc.setFont("helvetica", "bold")
      doc.text("Payroll Management Report", pageWidth / 2, 25, { align: "center" })

      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text(`Generated on: ${currentDate}`, pageWidth / 2, 35, { align: "center" })

      // Add a line separator
      doc.setLineWidth(0.5)
      doc.line(20, 40, pageWidth - 20, 40)

      const roles: Array<User["role"]> = ["supervisor", "employee", "client", "supplier"]
      let startY = 50

      // Filter roles based on selection
      const rolesToExport = sections.includes("all") ? roles : roles.filter((role) => sections.includes(role))

      rolesToExport.forEach((role, roleIndex) => {
        const roleUsers = users.filter((user) => user.role === role)
        if (roleUsers.length === 0) return

        // Check if we need a new page
        if (startY > 250) {
          doc.addPage()
          startY = 30
        }

        // Section header with background
        doc.setFillColor(240, 240, 240)
        doc.rect(20, startY - 5, pageWidth - 40, 12, "F")

        doc.setFontSize(16)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text(`${role.charAt(0).toUpperCase() + role.slice(1)}s (${roleUsers.length})`, 25, startY + 3)
        startY += 15

        // Table setup with better spacing
        const isSupplier = role === "supplier"

        const headers = isSupplier
          ? ["Name", "Email", "Materials", "Total Value", "Paid", "Due"]
          : ["Name", "Email", "Phone", "Amount", "Paid", "Due", "Last Payment"]

        const columnWidths = isSupplier
          ? [30, 40, 35, 25, 20, 20] // Supplier columns without status
          : [25, 35, 20, 20, 18, 18, 24] // Non-supplier columns without status

        // Table header
        doc.setFillColor(220, 220, 220)
        doc.rect(20, startY, pageWidth - 40, 8, "F")

        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        let xPos = 22
        headers.forEach((header, i) => {
          doc.text(header, xPos, startY + 5)
          xPos += columnWidths[i]
        })
        startY += 10

        // Table rows
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)

        roleUsers.forEach((user, userIndex) => {
          // Alternate row colors
          if (userIndex % 2 === 0) {
            doc.setFillColor(250, 250, 250)
            doc.rect(20, startY, pageWidth - 40, 12, "F")
          }

          // Check for page break
          if (startY > 270) {
            doc.addPage()
            startY = 30

            // Repeat header on new page
            doc.setFillColor(220, 220, 220)
            doc.rect(20, startY, pageWidth - 40, 8, "F")
            doc.setFont("helvetica", "bold")
            xPos = 22
            headers.forEach((header, i) => {
              doc.text(header, xPos, startY + 5)
              xPos += columnWidths[i]
            })
            startY += 10
            doc.setFont("helvetica", "normal")
          }

          let rowData: string[]
          if (isSupplier) {
            const materialsText = user.projectMaterials?.length
              ? `${user.projectMaterials[0].materialType} (${user.projectMaterials[0].quantity})`
              : "No materials"

            rowData = [
              user.name || "N/A",
              user.email || "N/A",
              materialsText,
              `₹${(user.totalSupplyValue || 0).toLocaleString()}`,
              `₹${(user.totalPaid || 0).toLocaleString()}`,
              `₹${(user.dueAmount || 0).toLocaleString()}`,
            ]
          } else {
            let amount = "N/A"
            if (user.role === "employee" || user.role === "supervisor") {
              amount = user.salary ? `₹${user.salary.toLocaleString()}` : "N/A"
            } else if (user.role === "client") {
              amount = user.projectTotalAmount ? `₹${user.projectTotalAmount.toLocaleString()}` : "N/A"
            }

            rowData = [
              user.name || "N/A",
              user.email || "N/A",
              user.phone || "N/A",
              amount,
              `₹${(user.totalPaid || 0).toLocaleString()}`,
              `₹${(user.dueAmount || 0).toLocaleString()}`,
              user.lastPaymentDate ? new Date(user.lastPaymentDate).toLocaleDateString() : "N/A",
            ]
          }

          xPos = 22
          rowData.forEach((cell, i) => {
            const maxWidth = columnWidths[i] - 4
            const lines = doc.splitTextToSize(cell, maxWidth)
            doc.text(lines, xPos, startY + 8)
            xPos += columnWidths[i]
          })

          startY += 12
        })

        // Add spacing between sections
        startY += 10

        // Add section separator line
        if (roleIndex < rolesToExport.length - 1) {
          doc.setLineWidth(0.3)
          doc.line(20, startY, pageWidth - 20, startY)
          startY += 10
        }
      })

      // Footer
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, doc.internal.pageSize.height - 10)
        doc.text("Payroll Management System", 20, doc.internal.pageSize.height - 10)
      }

      const sectionText = sections.includes("all") ? "complete" : sections.join("-")
      doc.save(`payroll-report-${sectionText}-${new Date().toISOString().split("T")[0]}.pdf`)
      toast({ description: "PDF exported successfully!" })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({ variant: "destructive", description: "Failed to generate PDF" })
    } finally {
      setIsExporting(false)
      setIsExportDialogOpen(false)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm(null)
  }

  const getStatsForRole = (role: User["role"]) => {
    const roleUsers = users.filter((user) => user.role === role)
    let totalAmount = 0
    let totalDue = 0
    roleUsers.forEach((user) => {
      switch (role) {
        case "employee":
        case "supervisor":
          totalAmount += user.salary || 0
          break
        case "client":
          totalAmount += user.projectTotalAmount || 0
          break
        case "supplier":
          totalAmount +=
            user.totalSupplyValue ||
            user.projectMaterials?.reduce((sum: number, m: any) => sum + (m.amount || m.totalAmount || 0), 0) ||
            0
          break
      }
      totalDue += user.dueAmount || 0
    })
    return { totalAmount, totalDue, count: roleUsers.length }
  }

  const stats = [
    {
      title: "Supervisors",
      role: "supervisor" as const,
      ...getStatsForRole("supervisor"),
      description: "Supervisor salaries",
      color: "bg-purple-100 text-purple-800",
    },
    {
      title: "Employees",
      role: "employee" as const,
      ...getStatsForRole("employee"),
      description: "Employee salaries",
      color: "bg-green-100 text-green-800",
    },
    {
      title: "Clients",
      role: "client" as const,
      ...getStatsForRole("client"),
      description: "Project values",
      color: "bg-blue-100 text-blue-800",
    },
    {
      title: "Suppliers",
      role: "supplier" as const,
      ...getStatsForRole("supplier"),
      description: "Material costs",
      color: "bg-amber-100 text-amber-800",
    },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  const getAmountForRole = (user: User) => {
    switch (user.role) {
      case "employee":
      case "supervisor":
        return user.salary || 0
      case "client":
        return user.projectTotalAmount || 0
      case "supplier":
        return (
          user.totalSupplyValue ||
          user.projectMaterials?.reduce((sum: number, m: any) => sum + (m.amount || m.totalAmount || 0), 0) ||
          0
        )
      default:
        return 0
    }
  }

  const getAmountFieldName = (role: string) => {
    switch (role) {
      case "client":
        return "Project Amount"
      case "supplier":
        return "Material Cost"
      default:
        return "Salary"
    }
  }

  const getSupplierProjectsWithMaterials = (user: User) => {
    if (!user.projectMaterials) return []
    const projectIds = new Set(user.projectMaterials.map((m) => normalizeId(m.projectId)))
    return projects.filter((project) => projectIds.has(normalizeId(project._id)))
  }

  const handleMaterialChange = (userId: string, materialId: string, field: string, value: string | number) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => {
        if (user._id !== userId) return user
        const updatedMaterials = (user.projectMaterials || []).map((material) =>
          material._id === materialId ? { ...material, [field]: value } : material,
        )
        return { ...user, projectMaterials: updatedMaterials }
      }),
    )
    setEditForm((prev) => {
      if (!prev) return prev
      const updatedMaterials = (prev.projectMaterials || []).map((material) =>
        material._id === materialId ? { ...material, [field]: value } : material,
      )
      return { ...prev, projectMaterials: updatedMaterials }
    })
  }

  const handleDeleteMaterial = (userId: string, materialId: string) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => {
        if (user._id !== userId) return user
        const updatedMaterials = (user.projectMaterials || []).filter((material) => material._id !== materialId)
        return { ...user, projectMaterials: updatedMaterials }
      }),
    )
    setEditForm((prev) => {
      if (!prev) return prev
      const updatedMaterials = (prev.projectMaterials || []).filter((material) => material._id !== materialId)
      return { ...prev, projectMaterials: updatedMaterials }
    })
  }

  const handleAddMaterial = (userId: string, projectId: string) => {
    const project = projects.find((p) => p._id === projectId)
    if (!project) return

    setUsers((prevUsers) =>
      prevUsers.map((user) => {
        if (user._id !== userId) return user
        const newMaterial = {
          _id: `${userId}-${projectId}-${Date.now()}`,
          projectId: project._id,
          projectName: project.name,
          materialType: "New Material",
          quantity: 1,
          pricePerUnit: 100,
          amount: 100,
          totalAmount: 100,
          paidAmount: 0,
          dueAmount: 100,
          createdAt: new Date().toISOString(),
        }
        const updatedMaterials = [...(user.projectMaterials || []), newMaterial]
        return { ...user, projectMaterials: updatedMaterials }
      }),
    )

    setEditForm((prev) => {
      if (!prev) return prev
      const newMaterial = {
        _id: `${userId}-${projectId}-${Date.now()}`,
        projectId: project._id,
        projectName: project.name,
        materialType: "New Material",
        quantity: 1,
        pricePerUnit: 100,
        amount: 100,
        totalAmount: 100,
        paidAmount: 0,
        dueAmount: 100,
        createdAt: new Date().toISOString(),
      }
      const updatedMaterials = [...(prev.projectMaterials || []), newMaterial]
      return { ...prev, projectMaterials: updatedMaterials }
    })
  }

  const handleFormChange = (field: string, value: string) => {
    setEditForm((prev) => {
      if (!prev) return prev
      return { ...prev, [field]: value }
    })
  }

  const getAmountFieldKey = (role: string) => {
    switch (role) {
      case "employee":
      case "supervisor":
        return "salary"
      case "client":
        return "projectTotalAmount"
      case "supplier":
        return "totalSupplyValue"
      default:
        return ""
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const handleDelete = async (userId: string) => {
    try {
      const userToDelete = users.find((user) => user._id === userId)
      if (!userToDelete) {
        toast({ variant: "destructive", description: "User not found." })
        return
      }

      const apiPath = `/api/${userToDelete.role.toLowerCase()}s`
      const response = await fetch(`${apiPath}/${userId}`, { method: "DELETE" })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to delete ${userToDelete.role}: ${response.status} - ${errorText}`)
      }

      setUsers((prev) => prev.filter((user) => user._id !== userId))
      setFilteredUsers((prev) => prev.filter((user) => user._id !== userId))
      toast({ description: `${userToDelete.role} ${userToDelete.name} deleted successfully!` })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      toast({ variant: "destructive", description: `Failed to delete user. Error: ${errorMessage}` })
    }
  }

  const updatePayrollAmount = async (recordId: string, newAmount: number) => {
    try {
      const response = await fetch(`/api/payroll/${recordId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: newAmount }),
      })

      if (response.ok) {
        // Immediately update local state to reflect changes in filtered view
        setPayrollRecords((prev) =>
          prev.map((record) =>
            record._id === recordId ? { ...record, amount: newAmount, updatedAt: new Date().toISOString() } : record,
          ),
        )

        // Refresh aggregates for suppliers
        const updatedRecords = await fetchPayrollRecords()
        const { agg } = buildSupplierAggregates(updatedRecords)
        setPayrollBySupplier(agg)

        toast.success("Payment amount updated successfully")
      } else {
        toast.error("Failed to update payment amount")
      }
    } catch (error) {
      console.error("Error updating payroll amount:", error)
      toast.error("Error updating payment amount")
    }
  }

  const handleAddPayment = async () => {
    if (!addPaymentForm.role || !addPaymentForm.userId || !addPaymentForm.amount) {
      toast({ variant: "destructive", description: "Please fill in all required fields" })
      return
    }

    try {
      const selectedUser = users.find((u) => u._id === addPaymentForm.userId)
      if (!selectedUser) {
        toast({ variant: "destructive", description: "Selected user not found" })
        return
      }

      const paymentData = {
        userId: addPaymentForm.userId,
        userName: selectedUser.name,
        userRole: addPaymentForm.role,
        amount: Number.parseFloat(addPaymentForm.amount),
        description: addPaymentForm.description || `Payment to ${selectedUser.name}`,
        paymentDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }

      // Add to payroll records
      const newRecord = {
        _id: Date.now().toString(),
        ...paymentData,
      }

      setPayrollRecords((prev) => [...prev, newRecord])

      // Update user's total paid amount
      setUsers((prev) =>
        prev.map((user) =>
          user._id === addPaymentForm.userId
            ? {
                ...user,
                totalPaid: (user.totalPaid || 0) + Number.parseFloat(addPaymentForm.amount),
                lastPaymentDate: new Date().toISOString(),
              }
            : user,
        ),
      )

      // Reset form and close dialog
      setAddPaymentForm({ role: "", userId: "", amount: "", description: "" })
      setIsAddPaymentOpen(false)

      toast({ description: "Payment added successfully!" })
    } catch (error) {
      console.error("Error adding payment:", error)
      toast({ variant: "destructive", description: "Failed to add payment" })
    }
  }

  const getUsersByRole = (role: string) => {
    return users.filter((user) => user.role === role)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payroll Management</h2>
          <p className="text-muted-foreground">Manage payments, salaries, and financial transactions</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 bg-transparent"
            onClick={() => setIsAddPaymentOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Payment</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 bg-transparent"
            onClick={() => setIsExportDialogOpen(true)}
            disabled={isExporting}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
          </Button>
        </div>
      </div>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Choose which sections to include:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'supervisor', label: 'Supervisors' },
                { key: 'employee', label: 'Employees' },
                { key: 'client', label: 'Clients' },
                { key: 'supplier', label: 'Suppliers' },
              ].map((opt) => {
                const active = selectedExportSections.includes(opt.key)
                return (
                  <Button
                    key={opt.key}
                    type="button"
                    variant={active ? 'default' : 'outline'}
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      if (opt.key === 'all') {
                        setSelectedExportSections(['all'])
                        return
                      }
                      setSelectedExportSections((prev) => {
                        const next = prev.includes('all') ? [] : [...prev]
                        if (next.includes(opt.key)) return next.filter((k) => k !== opt.key)
                        return [...next, opt.key]
                      })
                    }}
                  >
                    {opt.label}
                  </Button>
                )
              })}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleExportToPDF(selectedExportSections)}
                disabled={isExporting}
              >
                {isExporting ? 'Exporting…' : 'Export PDF'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className={`shadow-sm cursor-pointer transition-all hover:scale-105 ${
              selectedRole === stat.role ? `${stat.color}` : ""
            }`}
            onClick={() => setSelectedRole(stat.role)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className="h-8 w-8 rounded-full flex items-center justify-center">{stat.count}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stat.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">
                {stat.totalDue > 0 ? `${formatCurrency(stat.totalDue)} due` : "All caught up"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={selectedRole === "supplier" ? "Search suppliers or materials..." : "Search users..."}
                className="w-full pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-8 w-[180px]"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  aria-label="Filter by date"
                />
              </div>
              {selectedDate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 bg-transparent"
                  onClick={() => setSelectedDate("")}
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Clear</span>
                </Button>
              )}
              <Button variant="outline" size="sm" className="h-8 gap-1 bg-transparent">
                <Filter className="h-3.5 w-3.5" />
                <span>Filter</span>
              </Button>
            </div>
          </div>
        </div>

        {selectedDate && (
          <div className="px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">
                  Payments on {new Date(selectedDate + "T00:00:00").toLocaleDateString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {filteredPayroll.length} record{filteredPayroll.length !== 1 ? "s" : ""} • Total{" "}
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  }).format(filteredTotalAmount)}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate("")}>
                <X className="w-4 h-4 mr-1" /> Clear
              </Button>
            </div>

            <div className="mt-3 rounded-md border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayroll.length > 0 ? (
                    filteredPayroll.map((rec) => {
                      const timeStr = (() => {
                        const d = new Date(rec.paymentDate || Date.now())
                        return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                      })()
                      const role = (rec.userRole || rec.user_role || "").toString().toLowerCase()
                      const details =
                        role === "supplier"
                          ? (() => {
                              const mats: any[] = rec.supplierMaterials || rec.materials || []
                              const first = mats
                                .slice(0, 2)
                                .map((m) => `${m.materialType || m.name} (${m.quantity || 0})`)
                                .join(", ")
                              const more = mats.length > 2 ? ` +${mats.length - 2} more` : ""
                              return first || "Materials snapshot unavailable" + more
                            })()
                          : rec.notes || "—"
                      return (
                        <TableRow key={rec._id}>
                          <TableCell>{timeStr}</TableCell>
                          <TableCell className="font-medium">
                            {rec.user?.name || rec.userName || rec.user || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {role || "unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Input
                                type="number"
                                value={rec.amount || 0}
                                onChange={(e) => {
                                  const newAmount = Number.parseFloat(e.target.value) || 0
                                  updatePayrollAmount(rec._id, newAmount)
                                }}
                                className="w-24 text-right text-sm"
                                min="0"
                                step="0.01"
                              />
                              <span className="text-xs text-muted-foreground">INR</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{details}</TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-16 text-center text-sm text-muted-foreground">
                        No payments recorded on this date.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {selectedDate && (
          <div className="px-4 py-2 border-t bg-muted/20">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Showing payments for {new Date(selectedDate + "T00:00:00").toLocaleDateString()}</span>
              <span>Last updated: {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>
        )}

        <div className="rounded-b-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {selectedRole === "supplier" ? (
                  <>
                    <TableHead>Materials & Quantities</TableHead>
                    <TableHead>Active Projects</TableHead>
                    {/* <TableHead>Supply Status</TableHead> */}
                    <TableHead className="text-right">Total Value</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">{getAmountFieldName(selectedRole)}</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                    <TableHead>Last Payment</TableHead>
                  </>
                )}
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">
                      <div className="font-medium">{user.name}</div>
                      {user.phone && <div className="text-xs text-muted-foreground">{user.phone}</div>}
                    </TableCell>

                    {selectedRole === "supplier" ? (
                      <>
                        <TableCell className="max-w-[200px]">
                          {user.projectMaterials?.length > 0 ? (
                            <div className="space-y-1">
                              {user.projectMaterials.slice(0, 3).map((material, idx) => (
                                <div key={idx} className="text-sm">
                                  <span className="font-medium">{material.materialType}</span>
                                  <span className="text-muted-foreground">:{material.quantity}</span>
                                </div>
                              ))}
                              {user.projectMaterials.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                  +{user.projectMaterials.length - 3} more items
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No materials</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            {(() => {
                              const supplierProjects = getSupplierProjectsWithMaterials(user)
                              return supplierProjects.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {supplierProjects.slice(0, 2).map((project) => (
                                    <Badge key={project._id} variant="secondary" className="text-xs">
                                      {project.name}
                                    </Badge>
                                  ))}
                                  {supplierProjects.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{supplierProjects.length - 2} more
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">No materials added</span>
                              )
                            })()}
                          </div>
                        </TableCell>

                        {/* <TableCell>
                          {(() => {
                            const materials = user.projectMaterials || []
                            if (materials.length === 0) {
                              return <Badge variant="secondary">No supplies</Badge>
                            }
                            const totalValue = materials.reduce((sum, m) => sum + Number(m.amount || 0), 0)
                            const totalPaid = materials.reduce((sum, m) => sum + Number(m.paidAmount || 0), 0)

                            if (totalPaid >= totalValue && totalValue > 0) {
                              return <Badge className="bg-green-100 text-green-800">Fully Paid</Badge>
                            } else if (totalPaid > 0) {
                              return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>
                            } else {
                              return <Badge className="bg-red-100 text-red-800">Unpaid</Badge>
                            }
                          })()}
                        </TableCell> */}

                        <TableCell className="text-right">
                          {editingId === user._id && editForm ? (
                            <div className="space-y-2">
                              <span className="font-medium">
                                {formatCurrency(
                                  (editForm.projectMaterials || []).reduce((sum, m) => sum + Number(m.amount || 0), 0),
                                )}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium">
                                {formatCurrency(
                                  (user.projectMaterials || []).reduce((sum, m) => sum + Number(m.amount || 0), 0),
                                )}
                              </div>
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          {editingId === user._id && editForm ? (
                            <div className="space-y-1">
                              <Input
                                type="number"
                                value={editForm.totalPaid || ""}
                                onChange={(e) => handleFormChange("totalPaid", e.target.value)}
                                className="h-7 text-right text-sm"
                                placeholder="Paid amount"
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium">{formatCurrency(user.totalPaid || 0)}</div>
                            </div>
                          )}
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="text-right">
                          {editingId === user._id && editForm ? (
                            <Input
                              type="number"
                              value={editForm[getAmountFieldKey(selectedRole)] || ""}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleInputChange(getAmountFieldKey(selectedRole), Number(e.target.value))
                              }
                              className="w-24"
                            />
                          ) : (
                            formatCurrency(user[getAmountFieldKey(selectedRole)] || 0)
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingId === user._id && editForm ? (
                            <Input
                              type="number"
                              value={editForm.totalPaid || ""}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleInputChange("totalPaid", Number(e.target.value))
                              }
                              className="w-24"
                            />
                          ) : (
                            formatCurrency(user.totalPaid)
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingId === user._id && editForm ? (
                            <span className="text-muted-foreground">{formatCurrency(editForm.dueAmount || 0)}</span>
                          ) : (
                            formatCurrency(user.dueAmount || 0)
                          )}
                        </TableCell>
                        <TableCell>
                          {user.lastPaymentDate ? (
                            <div>
                              <div className="text-sm">{formatDate(user.lastPaymentDate)}</div>
                              {/* <div className="text-xs text-muted-foreground">
                                {formatCurrency(user.lastPaymentAmount || 0)}
                              </div> */}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No payments</span>
                          )}
                        </TableCell>
                      </>
                    )}

                    <TableCell>
                      <div>
                        <div className="text-right">{formatCurrency(user.dueAmount || 0)}</div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {selectedRole === "supplier" ? (
                        (() => {
                          const totalValue = (user.projectMaterials || []).reduce(
                            (sum, m) => sum + Number(m.amount || m.totalAmount || 0),
                            0,
                          )
                          const totalPaid = user.totalPaid || 0
                          const dueAmount = Math.max(0, totalValue - totalPaid)

                          if (dueAmount === 0 && totalValue > 0) {
                            return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>
                          } else if (dueAmount > 0) {
                            return <Badge variant="destructive">Outstanding</Badge>
                          } else {
                            return <Badge variant="secondary">No Supply</Badge>
                          }
                        })()
                      ) : (
                        <Badge
                          className={
                            user.dueAmount && user.dueAmount > 0
                              ? "bg-red-100 text-red-800 hover:bg-red-100"
                              : "bg-green-100 text-green-800 hover:bg-green-100"
                          }
                        >
                          {user.dueAmount && user.dueAmount > 0 ? "Due" : "Paid"}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        {editingId === user._id ? (
                          <>
                            <Button size="sm" onClick={handleSave} className="h-7 px-2">
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                              className="h-7 px-2 bg-transparent"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(user)} className="h-7 px-2">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(user._id)}
                              className="h-7 px-2 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={selectedRole === "supplier" ? 12 : 9} className="h-24 text-center">
                    {`No users found for "${selectedRole}".`}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Payment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role">Select Role</Label>
              <Select
                value={addPaymentForm.role}
                onValueChange={(value) => {
                  setAddPaymentForm((prev) => ({ ...prev, role: value, userId: "" }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="supplier">Supplier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {addPaymentForm.role && (
              <div className="grid gap-2">
                <Label htmlFor="user">Select {addPaymentForm.role}</Label>
                <Select
                  value={addPaymentForm.userId}
                  onValueChange={(value) => {
                    setAddPaymentForm((prev) => ({ ...prev, userId: value }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Choose a ${addPaymentForm.role}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {getUsersByRole(addPaymentForm.role).map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name} - {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={addPaymentForm.amount}
                onChange={(e) => setAddPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Payment description"
                value={addPaymentForm.description}
                onChange={(e) => setAddPaymentForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddPaymentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPayment}>Add Payment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PayrollManagement

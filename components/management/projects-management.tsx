// "use client"

// import type React from "react"

// import { useState, useEffect } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
// import { Progress } from "@/components/ui/progress"
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog"
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog"
// import { toast } from "@/components/ui/use-toast"
// import {
//   Plus,
//   Edit,
//   Trash2,
//   Calendar,
//   Search,
//   Filter,
//   FolderOpen,
//   DollarSign,
//   User,
//   MapPin,
//   Clock,
//   CheckCircle,
//   AlertCircle,
//   Pause,
// } from "lucide-react"

// interface Project {
//   id: number
//   name: string
//   description: string
//   status: "Planning" | "In Progress" | "On Hold" | "Completed" | "Cancelled"
//   progress: number
//   manager: string
//   client: string
//   budget: number
//   startDate: string
//   endDate: string
//   location: string
//   priority: "Low" | "Medium" | "High" | "Critical"
// }

// export default function ProjectsManagement() {
//   const [projects, setProjects] = useState<Project[]>([])
//   const [searchTerm, setSearchTerm] = useState("")
//   const [statusFilter, setStatusFilter] = useState("All")
//   const [priorityFilter, setPriorityFilter] = useState("All")
//   const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
//   const [editingProject, setEditingProject] = useState<Project | null>(null)
//   const [loading, setLoading] = useState(true)

//   const [formData, setFormData] = useState({
//     name: "",
//     description: "",
//     manager: "",
//     client: "",
//     budget: "",
//     startDate: "",
//     endDate: "",
//     location: "",
//     priority: "Medium" as Project["priority"],
//   })

//   const managers = ["John Smith", "Sarah Johnson", "Mike Davis", "Lisa Brown", "David Wilson"]
//   const priorities = ["Low", "Medium", "High", "Critical"]
//   const statuses = ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"]

//   useEffect(() => {
//     fetchProjects()
//   }, [])

//   const fetchProjects = async () => {
//     try {
//       const response = await fetch("/api/projects")
//       const data = await response.json()
//       setProjects(data)
//     } catch (error) {
//       console.error("Error fetching projects:", error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setLoading(true)

//     try {
//       const url = editingProject ? `/api/projects/${editingProject.id}` : "/api/projects"
//       const method = editingProject ? "PUT" : "POST"

//       const response = await fetch(url, {
//         method,
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           ...formData,
//           budget: Number.parseFloat(formData.budget),
//         }),
//       })

//       if (response.ok) {
//         await fetchProjects()
//         setIsAddDialogOpen(false)
//         setEditingProject(null)
//         resetForm()
//         toast({
//           title: editingProject ? "Project Updated" : "Project Created",
//           description: `${formData.name} has been ${editingProject ? "updated" : "created"} successfully.`,
//         })
//       }
//     } catch (error) {
//       console.error("Error saving project:", error)
//       toast({
//         title: "Error",
//         description: "Failed to save project. Please try again.",
//         variant: "destructive",
//       })
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleDelete = async (id: number) => {
//     try {
//       const response = await fetch(`/api/projects/${id}`, { method: "DELETE" })
//       if (response.ok) {
//         setProjects(projects.filter((p) => p.id !== id))
//         toast({
//           title: "Project Deleted",
//           description: "Project has been removed successfully.",
//         })
//       }
//     } catch (error) {
//       console.error("Error deleting project:", error)
//       toast({
//         title: "Error",
//         description: "Failed to delete project. Please try again.",
//         variant: "destructive",
//       })
//     }
//   }

//   const resetForm = () => {
//     setFormData({
//       name: "",
//       description: "",
//       manager: "",
//       client: "",
//       budget: "",
//       startDate: "",
//       endDate: "",
//       location: "",
//       priority: "Medium",
//     })
//   }

//   const openEditDialog = (project: Project) => {
//     setEditingProject(project)
//     setFormData({
//       name: project.name,
//       description: project.description,
//       manager: project.manager,
//       client: project.client,
//       budget: project.budget.toString(),
//       startDate: project.startDate,
//       endDate: project.endDate,
//       location: project.location,
//       priority: project.priority,
//     })
//     setIsAddDialogOpen(true)
//   }

//   const filteredProjects = projects.filter((project) => {
//     const matchesSearch =
//       project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       project.manager.toLowerCase().includes(searchTerm.toLowerCase())
//     const matchesStatus = statusFilter === "All" || project.status === statusFilter
//     const matchesPriority = priorityFilter === "All" || project.priority === priorityFilter
//     return matchesSearch && matchesStatus && matchesPriority
//   })

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "Completed":
//         return "bg-green-100 text-green-800"
//       case "In Progress":
//         return "bg-blue-100 text-blue-800"
//       case "Planning":
//         return "bg-yellow-100 text-yellow-800"
//       case "On Hold":
//         return "bg-orange-100 text-orange-800"
//       case "Cancelled":
//         return "bg-red-100 text-red-800"
//       default:
//         return "bg-gray-100 text-gray-800"
//     }
//   }

//   const getPriorityColor = (priority: string) => {
//     switch (priority) {
//       case "Critical":
//         return "bg-red-100 text-red-800"
//       case "High":
//         return "bg-orange-100 text-orange-800"
//       case "Medium":
//         return "bg-yellow-100 text-yellow-800"
//       case "Low":
//         return "bg-green-100 text-green-800"
//       default:
//         return "bg-gray-100 text-gray-800"
//     }
//   }

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case "Completed":
//         return <CheckCircle className="w-4 h-4" />
//       case "In Progress":
//         return <Clock className="w-4 h-4" />
//       case "On Hold":
//         return <Pause className="w-4 h-4" />
//       case "Cancelled":
//         return <AlertCircle className="w-4 h-4" />
//       default:
//         return <FolderOpen className="w-4 h-4" />
//     }
//   }

//   const stats = [
//     {
//       title: "Total Projects",
//       value: projects.length.toString(),
//       icon: FolderOpen,
//       color: "text-blue-600",
//     },
//     {
//       title: "Active Projects",
//       value: projects.filter((p) => p.status === "In Progress").length.toString(),
//       icon: Clock,
//       color: "text-green-600",
//     },
//     {
//       title: "Completed Projects",
//       value: projects.filter((p) => p.status === "Completed").length.toString(),
//       icon: CheckCircle,
//       color: "text-purple-600",
//     },
//     {
//       title: "Total Budget",
//       value: `$${projects.reduce((sum, p) => sum + p.budget, 0).toLocaleString()}`,
//       icon: DollarSign,
//       color: "text-orange-600",
//     },
//   ]

//   if (loading && projects.length === 0) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
//           <p className="mt-2 text-muted-foreground">Loading projects...</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div>
//           <h2 className="text-2xl font-bold">Projects Management</h2>
//           <p className="text-muted-foreground">Manage and monitor all construction projects</p>
//         </div>
//         <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
//           <DialogTrigger asChild>
//             <Button onClick={resetForm}>
//               <Plus className="w-4 h-4 mr-2" />
//               Add Project
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle>{editingProject ? "Edit Project" : "Create New Project"}</DialogTitle>
//               <DialogDescription>
//                 {editingProject ? "Update project information" : "Add a new construction project"}
//               </DialogDescription>
//             </DialogHeader>
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="name">Project Name *</Label>
//                   <Input
//                     id="name"
//                     value={formData.name}
//                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                     placeholder="Enter project name"
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="client">Client *</Label>
//                   <Input
//                     id="client"
//                     value={formData.client}
//                     onChange={(e) => setFormData({ ...formData, client: e.target.value })}
//                     placeholder="Enter client name"
//                     required
//                   />
//                 </div>
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="description">Description</Label>
//                 <Textarea
//                   id="description"
//                   value={formData.description}
//                   onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                   placeholder="Enter project description"
//                   rows={3}
//                 />
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="manager">Project Manager *</Label>
//                   <select
//                     id="manager"
//                     value={formData.manager}
//                     onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
//                     className="w-full p-2 border rounded-md"
//                     required
//                   >
//                     <option value="">Select Manager</option>
//                     {managers.map((manager) => (
//                       <option key={manager} value={manager}>
//                         {manager}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="priority">Priority</Label>
//                   <select
//                     id="priority"
//                     value={formData.priority}
//                     onChange={(e) => setFormData({ ...formData, priority: e.target.value as Project["priority"] })}
//                     className="w-full p-2 border rounded-md"
//                   >
//                     {priorities.map((priority) => (
//                       <option key={priority} value={priority}>
//                         {priority}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="budget">Budget ($) *</Label>
//                   <Input
//                     id="budget"
//                     type="number"
//                     value={formData.budget}
//                     onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
//                     placeholder="Enter budget amount"
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="location">Location *</Label>
//                   <Input
//                     id="location"
//                     value={formData.location}
//                     onChange={(e) => setFormData({ ...formData, location: e.target.value })}
//                     placeholder="Enter project location"
//                     required
//                   />
//                 </div>
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="startDate">Start Date *</Label>
//                   <Input
//                     id="startDate"
//                     type="date"
//                     value={formData.startDate}
//                     onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
//                     required
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="endDate">End Date *</Label>
//                   <Input
//                     id="endDate"
//                     type="date"
//                     value={formData.endDate}
//                     onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
//                     required
//                   />
//                 </div>
//               </div>
//               <div className="flex justify-end gap-2 pt-4">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={() => {
//                     setIsAddDialogOpen(false)
//                     setEditingProject(null)
//                     resetForm()
//                   }}
//                 >
//                   Cancel
//                 </Button>
//                 <Button type="submit" disabled={loading}>
//                   {loading ? "Saving..." : editingProject ? "Update Project" : "Create Project"}
//                 </Button>
//               </div>
//             </form>
//           </DialogContent>
//         </Dialog>
//       </div>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {stats.map((stat) => (
//           <Card key={stat.title}>
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
//               <stat.icon className={`h-4 w-4 ${stat.color}`} />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{stat.value}</div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       {/* Filters */}
//       <div className="flex flex-col sm:flex-row gap-4">
//         <div className="relative flex-1 max-w-sm">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
//           <Input
//             placeholder="Search projects..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10"
//           />
//         </div>
//         <div className="flex items-center gap-2">
//           <Filter className="w-4 h-4 text-muted-foreground" />
//           <select
//             value={statusFilter}
//             onChange={(e) => setStatusFilter(e.target.value)}
//             className="p-2 border rounded-md"
//           >
//             <option value="All">All Status</option>
//             {statuses.map((status) => (
//               <option key={status} value={status}>
//                 {status}
//               </option>
//             ))}
//           </select>
//           <select
//             value={priorityFilter}
//             onChange={(e) => setPriorityFilter(e.target.value)}
//             className="p-2 border rounded-md"
//           >
//             <option value="All">All Priorities</option>
//             {priorities.map((priority) => (
//               <option key={priority} value={priority}>
//                 {priority}
//               </option>
//             ))}
//           </select>
//         </div>
//         <Badge variant="secondary" className="self-center">
//           {filteredProjects.length} Total
//         </Badge>
//       </div>

//       {/* Projects Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {filteredProjects.map((project) => (
//           <Card key={project.id} className="hover:shadow-lg transition-shadow">
//             <CardContent className="p-6">
//               <div className="flex items-start justify-between mb-4">
//                 <div>
//                   <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
//                   <p className="text-sm text-muted-foreground">{project.client}</p>
//                 </div>
//                 <div className="flex flex-col gap-2">
//                   <Badge className={getStatusColor(project.status)}>
//                     {getStatusIcon(project.status)}
//                     <span className="ml-1">{project.status}</span>
//                   </Badge>
//                   <Badge className={getPriorityColor(project.priority)}>{project.priority}</Badge>
//                 </div>
//               </div>

//               <div className="space-y-3 mb-4">
//                 <div>
//                   <div className="flex items-center justify-between text-sm mb-1">
//                     <span>Progress</span>
//                     <span>{project.progress}%</span>
//                   </div>
//                   <Progress value={project.progress} className="h-2" />
//                 </div>

//                 <div className="space-y-2">
//                   <div className="flex items-center gap-2 text-sm">
//                     <User className="w-4 h-4 text-muted-foreground" />
//                     <span>Manager: {project.manager}</span>
//                   </div>
//                   <div className="flex items-center gap-2 text-sm">
//                     <MapPin className="w-4 h-4 text-muted-foreground" />
//                     <span>{project.location}</span>
//                   </div>
//                   <div className="flex items-center gap-2 text-sm">
//                     <DollarSign className="w-4 h-4 text-muted-foreground" />
//                     <span>Budget: ${project.budget.toLocaleString()}</span>
//                   </div>
//                   <div className="flex items-center gap-2 text-sm">
//                     <Calendar className="w-4 h-4 text-muted-foreground" />
//                     <span>
//                       {new Date(project.startDate).toLocaleDateString()} -{" "}
//                       {new Date(project.endDate).toLocaleDateString()}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <div className="flex gap-2">
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   className="flex-1 bg-transparent"
//                   onClick={() => openEditDialog(project)}
//                 >
//                   <Edit className="w-4 h-4 mr-2" />
//                   Edit
//                 </Button>
//                 <Button variant="outline" size="sm" className="flex-1 bg-transparent">
//                   View Details
//                 </Button>
//                 <AlertDialog>
//                   <AlertDialogTrigger asChild>
//                     <Button variant="destructive" size="sm">
//                       <Trash2 className="w-4 h-4" />
//                     </Button>
//                   </AlertDialogTrigger>
//                   <AlertDialogContent>
//                     <AlertDialogHeader>
//                       <AlertDialogTitle>Delete Project</AlertDialogTitle>
//                       <AlertDialogDescription>
//                         Are you sure you want to delete {project.name}? This action cannot be undone.
//                       </AlertDialogDescription>
//                     </AlertDialogHeader>
//                     <AlertDialogFooter>
//                       <AlertDialogCancel>Cancel</AlertDialogCancel>
//                       <AlertDialogAction onClick={() => handleDelete(project.id)}>Delete</AlertDialogAction>
//                     </AlertDialogFooter>
//                   </AlertDialogContent>
//                 </AlertDialog>
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       {filteredProjects.length === 0 && (
//         <div className="text-center py-12">
//           <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
//           <h3 className="text-lg font-medium mb-2">No projects found</h3>
//           <p className="text-muted-foreground mb-4">
//             {searchTerm || statusFilter !== "All" || priorityFilter !== "All"
//               ? "Try adjusting your search or filter criteria"
//               : "Get started by creating your first project"}
//           </p>
//           {!searchTerm && statusFilter === "All" && priorityFilter === "All" && (
//             <Button onClick={() => setIsAddDialogOpen(true)}>
//               <Plus className="w-4 h-4 mr-2" />
//               Create First Project
//             </Button>
//           )}
//         </div>
//       )}
//     </div>
//   )
// }

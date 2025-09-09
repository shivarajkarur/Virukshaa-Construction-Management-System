"use client"
import type React from "react"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import {
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building2,
  MapPin,
  Globe,
  Search,
  Filter,
  User,
  FileText,
  Grid3X3,
  List,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
  IndianRupee,
  Calendar,
  Eye,
  Hash,
  FolderOpen,
  Send,
  Lock,
} from "lucide-react"
import MessageBox from "@/components/common/MessageBox"

interface Client { 
  _id: string
  name: string
  username: string
  email: string
  phone: string
  company?: string
  address: string
  city: string
  state: string
  postalCode: string
  projectTotalAmount: number
  taxId?: string
  website?: string
  status: "Active" | "Inactive"
  createdAt: string
  updatedAt: string
  avatar?: string
  password?: string
}

interface Project {
  _id: string
  title: string
  name?: string
  description: string
  status: "Planning" | "In Progress" | "Completed" | "On Hold"
  startDate: string
  endDate: string
  budget: number
  progress: number
  clientId: string
  client?: string
  manager?: string
  createdAt: string
  tasks: Task[]
  address: string
  city: string
  state: string
  postalCode: string
}

interface Task {
  _id: string
  title: string
  description: string
  status: "Not Started" | "In Progress" | "Completed"
  assignedTo?: string
  dueDate: string
  priority: "Low" | "Medium" | "High"
  projectId?: string
}

interface Invoice {
  _id: string
  invoiceNumber: string
  amount: number
  status: "Pending" | "Paid" | "Overdue"
  dueDate: string
  createdAt: string
  notes?: string
}

interface FormData {
  name: string
  username: string
  email: string
  phone: string
  password?: string
  confirmPassword?: string
  company: string
  address: string
  city: string
  state: string
  postalCode: string
  projectTotalAmount: string
  taxId: string
  website: string
  status: "Active" | "Inactive"
  avatar?: string
}

// Message Dialog Component
interface MessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
  onSend: (message: string, clientId: string) => void
}



const initialFormData: FormData = {
  name: "",
  username: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  company: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  projectTotalAmount: "",
  taxId: "",
  website: "",
  status: "Active",
  avatar: undefined,
}

const initialProjectData: Omit<Project, "_id" | "client" | "createdAt" | "tasks"> & {
  address: string
  city: string
  state: string
  postalCode: string
} = {
  title: "",
  description: "",
  status: "Planning",
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  budget: 0,
  progress: 0,
  clientId: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
}

const initialTaskData = {
  title: "",
  description: "",
  status: "Not Started" as Task["status"],
  assignedTo: "",
  dueDate: new Date().toISOString().split("T")[0],
  priority: "Medium" as Task["priority"],
}

export default function ClientsManagement() {
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [formData, setFormData] = useState<FormData>(initialFormData)

  // Detail Panel States
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false)
  const [clientProjects, setClientProjects] = useState<Project[]>([])
  const [clientInvoices, setClientInvoices] = useState<Invoice[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)
  // Invoice Form States
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false)
  const [invoiceFormData, setInvoiceFormData] = useState({
    invoiceNumber: "",
    amount: 0,
    status: "Pending" as Invoice["status"],
    dueDate: new Date().toISOString().split("T")[0],
    notes: "",
  })
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)

  // Project Form States
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [projectFormData, setProjectFormData] = useState(initialProjectData)
  const [projectTasks, setProjectTasks] = useState<Task[]>([])
  const [isSubmittingProject, setIsSubmittingProject] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskFormData, setTaskFormData] = useState(initialTaskData)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)

  // Message Dialog States
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [messageClient, setMessageClient] = useState<Client | null>(null)

  // Project Management States
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState(false)
  const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<string | null>(null)

  // Mock storage for projects
  const [allProjects, setAllProjects] = useState<Project[]>([])

  useEffect(() => {
    fetchClients()
  }, [])

  // Fetch all clients
  const fetchClients = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/clients")
      if (!response.ok) {
        throw new Error("Failed to fetch clients")
      }
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast.error("Failed to load clients")
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch projects for a specific client
  const fetchClientProjects = async (clientId: string) => {
    setIsLoadingProjects(true)
    try {
      const response = await fetch(`/api/projects?clientId=${clientId}`)
      if (!response.ok) {
        // Use local storage as fallback
        const projects = allProjects.filter((project) => project.clientId === clientId)
        setClientProjects(projects)
        toast.warning("Could not load from server. Showing cached projects.")
        return
      }
      const allProjectsData: Project[] = await response.json()
      const projects = allProjectsData.filter((project) => project.clientId === clientId)
      setClientProjects(projects)
      // Update local storage
      setAllProjects(allProjectsData)
      toast.success("Projects loaded from database")
    } catch (error) {
      console.error("Error fetching client projects:", error)
      // Use local storage as fallback
      const projects = allProjects.filter((project) => project.clientId === clientId)
      setClientProjects(projects)
      toast.error("Unable to reach server. Showing cached projects.")
    } finally {
      setIsLoadingProjects(false)
    }
  }

  // Fetch invoices for a specific client
  const fetchClientInvoices = async (clientId: string) => {
    if (!clientId) return
    setIsLoadingInvoices(true)
    try {
      const response = await fetch(`/api/invoices?clientId=${clientId}`)
      if (!response.ok) {
        setClientInvoices([])
        toast.error("Failed to load invoices from server")
        return
      }
      const data = await response.json()
      setClientInvoices(data)
    } catch (error) {
      console.error("Error fetching invoices:", error)
      setClientInvoices([])
      toast.error("Unable to reach server. Invoices unavailable")
    } finally {
      setIsLoadingInvoices(false)
    }
  }

  // Message Dialog Functions
  const handleOpenMessageDialog = (client: Client) => {
    setMessageClient(client)
    setMessageDialogOpen(true)
  }

  const handleSendMessage = (message: string, clientId: string) => {
    console.log(`Sending message to client ${clientId}:`, message)

    if (!message.trim()) {
      toast.warning("Please enter a message before sending")
      return
    }

    toast.success(`Message sent to ${messageClient?.name || "client"} successfully`)
    setMessageDialogOpen(false)
  }

  // Open client details and load related data
  const openClientDetails = async (client: Client) => {
    setSelectedClient(client)
    setIsDetailPanelOpen(true)
    if (client._id) {
      fetchClientProjects(client._id)
      await fetchClientInvoices(client._id)
    }
  }

  const closeClientDetails = () => {
    setIsDetailPanelOpen(false)
    setSelectedClient(null)
    setClientProjects([])
    setClientInvoices([])
  }

  // Project Management Functions
  const openNewProjectDialog = () => {
    if (!selectedClient) return
    setEditingProject(null)
    setProjectFormData({ ...initialProjectData, clientId: selectedClient._id })
    setProjectTasks([])
    setIsProjectDialogOpen(true)
  }

  const openEditProjectDialog = (project: Project) => {
    setEditingProject(project)
    setProjectFormData({
      title: project.title,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget,
      progress: project.progress,
      clientId: project.clientId,
      address: project.address,
      city: project.city,
      state: project.state,
      postalCode: project.postalCode,
    })
    setProjectTasks(project.tasks || [])
    setIsProjectDialogOpen(true)
  }

  const confirmDeleteProject = (projectId: string) => {
    setPendingDeleteProjectId(projectId)
    setIsDeleteProjectDialogOpen(true)
  }

  const deleteProject = async (projectId: string) => {
    const projectToDelete = allProjects.find((p) => p._id === projectId)

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Update both all projects and client projects
        const updatedAllProjects = allProjects.filter((p) => p._id !== projectId)
        setAllProjects(updatedAllProjects)

        // Update client projects immediately
        const updatedClientProjects = clientProjects.filter((p) => p._id !== projectId)
        setClientProjects(updatedClientProjects)

        toast.success(`${projectToDelete?.title || "Project"} deleted successfully`)
      } else {
        // API call failed, check if it's a 404 (already deleted) or other error
        const errorData = await response.json().catch(() => ({}))

        if (response.status === 404) {
          // Project doesn't exist in database, remove from local state
          const updatedAllProjects = allProjects.filter((p) => p._id !== projectId)
          setAllProjects(updatedAllProjects)
          const updatedClientProjects = clientProjects.filter((p) => p._id !== projectId)
          setClientProjects(updatedClientProjects)

          toast.info("Project was already removed from the database")
        } else {
          // Other API error, don't update local state
          throw new Error(errorData.message || `Failed to delete project: ${response.status}`)
        }
      }
    } catch (error) {
      console.error("Error deleting project:", error)

      // Check if it's a network error or server is unreachable
      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error("Cannot connect to server. Please check your internet connection")
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to delete project. Please try again")
      }
    }
  }

  const closeProjectDialog = () => {
    setIsProjectDialogOpen(false)
    setProjectFormData(initialProjectData)
    setProjectTasks([])
    setEditingProject(null)
  }

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient) return

    setIsSubmittingProject(true)

    try {
      const isUpdate = !!editingProject
      const projectId = editingProject?._id || `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const loadingToast = toast.loading(`${isUpdate ? "Updating" : "Creating"} project...`)

      // Create complete project data for API
      const apiProjectData = {
        title: projectFormData.title,
        description: projectFormData.description,
        status: projectFormData.status,
        startDate: projectFormData.startDate,
        endDate: projectFormData.endDate,
        budget: projectFormData.budget,
        progress: projectFormData.progress,
        clientId: selectedClient._id,
        client: selectedClient.name,
        address: projectFormData.address,
        city: projectFormData.city,
        state: projectFormData.state,
        postalCode: projectFormData.postalCode,
        tasks: projectTasks.map((task) => ({
          title: task.title,
          description: task.description || "",
          status: task.status || "Not Started",
          assignedTo: task.assignedTo || "",
          dueDate: task.dueDate || "",
          priority: task.priority || "Medium",
          _id: task._id || undefined,
        })),
      }

      // Try API call first
      const url = isUpdate ? `/api/projects/${editingProject._id}` : "/api/projects"
      const method = isUpdate ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiProjectData),
      })

      if (response.ok) {
        const finalProjectData = await response.json()

        // Update local state
        if (isUpdate) {
          setAllProjects((prev) => prev.map((p) => (p._id === projectId ? finalProjectData : p)))
          setClientProjects((prev) => prev.map((p) => (p._id === projectId ? finalProjectData : p)))
        } else {
          setAllProjects((prev) => [...prev, finalProjectData])
          setClientProjects((prev) => [...prev, finalProjectData])
        }

        toast.dismiss(loadingToast)
        toast.success(`Project ${isUpdate ? "updated" : "created"} successfully`)

        closeProjectDialog()
      } else {
        // API call failed
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to ${isUpdate ? "update" : "create"} project: ${response.status}`)
      }
    } catch (error) {
      console.error("Error saving project:", error)

      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error("Cannot connect to server. Project not saved to database")
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to save project to database")
      }

      // Don't update local state if there was an error
      // This ensures data consistency with the database
    } finally {
      setIsSubmittingProject(false)
    }
  }

  // Task Management Functions
  const openTaskDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task)
      setTaskFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        assignedTo: task.assignedTo || "",
        dueDate: task.dueDate,
        priority: task.priority,
      })
    } else {
      setEditingTask(null)
      setTaskFormData(initialTaskData)
    }
    setIsTaskDialogOpen(true)
  }

  const closeTaskDialog = () => {
    setIsTaskDialogOpen(false)
    setEditingTask(null)
    setTaskFormData(initialTaskData)
  }

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate task form
    if (!taskFormData.title.trim()) {
      toast.warning("Please enter a title for the task")
      return
    }

    if (!taskFormData.assignedTo.trim()) {
      toast.warning("Please assign the task to someone")
      return
    }

    const taskData: Task = {
      _id: editingTask?._id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: taskFormData.title,
      description: taskFormData.description,
      status: taskFormData.status,
      assignedTo: taskFormData.assignedTo,
      dueDate: taskFormData.dueDate,
      priority: taskFormData.priority,
    }

    if (editingTask) {
      setProjectTasks(projectTasks.map((task) => (task._id === editingTask._id ? taskData : task)))
      toast.success(`Task "${taskData.title}" updated successfully`)
    } else {
      setProjectTasks([...projectTasks, taskData])
      toast.success(`Task "${taskData.title}" created successfully`)
    }

    closeTaskDialog()
  }

  const deleteTask = (taskId: string) => {
    const taskToDelete = projectTasks.find((t) => t._id === taskId)
    setProjectTasks(projectTasks.filter((task) => task._id !== taskId))
    toast.success(`Task "${taskToDelete?.title || "Task"}" deleted successfully`)
  }

  // Client CRUD Functions
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Required field validations
    if (!formData.name?.trim()) {
      toast.error("Name is required")
      return
    }

    if (!formData.username?.trim()) {
      toast.error("Username is required")
      return
    }

    // Username format validation (alphanumeric and minimum 4 characters)
    const usernameRegex = /^[a-zA-Z0-9]{4,}$/
    if (!usernameRegex.test(formData.username)) {
      toast.error("Username must be at least 4 characters long and contain only letters and numbers")
      return
    }

    if (!formData.email?.trim()) {
      toast.error("Email is required")
      return
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address")
      return
    }

    if (!formData.phone?.trim()) {
      toast.error("Phone number is required")
      return
    }

    // Phone number validation (basic international format)
    const phoneRegex = /^[+]?[\s\-\(\)0-9]*$/
    if (!phoneRegex.test(formData.phone) || formData.phone.replace(/[^0-9]/g, '').length < 8) {
      toast.error("Please enter a valid phone number")
      return
    }

    if (!formData.address?.trim()) {
      toast.error("Address is required")
      return
    }

    // Project total amount validation
    const amount = Number.parseFloat(formData.projectTotalAmount) || 0
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid project amount")
      return
    }

    // Password validation for new clients or when changing password
    if (!editingClient) {
      if (!formData.password) {
        toast.error("Password is required for new clients")
        return
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match. Please check and try again")
        return
      }

      if (formData.password.length < 6) {
        toast.warning("Password must be at least 6 characters long")
        return
      }

      // Password strength validation
      const hasUpperCase = /[A-Z]/.test(formData.password)
      const hasLowerCase = /[a-z]/.test(formData.password)
      const hasNumbers = /\d/.test(formData.password)

      if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        toast.info("For better security, use uppercase, lowercase, and numbers")
      }
    }

    setLoading(true)

    const loadingToast = toast.loading(`${editingClient ? "Updating" : "Adding"} client...`)

    try {
      const clientData = {
        ...formData,
        projectTotalAmount: Number.parseFloat(formData.projectTotalAmount) || 0,
      }

      // Always remove confirmPassword as it's not needed on the server
      delete clientData.confirmPassword

      // Remove password if it's empty during update
      if (editingClient && (!formData.password || formData.password === "")) {
        delete clientData.password
      }

      const url = editingClient ? `/api/clients/${editingClient._id}` : "/api/clients"
      const method = editingClient ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      })

      if (response.ok) {
        const result = await response.json()
        await fetchClients()

        toast.dismiss(loadingToast)
        toast.success(`${formData.name} ${editingClient ? "updated" : "added"} successfully`)

        // Close dialog and reset form after successful submission
        setIsAddDialogOpen(false)
        setEditingClient(null)
        resetForm()
      } else {
        let errorMessage = "Failed to save client"
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          console.error("Error parsing error response:", e)
        }
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error("Error saving client:", error)
      toast.dismiss(loadingToast)
      toast.error(error instanceof Error ? error.message : "Failed to save client. Please try again")
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const { fileUrl } = await response.json()
      // Use functional update to avoid state update during render
      setFormData(prev => ({ ...prev, avatar: fileUrl }))

      toast.success('Profile photo uploaded successfully')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload profile photo')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const clientToDelete = clients.find((c) => c._id === id)

      const loadingToast = toast.loading(`Deleting ${clientToDelete?.name || "client"}...`)

      const response = await fetch(`/api/clients/${id}`, { method: "DELETE" })

      if (response.ok) {
        setClients(clients.filter((c) => c._id !== id))
        if (selectedClient?._id === id) {
          closeClientDetails()
        }
        toast.dismiss(loadingToast)
        toast.success(`${clientToDelete?.name || "Client"} deleted successfully`)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete client")
      }
    } catch (error) {
      console.error("Error deleting client:", error)
      toast.error("Failed to delete client. Please check your connection and try again")
    }
  }

  const resetForm = () => {
    setFormData({
      ...initialFormData,
      // Preserve any important state that shouldn't be reset
      // (e.g., if there are any filters or UI state in the form data)
    })
  }

  const openEditDialog = (client: Client) => {
    setFormData(prev => ({
      ...prev,
      name: client.name,
      username: client.username,
      email: client.email,
      phone: client.phone,
      password: "",
      confirmPassword: "",
      company: client.company || "",
      address: client.address,
      city: client.city,
      state: client.state,
      postalCode: client.postalCode,
      projectTotalAmount: client.projectTotalAmount?.toString() || "0",
      taxId: client.taxId || "",
      website: client.website || "",
      status: client.status,
      avatar: client.avatar || "",
    }))
    setEditingClient(client)
    setIsAddDialogOpen(true)
  }

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "All" || client.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "Inactive":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Planning":
        return "bg-yellow-100 text-yellow-800"
      case "On Hold":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Not Started":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
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

  const getInvoiceStatusColor = (status: string) => {
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

  // Calculate statistics
  const totalClients = clients.length
  const activeClients = clients.filter((client) => client.status === "Active").length
  const inactiveClients = clients.filter((client) => client.status === "Inactive").length
  const totalRevenue = clients.reduce((sum, client) => sum + (client.projectTotalAmount || 0), 0)

  if (loading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading clients...</p>
        </div>
      </div>
    )
  }

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredClients.map((client) => (
        <Card
          key={client._id}
          className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
          onClick={() => openClientDetails(client)}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={client.avatar || "/placeholder.svg?height=48&width=48"} alt={client.name} />
                  <AvatarFallback>
                    {client.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{client.name}</h3>
                  <p className="text-sm text-muted-foreground">{client.company}</p>
                </div>
              </div>
              <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{client.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{client.phone}</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="truncate">
                  {client.city}, {client.state}
                </span>
              </div>
              {client.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {client.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <IndianRupee className="w-4 h-4 text-muted-foreground" />
                <span>₹{client.projectTotalAmount?.toLocaleString() || "0"}</span>
              </div>
            </div>
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
                onClick={() => openEditDialog(client)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => openClientDetails(client)}>
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenMessageDialog(client)}
                title="Message Client"
              >
                <Send className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Client</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {client.name}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(client._id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderListView = () => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow
                key={client._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => openClientDetails(client)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={client.avatar || "/placeholder.svg?height=40&width=40"} alt={client.name} />
                      <AvatarFallback>
                        {client.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-muted-foreground">{client.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{client.company}</div>
                  {client.website && (
                    <a
                      href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {client.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{client.phone}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>
                      {client.city}, {client.state}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium">₹{client.projectTotalAmount?.toLocaleString() || "0"}</div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(client)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openClientDetails(client)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenMessageDialog(client)}
                      title="Message Client"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Client</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {client.name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(client._id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient?._id) return
    const isUpdate = !!editingInvoice
    const loadingToast = toast.loading(`${isUpdate ? "Updating" : "Creating"} invoice...`)
    try {
      const url = isUpdate ? `/api/invoices/${editingInvoice!._id}` : "/api/invoices"
      const method = isUpdate ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient._id,
          invoiceNumber: invoiceFormData.invoiceNumber.trim(),
          amount: Number(invoiceFormData.amount) || 0,
          status: invoiceFormData.status,
          dueDate: invoiceFormData.dueDate,
          notes: invoiceFormData.notes?.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Failed to ${isUpdate ? "update" : "create"} invoice: ${res.status}`)
      }
      toast.dismiss(loadingToast)
      toast.success(`Invoice ${isUpdate ? "updated" : "created"}`)
      setIsInvoiceDialogOpen(false)
      setEditingInvoice(null)
      await fetchClientInvoices(selectedClient._id)
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error(`${isUpdate ? "Update" : "Create"} invoice error:`, error)
      toast.error(error instanceof Error ? error.message : `Failed to ${isUpdate ? "update" : "create"} invoice`)
    }
  }

  const deleteInvoice = async (invoiceId: string) => {
    const loadingToast = toast.loading("Deleting invoice...")
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Failed to delete invoice: ${res.status}`)
      }
      setClientInvoices((prev) => prev.filter((i) => i._id !== invoiceId))
      toast.dismiss(loadingToast)
      toast.success("Invoice deleted")
    } catch (error) {
      toast.dismiss(loadingToast)
      console.error("Delete invoice error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete invoice")
    }
  }

  const openNewInvoiceDialog = () => {
    setEditingInvoice(null)
    setInvoiceFormData({
      invoiceNumber: "",
      amount: 0,
      status: "Pending",
      dueDate: new Date().toISOString().split("T")[0],
      notes: "",
    })
    setIsInvoiceDialogOpen(true)
  }

  const openEditInvoiceDialog = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setInvoiceFormData({
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      status: invoice.status,
      dueDate: new Date(invoice.dueDate).toISOString().split("T")[0],
      notes: invoice.notes || "",
    })
    setIsInvoiceDialogOpen(true)
  }

  const closeInvoiceDialog = () => {
    setIsInvoiceDialogOpen(false)
    setEditingInvoice(null)
  }

  return (
    <>
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base sm:text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-2xl font-bold">{totalClients}</div>
              <p className="text-sm sm:text-xs text-muted-foreground">Registered clients</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base sm:text-sm font-medium">Active Clients</CardTitle>
              <CheckCircle className="h-5 w-5 sm:h-4 sm:w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-2xl font-bold text-green-600">{activeClients}</div>
              <p className="text-sm sm:text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base sm:text-sm font-medium">Inactive Clients</CardTitle>
              <XCircle className="h-5 w-5 sm:h-4 sm:w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-2xl font-bold text-red-600">{inactiveClients}</div>
              <p className="text-sm sm:text-xs text-muted-foreground">Currently inactive</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base sm:text-sm font-medium">Total Revenue</CardTitle>
              <IndianRupee className="h-5 w-5 sm:h-4 sm:w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-2xl font-bold text-blue-600">₹{totalRevenue.toLocaleString()}</div>
              <p className="text-sm sm:text-xs text-muted-foreground">Total project value</p>
            </CardContent>
          </Card>
        </div>

        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <h1 className="text-4xl sm:text-3xl font-bold tracking-tight">Clients</h1>
            <Button
              onClick={() => {
                setLoading(true)
                fetchClients()
              }}
              className="ml-2 h-12 w-12 sm:h-10 sm:w-10"
              disabled={loading}
              title="Refresh clients"
              variant="outline"
            >
              {loading ? (
                <svg
                  className="animate-spin h-6 w-6 sm:h-5 sm:w-5 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l5-5-5-5v4a10 10 0 00-10 10h4z"
                  ></path>
                </svg>
              ) : (
                <RefreshCw className="h-6 w-6 sm:h-5 sm:w-5" />
              )}
            </Button>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm">
                <Plus className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent
              className="max-w-2xl max-h-[90vh] overflow-y-auto"
              aria-label={editingClient ? "Edit client form" : "Add new client form"}
            >
              <DialogHeader>
                <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
                <DialogDescription>
                  {editingClient ? "Update client information" : "Create a new client record"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Choose a username"
                      required
                      disabled={!!editingClient}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>
                {!editingClient && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter password"
                        required
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Confirm password"
                        required
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter street address"
                      rows={2}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Enter city"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="State/Province"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      type="number"
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="Postal Code"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="projectTotalAmount">Project Total Amount *</Label>
                    <Input
                      id="projectTotalAmount"
                      type="number"
                      value={formData.projectTotalAmount}
                      onChange={(e) => setFormData({ ...formData, projectTotalAmount: e.target.value })}
                      placeholder="Total Amount"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      placeholder="Enter tax ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Profile Photo</Label>
                  <div className="flex items-center gap-4">
                    {formData.avatar ? (
                      <img
                        src={formData.avatar}
                        alt="Profile preview"
                        className="w-16 h-16 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border">
                        <User className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload a profile photo (JPG, PNG, GIF up to 5MB)
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as "Active" | "Inactive" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false)
                      setEditingClient(null)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : editingClient ? "Update Client" : "Create Client"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 sm:h-4 sm:w-4" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 sm:h-10 text-base sm:text-sm"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32 h-11 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant="secondary" className="self-center h-7 text-base sm:text-sm">
              {filteredClients.length} Total
            </Badge>
          </div>
          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg w-full sm:w-auto justify-center sm:justify-start">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-10 sm:h-8 px-4 sm:px-3 flex-1 sm:flex-none"
            >
              <Grid3X3 className="h-5 w-5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-10 sm:h-8 px-4 sm:px-3 flex-1 sm:flex-none"
            >
              <List className="h-5 w-5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>

        {/* Clients Display */}
        {viewMode === "grid" ? renderGridView() : renderListView()}

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No clients found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "All"
                ? "Try adjusting your search or filter criteria"
                : "Get started by adding your first client"}
            </p>
            {!searchTerm && statusFilter === "All" && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Client
              </Button>
            )}
          </div>
        )}

        {/* Project Form Dialog */}
        <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProject ? "Edit Site" : "Create New Site"}</DialogTitle>
              <DialogDescription>
                {editingProject
                  ? `Update site details for ${selectedClient?.name}`
                  : `Create a site for ${selectedClient?.name} with tasks and details`}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleProjectSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Site Title *</Label>
                  <Input
                    id="title"
                    value={projectFormData.title}
                    onChange={(e) => setProjectFormData({ ...projectFormData, title: e.target.value })}
                    placeholder="Enter project title"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={projectFormData.description}
                  onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={projectFormData.status}
                  onValueChange={(value: string) =>
                    setProjectFormData({ ...projectFormData, status: value as Project["status"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={projectFormData.startDate}
                    onChange={(e) => setProjectFormData({ ...projectFormData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={projectFormData.endDate}
                    onChange={(e) => setProjectFormData({ ...projectFormData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={projectFormData.budget}
                    onChange={(e) => setProjectFormData({ ...projectFormData, budget: Number(e.target.value) })}
                    placeholder="Enter budget amount"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Site Address *</Label>
                <Input
                  id="address"
                  value={projectFormData.address}
                  onChange={(e) => setProjectFormData({ ...projectFormData, address: e.target.value })}
                  placeholder="Enter street address"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={projectFormData.city}
                    onChange={(e) => setProjectFormData({ ...projectFormData, city: e.target.value })}
                    placeholder="City"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province *</Label>
                  <Input
                    id="state"
                    value={projectFormData.state}
                    onChange={(e) => setProjectFormData({ ...projectFormData, state: e.target.value })}
                    placeholder="State/Province"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code *</Label>
                  <Input
                    id="postalCode"
                    value={projectFormData.postalCode}
                    onChange={(e) => setProjectFormData({ ...projectFormData, postalCode: e.target.value })}
                    placeholder="Postal Code"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeProjectDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingProject}>
                  {isSubmittingProject
                    ? editingProject
                      ? "Updating..."
                      : "Creating..."
                    : editingProject
                      ? "Update Site"
                      : "Create Site"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Invoice Form Dialog */}
        <Dialog
          open={isInvoiceDialogOpen}
          onOpenChange={(open) => {
            setIsInvoiceDialogOpen(open)
            if (!open) setEditingInvoice(null)
          }}
        >
          <DialogContent
            className="max-w-xl"
            aria-label={editingInvoice ? "Edit invoice form" : "Create new invoice form"}
          >
            <DialogHeader>
              <DialogTitle>{editingInvoice ? "Edit Invoice" : "New Invoice"}</DialogTitle>
              <DialogDescription>
                {editingInvoice
                  ? `Edit invoice ${editingInvoice.invoiceNumber} for ${selectedClient?.name}`
                  : `Create an invoice for ${selectedClient?.name}`}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvoiceSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                  <Input
                    id="invoiceNumber"
                    value={invoiceFormData.invoiceNumber}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, invoiceNumber: e.target.value })}
                    placeholder="e.g. INV-0012"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={invoiceFormData.amount}
                    onChange={(e) =>
                      setInvoiceFormData({ ...invoiceFormData, amount: Number(e.target.value) || 0 })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={invoiceFormData.status}
                    onValueChange={(value) =>
                      setInvoiceFormData({ ...invoiceFormData, status: value as Invoice["status"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={invoiceFormData.dueDate}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={invoiceFormData.notes}
                  onChange={(e) => setInvoiceFormData({ ...invoiceFormData, notes: e.target.value })}
                  placeholder="Optional notes for this invoice"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeInvoiceDialog}>
                  Cancel
                </Button>
                <Button type="submit">{editingInvoice ? "Update Invoice" : "Create Invoice"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Client Detail Sheet */}
        <Sheet open={isDetailPanelOpen} onOpenChange={setIsDetailPanelOpen}>
          <SheetContent className="w-[400px] sm:w-[540px] sm:max-w-none">
            {selectedClient && (
              <>
                <SheetHeader>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={selectedClient.avatar || "/placeholder.svg?height=64&width=64"}
                        alt={selectedClient.name}
                      />
                      <AvatarFallback className="text-xl">
                        {selectedClient.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <SheetTitle className="text-2xl">{selectedClient.name}</SheetTitle>
                      <div className="mt-1">
                        <Badge className={getStatusColor(selectedClient.status)}>{selectedClient.status}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        openEditDialog(selectedClient)
                        setIsDetailPanelOpen(false)
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </SheetHeader>
                <Tabs defaultValue="overview" className="mt-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="projects">Sites</TabsTrigger>
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                  </TabsList>


                  <TabsContent value="overview" className="mt-6 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium">{clientProjects.length} Sites</p>
                              <p className="text-xs text-muted-foreground">Total sites</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="text-sm font-medium">{clientInvoices.length} Invoices</p>
                              <p className="text-xs text-muted-foreground">Total invoices</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    {/* Client Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Client Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Email</p>
                              <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">UserName</p>
                              <p className="text-sm text-muted-foreground">{selectedClient.username}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Lock className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Password</p>
                              <p className="text-sm text-muted-foreground">{selectedClient.password}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Phone</p>
                              <p className="text-sm text-muted-foreground">{selectedClient.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Company</p>
                              <p className="text-sm text-muted-foreground">{selectedClient.company || "N/A"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Address</p>
                              <p className="text-sm text-muted-foreground">{selectedClient.address}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Location</p>
                              <p className="text-sm text-muted-foreground">
                                {selectedClient.city}, {selectedClient.state} {selectedClient.postalCode}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <IndianRupee className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Project Total</p>
                              <p className="text-sm text-muted-foreground">
                                ₹{selectedClient.projectTotalAmount?.toLocaleString() || "0"}
                              </p>
                            </div>
                          </div>
                          {selectedClient.taxId && (
                            <div className="flex items-center gap-3">
                              <Hash className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">Tax ID</p>
                                <p className="text-sm text-muted-foreground">{selectedClient.taxId}</p>
                              </div>
                            </div>
                          )}
                          {selectedClient.website && (
                            <div className="flex items-center gap-3">
                              <Globe className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">Website</p>
                                <a
                                  href={
                                    selectedClient.website.startsWith("http")
                                      ? selectedClient.website
                                      : `https://${selectedClient.website}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  {selectedClient.website.replace(/^https?:\/\//, "")}
                                </a>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Client Since</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(selectedClient.createdAt), "PPP")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="projects" className="mt-6 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Client Sites</h3>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => selectedClient && fetchClientProjects(selectedClient._id)}
                          title="Refresh Projects"
                          disabled={isLoadingProjects}
                        >
                          <RefreshCw className={`w-4 h-4 ${isLoadingProjects ? "animate-spin" : ""}`} />
                        </Button>
                        <Button size="sm" onClick={openNewProjectDialog}>
                          <Plus className="w-4 h-4 mr-2" />
                          New Site
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3 overflow-auto h-[calc(100vh-300px)]">
                      {isLoadingProjects ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
                        </div>
                      ) : clientProjects.length > 0 ? (
                        clientProjects.map((project) => (
                          <Card key={project._id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-medium text-lg">{project.title}</h4>
                                  <Badge className={getProjectStatusColor(project.status)} variant="secondary">
                                    {project.status}
                                  </Badge>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    onClick={() => openEditProjectDialog(project)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <AlertDialog
                                    open={isDeleteProjectDialogOpen && pendingDeleteProjectId === project._id}
                                    onOpenChange={(open) => {
                                      if (!open) setIsDeleteProjectDialogOpen(false)
                                    }}
                                  >
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="destructive"
                                        onClick={() => confirmDeleteProject(project._id)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Site</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete the site "{project.title}"? This action cannot
                                          be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => setIsDeleteProjectDialogOpen(false)}>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteProject(project._id)}>
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>

                              {/* Project Description */}
                              {project.description && (
                                <div className="mb-3">
                                  <p className="text-sm text-muted-foreground">{project.description}</p>
                                </div>
                              )}

                              {/* Project Details Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                      <p className="font-medium">Start Date</p>
                                      <p className="text-muted-foreground">
                                        {format(new Date(project.startDate), "MMM d, yyyy")}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                      <p className="font-medium">End Date</p>
                                      <p className="text-muted-foreground">
                                        {format(new Date(project.endDate), "MMM d, yyyy")}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <IndianRupee className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                      <p className="font-medium">Budget</p>
                                      <p className="text-muted-foreground">₹{project.budget.toLocaleString("en-IN")}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Address Section */}
                              <div className="border-t pt-3 mt-3">
                                <h5 className="font-medium mb-2 flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  Site Address
                                </h5>
                                <div className="space-y-1 text-sm">
                                  <p className="text-muted-foreground">{project.address}</p>
                                  <p className="text-muted-foreground">
                                    {[project.city, project.state, project.postalCode].filter(Boolean).join(", ")}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <FolderOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">No sites found</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 bg-transparent"
                            onClick={openNewProjectDialog}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Site
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="invoices" className="mt-6 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Invoices</h3>
                      <Button size="sm" onClick={openNewInvoiceDialog}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Invoice
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {isLoadingInvoices ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
                        </div>
                      ) : clientInvoices.length > 0 ? (
                        clientInvoices.map((invoice) => (
                          <Card key={invoice._id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-medium">{invoice.invoiceNumber}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Due: {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
                                  </p>
                                </div>
                                <div className="flex items-start gap-3">
                                  <div className="text-right">
                                    <Badge className={getInvoiceStatusColor(invoice.status)} variant="secondary">
                                      {invoice.status}
                                    </Badge>
                                    <p className="text-lg font-semibold mt-1">₹{invoice.amount.toLocaleString()}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      title="Edit invoice"
                                      onClick={() => openEditInvoiceDialog(invoice)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" title="Delete invoice">
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete invoice</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete invoice {invoice.invoiceNumber}? This action
                                            cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => deleteInvoice(invoice._id)}>
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>Created: {format(new Date(invoice.createdAt), "MMM dd, yyyy")}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">No invoices found</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 bg-transparent"
                            onClick={openNewInvoiceDialog}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Invoice
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Message Dialog */}
        <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
          <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>Message Client</DialogTitle>
              <DialogDescription>Chat with client</DialogDescription>
            </DialogHeader>
            {messageClient ? (
              <MessageBox
                userType="admin"
                title={messageClient.name}
                conversationId={messageClient._id}
                onBack={() => setMessageDialogOpen(false)}
                className="h-[70vh]"
              />
            ) : (
              <div className="p-6">No client selected</div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Package, ArrowLeft, AlertTriangle, TrendingDown, CheckCircle, Trash2 } from "lucide-react"
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
import { toast } from "sonner"

interface Project {
  _id: string
  title: string
  status?: string
  progress?: number
  client?: { name?: string }
}

interface Material {
  _id: string
  name: string
  category: string
  unit: string
  currentStock: number
  reorderLevel: number
  pricePerUnit: number
  status: "In Stock" | "Low Stock" | "Out of Stock" | "On Order"
  lastUpdated: string
}

export default function AdminMaterials() {
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [search, setSearch] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)

  const filteredMaterials = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return materials
    return materials.filter(m =>
      [m.name, m.category, m.unit].filter(Boolean).some(v => String(v).toLowerCase().includes(q))
    )
  }, [materials, search])

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/projects`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load projects')
        const data = await res.json()
        setProjects((data || []).map((p: any) => ({ _id: p._id, title: p.title, status: p.status, progress: p.progress, client: p.client })))
      } catch (e) {
        console.error(e)
        setProjects([])
      } finally {
        setLoading(false)
      }
    }
    loadProjects()
  }, [])

  const openProject = async (project: Project) => {
    try {
      setLoading(true)
      setSelectedProject(project)
      const res = await fetch(`/api/materials?projectId=${encodeURIComponent(project._id)}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load materials')
      const data = await res.json()
      setMaterials(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "In Stock":
        return <Badge className="bg-green-100 text-green-800" variant="secondary"><CheckCircle className="w-3 h-3 mr-1" />In Stock</Badge>
      case "Low Stock":
        return <Badge className="bg-yellow-100 text-yellow-800" variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Low Stock</Badge>
      case "Out of Stock":
        return <Badge className="bg-red-100 text-red-800" variant="secondary"><TrendingDown className="w-3 h-3 mr-1" />Out of Stock</Badge>
      case "On Order":
        return <Badge className="bg-blue-100 text-blue-800" variant="secondary">On Order</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Remove project from local state
        setProjects(prev => prev.filter(p => p._id !== projectId))
        toast.success("Project deleted successfully")
      } else {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 404) {
          // Project doesn't exist in database, remove from local state
          setProjects(prev => prev.filter(p => p._id !== projectId))
          toast.info("Project was already removed from the database")
        } else {
          throw new Error(errorData.message || `Failed to delete project: ${response.status}`)
        }
      }
    } catch (error) {
      console.error("Error deleting project:", error)
      
      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error("Cannot connect to server. Please check your internet connection")
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to delete project. Please try again")
      }
    } finally {
      setIsDeleting(false)
      setProjectToDelete(null)
    }
  }

  const confirmDelete = (projectId: string) => {
    setProjectToDelete(projectId)
  }

  const cancelDelete = () => {
    setProjectToDelete(null)
  }

  if (!selectedProject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Projects</h2>
            <p className="text-muted-foreground">Select a project to view stored materials</p>
          </div>
        </div>

        {loading && (
          <div className="text-sm text-muted-foreground">Loading projects...</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <Card key={p._id} className="hover:shadow-lg transition-shadow relative group">
              {/* Delete button */}
              <AlertDialog open={projectToDelete === p._id} onOpenChange={(open) => !open && cancelDelete()}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      confirmDelete(p._id)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Project</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete the project "{p.title}"? This action cannot be undone.
                      All materials associated with this project will also be removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteProject(p._id)}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <div className="cursor-pointer" onClick={() => openProject(p)}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-start gap-10">
                    <span>{p.title}</span> 
                    <Badge variant="outline">{p.status || 'Active'}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {p.client?.name && (
                    <div className="mt-2 text-sm text-muted-foreground">Client: {p.client.name}</div>
                  )}
                </CardContent>
              </div>
            </Card>
          ))}
          {!loading && projects.length === 0 && (
            <div className="text-sm text-muted-foreground">No projects found.</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => { setSelectedProject(null); setMaterials([]); }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{selectedProject.title}</h2>
            <p className="text-muted-foreground">Materials stored by supervisors for this project</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Search materials..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-[240px]" />
        </div>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">Loading materials...</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map((m) => (
          <Card key={m._id} className="hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Package className="w-4 h-4" />{m.name}</span>
                {getStatusBadge(m.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Category</div>
                <div>{m.category}</div>
                <div className="text-muted-foreground">Unit</div>
                <div>{m.unit || '-'}</div>
                <div className="text-muted-foreground">Stock</div>
                <div>{m.currentStock}</div>
                <div className="text-muted-foreground">Reorder Level</div>
                <div>{m.reorderLevel}</div>
                {/* <div className="text-muted-foreground">Price/Unit</div> */}
                {/* <div>₹{Number(m.pricePerUnit || 0).toLocaleString()}</div> */}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Updated: {new Date(m.lastUpdated).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && filteredMaterials.length === 0 && (
          <div className="text-sm text-muted-foreground">No materials found for this project.</div>
        )}
      </div>
    </div>
  )
}

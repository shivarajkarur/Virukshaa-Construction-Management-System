"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import { Textarea } from "@/components/ui/textarea"
import { Calendar, User, DollarSign, Camera, MessageSquare, FileText, Star, IndianRupee } from "lucide-react"

export default function ClientProjectsManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  type UIProject = {
    id: string
    name: string
    description: string
    progress: number
    status: string
    budget: string
    spent?: string
    startDate?: string
    expectedCompletion?: string
    actualCompletion?: string | null
    manager?: string
    location?: string
    address?: string
    city?: string
    state?: string
    postalCode?: string
    contractor?: string
    milestones: { name: string; status: string; date?: string }[]
    recentUpdates: { date: string; update: string; photos: number }[]
  }
  const [projects, setProjects] = useState<UIProject[]>([])

  const currency = (n?: number) => {
    if (typeof n !== 'number' || isNaN(n)) return '₹0'
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
  }

  const formatDate = (d?: string) => {
    if (!d) return '-'
    const date = new Date(d)
    if (isNaN(date.getTime())) return d
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const parseToMs = (d?: string) => {
    if (!d) return NaN
    // Try native
    let t = Date.parse(d)
    if (!isNaN(t)) return t
    // Try YYYY-MM-DD
    const iso = /^\d{4}-\d{2}-\d{2}$/
    if (iso.test(d)) {
      t = Date.parse(`${d}T00:00:00`)
      if (!isNaN(t)) return t
    }
    // Try DD/MM/YYYY
    const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    const m1 = d.match(dmy)
    if (m1) {
      const day = parseInt(m1[1], 10)
      const month = parseInt(m1[2], 10) - 1
      const year = parseInt(m1[3], 10)
      const dt = new Date(year, month, day)
      if (!isNaN(dt.getTime())) return dt.getTime()
    }
    // Try hyphen separated: prefer DD-MM-YYYY (Indian common), fallback MM-DD-YYYY
    const hyphen = /^(\d{1,2})\-(\d{1,2})\-(\d{4})$/
    const mHy = d.match(hyphen)
    if (mHy) {
      const a = parseInt(mHy[1], 10)
      const b = parseInt(mHy[2], 10)
      const y = parseInt(mHy[3], 10)
      const tryBuild = (day:number, month:number, year:number) => {
        const dt = new Date(year, month - 1, day)
        return isNaN(dt.getTime()) ? NaN : dt.getTime()
      }
      // Prefer DD-MM-YYYY when first part > 12 or second part <= 12 but we choose Indian style by default
      let tCandidate = tryBuild(a, b, y) // DD-MM-YYYY
      if (!isNaN(tCandidate)) return tCandidate
      tCandidate = tryBuild(b, a, y) // MM-DD-YYYY fallback
      if (!isNaN(tCandidate)) return tCandidate
    }
    // Try DD MMM YYYY (e.g., 18 Aug 2025)
    const dMonY = /^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/
    const m3 = d.match(dMonY)
    if (m3) {
      const day = parseInt(m3[1], 10)
      const monStr = m3[2].toLowerCase()
      const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
      const month = months.indexOf(monStr.slice(0,3))
      const year = parseInt(m3[3], 10)
      if (month >= 0) {
        const dt = new Date(year, month, day)
        if (!isNaN(dt.getTime())) return dt.getTime()
      }
    }
    return NaN
  }

  const startOfDay = (ms: number) => {
    const d = new Date(ms)
    d.setHours(0,0,0,0)
    return d.getTime()
  }

  const computeDurationProgress = (start?: string, end?: string, fallback?: number) => {
    const sRaw = parseToMs(start)
    const eRaw = parseToMs(end)
    if (!isNaN(sRaw) && !isNaN(eRaw) && eRaw > sRaw) {
      const s = startOfDay(sRaw)
      const e = startOfDay(eRaw)
      const today = startOfDay(Date.now())
      if (today < s) return 0
      if (today === s) return 1
      if (today >= e) return 100
      const dayMs = 24 * 60 * 60 * 1000
      const totalDays = Math.max(1, Math.round((e - s) / dayMs))
      const elapsedDays = Math.max(0, Math.min(totalDays, Math.round((today - s) / dayMs)))
      let pct = Math.round((elapsedDays / totalDays) * 100)
      if (pct === 0 && today > s) pct = 1 // show minimal progress on/after start day
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        // Debug log once in a while; keep it lightweight
        try {
          console.debug('[durationProgress]', {
            start,
            end,
            parsedStart: new Date(sRaw).toISOString(),
            parsedEnd: new Date(eRaw).toISOString(),
            today: new Date(today).toISOString(),
            totalDays,
            elapsedDays,
            pct,
          })
        } catch {}
      }
      return Math.max(0, Math.min(100, pct))
    }
    return typeof fallback === 'number' && !isNaN(fallback) ? Math.max(0, Math.min(100, Math.round(fallback))) : 0
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const clientId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
        if (!clientId) {
          setProjects([])
          setError('No client session found')
          return
        }
        const res = await fetch(`/api/projects?clientId=${encodeURIComponent(clientId)}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || 'Failed to fetch projects')
        }
        const data = await res.json()
        const mapped: UIProject[] = (Array.isArray(data) ? data : []).map((p: any) => ({
          id: p._id,
          name: p.title,
          description: p.description || '',
          progress: typeof p.progress === 'number' ? p.progress : 0,
          status: p.status || 'Planning',
          budget: currency(p.budget),
          spent: undefined,
          startDate: p.startDate,
          expectedCompletion: p.endDate,
          actualCompletion: null,
          manager: p.manager,
          location: [p.city, p.state].filter(Boolean).join(', '),
          address: p.address,
          city: p.city,
          state: p.state,
          postalCode: p.postalCode,
          contractor: undefined,
          milestones: [],
          recentUpdates: [],
        }))
        setProjects(mapped)
      } catch (e: any) {
        setError(e?.message || 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "On Track":
        return "bg-green-100 text-green-800"
      case "Delayed":
        return "bg-red-100 text-red-800"
      case "Nearly Complete":
        return "bg-blue-100 text-blue-800"
      case "Completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const getMilestoneColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Pending":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || project.status.toLowerCase().includes(statusFilter.toLowerCase())
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">My Projects</h2>
          <p className="text-muted-foreground">Track and manage your construction projects</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Status</option>
          <option value="on track">On Track</option>
          <option value="delayed">Delayed</option>
          <option value="nearly complete">Nearly Complete</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Loading / Error states */}
      {loading && (
        <div className="text-center py-8 text-sm text-muted-foreground">Loading projects...</div>
      )}
      {!loading && error && (
        <div className="text-center py-8 text-sm text-red-600">{error}</div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="h-fit">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription className="mt-1">{project.description}</CardDescription>
                </div>
                <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{computeDurationProgress(project.startDate, project.expectedCompletion, project.progress)}%</span>
                </div>
                <Progress value={computeDurationProgress(project.startDate, project.expectedCompletion, project.progress)} />
              </div>

              {/* Project Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {/* <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                </div> */}
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-muted-foreground" />
                  <span>Budget: {project.budget}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Start Date: {formatDate(project.startDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>End Date: {formatDate(project.expectedCompletion)}</span>
                </div>

                <div className="items-center gap-2 hidden">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>Manager: {project.manager || '-'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">Site Address:</span>
                  <span className="leading-snug">
                    {project.address || '-'}
                    {project.city || project.state || project.postalCode ? (
                      <>
                        <br />
                        {[project.city, project.state, project.postalCode].filter(Boolean).join(', ')}
                      </>
                    ) : null}
                  </span>
                </div>
              </div>

              {/* Recent Updates */}
              
            </CardContent>
            {/* Actions */}
            {/* <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    View Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{project.name}</DialogTitle>
                    <DialogDescription>{project.description}</DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="milestones">Milestones</TabsTrigger>
                      <TabsTrigger value="updates">Updates</TabsTrigger>
                      <TabsTrigger value="documents">Documents</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Project Manager</Label>
                          <p className="text-sm text-muted-foreground">{project.manager}</p>
                        </div>
                        <div>
                          <Label>Contractor</Label>
                          <p className="text-sm text-muted-foreground">{project.contractor}</p>
                        </div>
                        <div>
                          <Label>Location</Label>
                          <p className="text-sm text-muted-foreground">{project.location}</p>
                        </div>
                        <div>
                          <Label>Start Date</Label>
                          <p className="text-sm text-muted-foreground">{project.startDate}</p>
                        </div>
                      </div>
                      <div>
                        <Label>Progress: {project.progress}%</Label>
                        <Progress value={project.progress} className="mt-2" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Total Budget</Label>
                          <p className="text-lg font-semibold">{project.budget}</p>
                        </div>
                        <div>
                          <Label>Amount Spent</Label>
                          <p className="text-lg font-semibold">{project.spent}</p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="milestones" className="space-y-4">
                      {project.milestones.map((milestone, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{milestone.name}</h4>
                            <p className="text-sm text-muted-foreground">Expected: {milestone.date}</p>
                          </div>
                          <Badge className={getMilestoneColor(milestone.status)}>{milestone.status}</Badge>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="updates" className="space-y-4">
                      {project.recentUpdates.map((update, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">{update.date}</span>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Camera className="w-4 h-4" />
                              {update.photos} photos
                            </div>
                          </div>
                          <p>{update.update}</p>
                          <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                            View Photos
                          </Button>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="documents" className="space-y-4">
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Project documents will be available here</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Feedback
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Project Feedback</DialogTitle>
                    <DialogDescription>Share your feedback about {project.name}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Rating</Label>
                      <div className="flex gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-5 h-5 text-yellow-400 fill-current cursor-pointer" />
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="feedback">Your Feedback</Label>
                      <Textarea
                        id="feedback"
                        placeholder="Share your thoughts about the project progress..."
                        rows={4}
                      />
                    </div>
                    <Button className="w-full">Submit Feedback</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div> */}
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No projects found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}

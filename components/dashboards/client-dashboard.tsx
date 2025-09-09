"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ClientMessageBox from "@/components/common/ClientMessageBox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Bell, Camera, Clock, DollarSign, FolderOpen, MessageSquare, TrendingUp, CreditCard, Calendar, Loader2, Phone } from "lucide-react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ClientProjectsManagement from "@/components/management/client-projects"
import ClientPaymentsManagement from "@/components/management/client-payments"
import ClientSettingsManagement from "@/components/management/client-settings"
import { useClient } from "@/contexts/ClientContext"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

// Types
type Project = {
  id: string
  name: string
  progress: number
  status: 'On Track' | 'Delayed' | 'Nearly Complete'
  budget: string
  completion: string
  manager: string
  location: string
  lastUpdate: string
}

type Update = {
  id: string
  project: string
  update: string
  date: string
  photos: number
  type: 'milestone' | 'progress' | 'schedule'
}

type StatCard = {
  id: string
  title: string
  value: string
  icon: React.ElementType
  color: string
  bgColor: string
}

// Constants
const PROJECT_STATS: StatCard[] = [
  {
    id: 'active-projects',
    title: 'Active Projects',
    value: '0',
    icon: FolderOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'total-investment',
    title: 'Total Investment',
    value: '$1.2M',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    id: 'avg-progress',
    title: 'Avg. Progress',
    value: '68%',
    icon: TrendingUp,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },

]

const PROJECTS: Project[] = []


// Components
const StatCard = ({ title, value, icon: Icon, color, bgColor }: StatCard) => (
  <Card className="hover:shadow-md transition-shadow duration-200">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      <div className={`p-2 rounded-lg ${bgColor}`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <p className="text-xs text-gray-500 mt-1">Updated just now</p>
    </CardContent>
  </Card>
)

const ProjectCard = ({ project }: { project: Project }) => {
  const statusColors = {
    'On Track': 'bg-green-100 text-green-800 border-green-200',
    'Delayed': 'bg-red-100 text-red-800 border-red-200',
    'Nearly Complete': 'bg-blue-100 text-blue-800 border-blue-200',
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{project.name}</h4>
          <p className="text-sm text-gray-500">{project.location}</p>
        </div>
        {/* <Badge className={statusColors[project.status]}>{project.status}</Badge> */}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
        <div><span className="font-medium">Budget:</span> {project.budget}</div>
        <div><span className="font-medium">Completion:</span> {project.completion}</div>
      </div>

   
    </div>
  )
}

const UpdateCard = ({ update }: { update: Update }) => {
  const updateIcons = {
    milestone: <Calendar className="w-4 h-4 text-blue-600" />,
    progress: <TrendingUp className="w-4 h-4 text-green-600" />,
    schedule: <Clock className="w-4 h-4 text-orange-600" />
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex items-start gap-3">
        <div className="mt-1">{updateIcons[update.type]}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm mb-1">{update.project}</h4>
          <p className="text-sm text-gray-600 mb-2">{update.update}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{update.date}</span>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Camera className="w-3 h-3" />
              {update.photos}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const QuickActionCard = ({
  title,
  description,
  icon: Icon,
  color,
  onClick
}: {
  title: string
  description: string
  icon: React.ElementType
  color: string
  onClick: () => void
}) => (
  <Card
    className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
    onClick={onClick}
  >
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        <div className={`p-2 ${color} rounded-lg`}>
          <Icon className="w-5 h-5" />
        </div>
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-600 mb-4">{description}</p>
      <Button className="w-full">
        {title.startsWith('View') ? title : `Go to ${title}`}
      </Button>
    </CardContent>
  </Card>
)

// Main Component
export default function ClientDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const router = useRouter()
  const { data: session } = useSession()
  const { client, isLoading, error } = useClient()
  const [lastMessage, setLastMessage] = useState<{ text: string; timestamp: string } | null>(null)
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState<boolean>(false)
  const [projectTotals, setProjectTotals] = useState<{ count: number; totalBudget: number; avgProgress: number }>({ count: 0, totalBudget: 0, avgProgress: 0 })
  const [invoiceTotals, setInvoiceTotals] = useState<{ paid: number; invoiced: number; pending: number; overdue: number }>({ paid: 0, invoiced: 0, pending: 0, overdue: 0 })
  const [queryClientId, setQueryClientId] = useState<string | null>(null)

  // Helpers: parse dates and compute duration-based progress (mirrors client-projects.tsx)
  const parseToMs = (d?: string) => {
    if (!d) return NaN
    let t = Date.parse(d)
    if (!isNaN(t)) return t
    const iso = /^\d{4}-\d{2}-\d{2}$/
    if (iso.test(d)) {
      t = Date.parse(`${d}T00:00:00`)
      if (!isNaN(t)) return t
    }
    const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    const m1 = d.match(dmy)
    if (m1) {
      const day = parseInt(m1[1], 10)
      const month = parseInt(m1[2], 10) - 1
      const year = parseInt(m1[3], 10)
      const dt = new Date(year, month, day)
      if (!isNaN(dt.getTime())) return dt.getTime()
    }
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
      let tCandidate = tryBuild(a, b, y) // DD-MM-YYYY
      if (!isNaN(tCandidate)) return tCandidate
      tCandidate = tryBuild(b, a, y) // MM-DD-YYYY
      if (!isNaN(tCandidate)) return tCandidate
    }
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
      if (pct === 0 && today > s) pct = 1
      return Math.max(0, Math.min(100, pct))
    }
    return typeof fallback === 'number' && Number.isFinite(fallback)
      ? Math.max(0, Math.min(100, Math.round(fallback)))
      : 0
  }

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  // Read clientId from URL (?clientId=...) as a fallback for testing / direct link
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

  // Local polling for latest message preview (dashboard-only), scoped per client conversation
  useEffect(() => {
    let mounted = true
    const convId = client?._id || queryClientId || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null)
    if (!convId) return

    const fetchLatest = async () => {
      try {
        const url = `/api/messages?conversationId=${encodeURIComponent(convId)}&_t=${Date.now()}`
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const msgs: Array<{ id: string; text: string; timestamp: string; read?: boolean }> = data?.messages || []
        if (!mounted) return
        if (msgs.length > 0) {
          const last = msgs[msgs.length - 1]
          setLastMessage({ text: last.text, timestamp: last.timestamp })
          setUnreadCount(msgs.filter(m => !m.read).length)
        } else {
          setLastMessage(null)
          setUnreadCount(0)
        }
      } catch (_) { /* silent */ }
    }

    fetchLatest()
    const interval = setInterval(fetchLatest, 6000)
    return () => { mounted = false; clearInterval(interval) }
  }, [client?._id, queryClientId])

  // Fetch real projects for this client (fallback to localStorage userId like client-projects.tsx)
  useEffect(() => {
    const load = async () => {
      const lcId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
      const id = client?._id || queryClientId || lcId
      if (!id) return
      setProjectsLoading(true)
      try {
        const res = await fetch(`/api/projects?clientId=${encodeURIComponent(id)}` , { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load projects')
        const data = await res.json()
        const apiProjects = Array.isArray(data) ? data : []
        // compute totals from raw API payload
        const count = apiProjects.length
        const totalBudget = apiProjects.reduce((sum: number, p: any) => {
          const n = typeof p.budget === 'number' ? p.budget : Number(p.budget) || 0
          return sum + (isNaN(n) ? 0 : n)
        }, 0)
        // Use duration-based progress with fallback to stored progress for parity with Projects page
        const displayProgresses: number[] = apiProjects.map((p: any) => {
          const fallback = typeof p.progress === 'number'
            ? p.progress
            : (parseFloat(String(p.progress).replace(/[^0-9.]/g, '')) || 0)
          return computeDurationProgress(p.startDate, p.endDate, fallback)
        })
        const avgProgress = displayProgresses.length > 0
          ? Math.round(displayProgresses.reduce((s, n) => s + n, 0) / displayProgresses.length)
          : 0
        if (displayProgresses.length > 0 && avgProgress === 0 && typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          try { console.debug('[ClientDashboard] displayProgresses', displayProgresses, 'raw sample', apiProjects.slice(0,2)) } catch {}
        }
        const mapped: Project[] = apiProjects.map((p: any) => {
          const fb = typeof p.progress === 'number' ? p.progress : (parseFloat(String(p.progress).replace(/[^0-9.]/g, '')) || 0)
          const progress = computeDurationProgress(p.startDate, p.endDate, fb)
          const status: Project['status'] = progress >= 85 ? 'Nearly Complete' : progress < 60 ? 'Delayed' : 'On Track'
          const budgetNum = typeof p.budget === 'number' ? p.budget : Number(p.budget) || 0
          const end = p.endDate ? new Date(p.endDate) : null
          const completion = end && !isNaN(end.getTime())
            ? end.toLocaleString(undefined, { month: 'short', year: 'numeric' })
            : '-'
          const updated = p.updatedAt ? new Date(p.updatedAt) : null
          return {
            id: p._id || p.id || Math.random().toString(36).slice(2),
            name: p.title || 'Untitled Project',
            progress,
            status,
            budget: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(budgetNum || 0),
            completion,
            manager: p.manager || '—',
            location: [p.city, p.state].filter(Boolean).join(', ') || p.address || '—',
            lastUpdate: updated && !isNaN(updated.getTime()) ? updated.toLocaleDateString() : '—',
          } as Project
        })
        setProjects(mapped)
        setProjectTotals({ count, totalBudget, avgProgress })

      } catch (e: any) {
        console.error(e)
        toast.error(e?.message || 'Could not load projects')
      } finally {
        // Always attempt to fetch invoices even if projects failed
        try {
          const invRes = await fetch(`/api/invoices?clientId=${encodeURIComponent(id)}&_t=${Date.now()}`, { cache: 'no-store' })
          if (invRes.ok) {
            const invData = await invRes.json()
            const list = Array.isArray(invData) ? invData : (Array.isArray(invData?.invoices) ? invData.invoices : [])
            const totals = list.reduce((acc: any, inv: any) => {
              const amt = typeof inv.amount === 'number'
                ? inv.amount
                : parseFloat(String(inv.amount).replace(/[^0-9.-]/g, '')) || 0
              acc.invoiced += amt
              if (inv.status === 'Paid') acc.paid += amt
              if (inv.status === 'Pending') acc.pending += amt
              if (inv.status === 'Overdue') acc.overdue += amt
              return acc
            }, { paid: 0, invoiced: 0, pending: 0, overdue: 0 })
            setInvoiceTotals(totals)
            if (list.length > 0 && totals.invoiced === 0) {
              console.warn('[ClientDashboard] Invoices found but total = 0. Raw sample:', list.slice(0,2))
            }
          } else {
            setInvoiceTotals({ paid: 0, invoiced: 0, pending: 0, overdue: 0 })
          }
        } catch (_) {
          setInvoiceTotals({ paid: 0, invoiced: 0, pending: 0, overdue: 0 })
        }
        setProjectsLoading(false)
      }
    }
    load()
  }, [client?._id, queryClientId])

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'projects':
        return (
          <>
            <ClientProjectsManagement />
          </>
        )
      case 'payments':
        return <ClientPaymentsManagement />
      case 'message': {
        // Compute the same conversationId used across the dashboard (no 'guest-chat' fallbacks)
        let convId = client?._id || queryClientId || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null)
        if (!convId) {
          return (
            <div className="h-[calc(100vh-200px)] bg-white rounded-lg shadow-sm flex items-center justify-center p-6 text-center text-gray-600">
              <div>
                <p className="text-lg font-medium">No conversation available</p>
                <p className="text-sm mt-2">Please sign in or complete profile to start chatting.</p>
              </div>
            </div>
          )
        }
        return (
          <ClientMessageBox
            title={client?.name ? `${client.name}` : 'Virukshaa'}
            conversationId={convId}  
          />
        )
      }
      default:
        return (
          <div className="space-y-8">
            {/* Welcome Section */}
            {isLoading ? (
              <div className="flex items-center justify-center p-8 bg-white rounded-lg border">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2">Loading your dashboard...</span>
              </div>
            ) : client ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      Welcome back, {client.name?.split(' ')[0] || 'Valued Client'}!
                    </h1>
                    <p className="text-gray-600">
                      {client.company ? `Here's an overview of your projects at ${client.company}.` : "Here's an overview of your construction projects and recent activity."}
                    </p>
                  </div>
                  {client.avatar && (
                    <div className="h-16 w-16 rounded-full bg-white border-2 border-blue-200 overflow-hidden">
                      <img
                        src={client.avatar}
                        alt={client.name || 'Client'}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Client Info Badges */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {client.email && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {client.email}
                    </Badge>
                  )}
                  {client.phone && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {client.phone}
                    </Badge>
                  )}
                  {client.status && (
                    <Badge
                      variant={client.status.toLowerCase() === 'active' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {client.status}
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6 border hidden border-red-100">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h1>
                <p className="text-gray-600">Please complete your profile to get started.</p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => setActiveSection('settings')}
                >
                  Go to Settings
                </Button>
              </div>
            )}

            {/* Project Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {PROJECT_STATS.map((stat) => {
                const s = { ...stat }
                switch (s.id) {
                  case 'active-projects':
                    s.value = String(projectTotals.count)
                    break
                  case 'total-investment':
                    s.value = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(invoiceTotals.invoiced || 0)
                    break
                  case 'avg-progress':
                    s.value = `${projectTotals.avgProgress}%`
                    break
                }
                return <StatCard key={s.id} {...s} />
              })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* My Projects */}
              <div className="xl:col-span-2">
                <Card className="h-fit">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">My Projects</CardTitle>
                        <CardDescription>Overview of your actijhkhkhve construction projects</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setActiveSection('projects')}>
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {projectsLoading ? (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading projects...
                      </div>
                    ) : projects.length === 0 ? (
                      <div className="text-sm text-gray-500">No projects found.</div>
                    ) : (
                      <div className="space-y-6">
                        {projects.map((project) => (
                          <ProjectCard key={project.id} project={project} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Cards: Latest Message + Recent Updates */}
              <div className="space-y-6">
                {/* Latest Message */}
                <Card className="h-fit">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Latest Message</CardTitle>
                      <CardDescription>Recent conversation with support</CardDescription>
                    </div>
                    {unreadCount > 0 && (
                      <Badge className="bg-green-100 text-green-800 border border-green-200">{unreadCount} new</Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-700 min-h-[24px]">
                      {lastMessage?.text || 'No messages yet'}
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Button variant="default" onClick={() => setActiveSection('message')}>
                        Open Messages
                      </Button>
                      <Button variant="outline" onClick={() => setActiveSection('feedback')}>
                        Send Feedback
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Updates */}
               
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <QuickActionCard
                title="Messages"
                description="Chat with support and view conversation"
                icon={MessageSquare}
                color="bg-indigo-50 text-indigo-600"
                onClick={() => setActiveSection('message')}
              />
              <QuickActionCard
                title="Payment Status"
                description="View payment schedules and transaction history"
                icon={CreditCard}
                color="bg-green-50 text-green-600"
                onClick={() => setActiveSection('payments')}
              />
              <QuickActionCard
                title="Projects"
                description="View your projects and their status"
                icon={FolderOpen}
                color="bg-blue-50 text-blue-600"
                onClick={() => setActiveSection('projects')}
              />  
            </div>
          </div>
        )
    }
  }

  return (
    <DashboardLayout
      userRole="client"
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
    >
      {renderContent()}
    </DashboardLayout>
  )
}
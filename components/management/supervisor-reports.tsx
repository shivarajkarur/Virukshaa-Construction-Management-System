"use client"

import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Paperclip, X, FileText, Image as ImageIcon, Eye, Download } from 'lucide-react'
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from '@/components/ui/dialog'

type Project = {
  _id: string
  title: string
}

type Employee = {
  _id: string
  name: string
  role?: string
}

type ReportItem = {
  _id: string
  title: string
  projectId?: string
  siteUpdate?: string
  employeeSummary?: string
  queries?: string
  employees?: string[]
  date?: string
  attachments?: {
    fileName: string
    fileSize: number
    fileType: string
    fileUrl: string
  }[]
}

const SupervisorReports: React.FC = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [reports, setReports] = useState<ReportItem[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    projectId: '',
    siteUpdate: '',
    employeeSummary: '',
    queries: '',
    employees: [] as string[],
    attachments: [] as { fileName: string; fileSize: number; fileType: string; fileUrl: string }[],
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [filePreviews, setFilePreviews] = useState<{ [key: string]: string }>({})
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewFileName, setPreviewFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewTimer, setPreviewTimer] = useState<number | null>(null)

  useEffect(() => {
    // Load projects and employees for selection
    const loadData = async () => {
      try {
        const supervisorId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
        const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null
        const projUrl = supervisorId && role === 'supervisor' ? `/api/projects?supervisorId=${encodeURIComponent(supervisorId)}` : '/api/projects'
        const empUrl = supervisorId && role === 'supervisor' ? `/api/supervisors/${encodeURIComponent(supervisorId)}/employees` : '/api/employees'
        const [pRes, eRes] = await Promise.all([
          fetch(projUrl, { cache: 'no-store' }),
          fetch(empUrl, { cache: 'no-store' }),
        ])
        const [pData, eData] = await Promise.all([pRes.json(), eRes.json()])
        setProjects(Array.isArray(pData) ? pData : [])
        setEmployees(Array.isArray(eData) ? eData : [])
      } catch (err) {
        console.error(err)
        toast.error('Failed to load projects or employees')
      }
    }
    loadData()
  }, [toast])

  // Load my reports
  useEffect(() => {
    const loadReports = async () => {
      try {
        setReportsLoading(true)
        const supervisorId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
        if (!supervisorId) {
          setReports([])
          return
        }
        const res = await fetch(`/api/reports?type=supervisor&supervisorId=${encodeURIComponent(supervisorId)}`, { cache: 'no-store' })
        const data = await res.json()
        setReports(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error(e)
      } finally {
        setReportsLoading(false)
      }
    }
    loadReports()
  }, [])

  const canSubmit = useMemo(() => {
    return form.title.trim().length > 0 && form.projectId !== '' && !loading
  }, [form, loading])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Cache-bust helper to avoid stale cached URLs (esp. CDN/R2)
  const cacheBusted = (url: string) => {
    try {
      const hasQuery = url.includes('?')
      return `${url}${hasQuery ? '&' : '?'}cb=${Date.now()}`
    } catch {
      return url
    }
  }

  // Force-download via server proxy to avoid CORS and ensure attachment disposition
  const handleDownloadPreview = () => {
    if (!previewUrl) return
    const apiUrl = `/api/download?url=${encodeURIComponent(previewUrl)}&name=${encodeURIComponent(previewFileName || 'attachment')}`
    window.location.href = apiUrl
  }

  // Unified open image preview with preloading and timeout fallback
  const openImagePreview = (url: string, name: string) => {
    const finalUrl = cacheBusted(url)
    setPreviewFileName(name)
    setPreviewLoading(true)
    setPreviewUrl(finalUrl)
    setPreviewOpen(true)

    if (typeof window !== 'undefined') {
      const pre = new window.Image()
      pre.onload = () => {
        setPreviewLoading(false)
        if (previewTimer) {
          window.clearTimeout(previewTimer)
          setPreviewTimer(null)
        }
      }
      pre.onerror = () => {
        setPreviewLoading(false)
        if (previewTimer) {
          window.clearTimeout(previewTimer)
          setPreviewTimer(null)
        }
        toast.error('Failed to load image preview')
      }
      pre.src = finalUrl

      // 10s fallback: open in new tab if still loading
      if (previewTimer) {
        window.clearTimeout(previewTimer)
        setPreviewTimer(null)
      }
      const timerId = window.setTimeout(() => {
        if (previewLoading) {
          setPreviewLoading(false)
          window.open(finalUrl, '_blank')
        }
      }, 10000)
      setPreviewTimer(timerId)
    }
  }

  // Clear pending preview timer on unmount
  React.useEffect(() => {
    return () => {
      if (previewTimer) {
        window.clearTimeout(previewTimer)
      }
    }
  }, [previewTimer])

  // Whenever preview finishes loading, ensure timer is cleared
  React.useEffect(() => {
    if (!previewLoading && previewTimer) {
      window.clearTimeout(previewTimer)
      setPreviewTimer(null)
    }
  }, [previewLoading, previewTimer])

  const toggleEmployee = (id: string) => {
    setForm((prev) => {
      const exists = prev.employees.includes(id)
      return { ...prev, employees: exists ? prev.employees.filter(e => e !== id) : [...prev.employees, id] }
    })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4 text-red-500" />
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="h-4 w-4 text-blue-500" />
    if (fileType.includes('sheet') || fileType.includes('excel')) return <FileText className="h-4 w-4 text-green-500" />
    return <FileText className="h-4 w-4" />
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Check file sizes (max 10MB each)
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast.error(`Files must be less than 10MB: ${oversizedFiles.map(f => f.name).join(', ')}`)
      return
    }

    setSelectedFiles(prev => [...prev, ...files])

    // Create previews for images
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFilePreviews(prev => ({
            ...prev,
            [file.name]: e.target?.result as string
          }))
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removeFile = (fileName: string) => {
    setSelectedFiles(prev => prev.filter(f => f.name !== fileName))
    setFilePreviews(prev => {
      const newPreviews = { ...prev }
      delete newPreviews[fileName]
      return newPreviews
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadFiles = async (files: File[]): Promise<{ fileName: string; fileSize: number; fileType: string; fileUrl: string }[]> => {
    const uploadPromises = files.map(async (file) => {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'report')

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Upload failed')
        }
        
        const data = await response.json()
        return {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileUrl: data.fileUrl,
        }
      } catch (error) {
        console.error(`File upload error for ${file.name}:`, error)
        toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        throw error
      }
    })

    return Promise.all(uploadPromises)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    try {
      // Upload files first if any
      let newAttachments: { fileName: string; fileSize: number; fileType: string; fileUrl: string }[] = []
      if (selectedFiles.length > 0) {
        try {
          newAttachments = await uploadFiles(selectedFiles)
          // Optionally update local form state, but do not rely on it for request payload
          setForm(prev => ({
            ...prev,
            attachments: [...prev.attachments, ...newAttachments]
          }))
        } catch (error) {
          toast.error('Failed to upload files. Please try again.')
          setLoading(false)
          return
        }
      }

      const attachmentsToSend = [...form.attachments, ...newAttachments]

      const supervisorId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'supervisor',
          title: form.title,
          projectId: form.projectId || undefined,
          siteUpdate: form.siteUpdate || undefined,
          employeeSummary: form.employeeSummary || undefined,
          queries: form.queries || undefined,
          employees: form.employees,
          supervisorId: supervisorId || undefined,
          date: new Date().toISOString(),
          attachments: attachmentsToSend,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || err?.message || 'Failed to submit report')
      }
      // Reset form
      setForm({
        title: '',
        projectId: '',
        siteUpdate: '',
        employeeSummary: '',
        queries: '',
        employees: [],
        attachments: [],
      })
      setSelectedFiles([])
      setFilePreviews({})
      toast.success('Report submitted successfully')
      // reload reports
      try {
        const sid = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
        if (sid) {
          const r = await fetch(`/api/reports?type=supervisor&supervisorId=${encodeURIComponent(sid)}`, { cache: 'no-store' })
          const d = await r.json()
          setReports(Array.isArray(d) ? d : [])
        }
      } catch {}
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Failed to submit report')
    } finally {
      setLoading(false)
    }
  }

  const loadForEdit = (rep: ReportItem) => {
    setEditingId(rep._id)
    setForm({
      title: rep.title || '',
      projectId: rep.projectId || '',
      siteUpdate: rep.siteUpdate || '',
      employeeSummary: rep.employeeSummary || '',
      queries: rep.queries || '',
      employees: rep.employees || [],
      attachments: rep.attachments || [],
    })
    setSelectedFiles([])
    setFilePreviews({})
  }

  const onUpdate = async () => {
    if (!editingId) return
    setLoading(true)
    try {
      // If new files were selected during edit, upload and merge them
      let uploadedNew: { fileName: string; fileSize: number; fileType: string; fileUrl: string }[] = []
      if (selectedFiles.length > 0) {
        try {
          uploadedNew = await uploadFiles(selectedFiles)
        } catch (e) {
          toast.error('Failed to upload files. Please try again.')
          setLoading(false)
          return
        }
      }
      const attachmentsToUpdate = [...form.attachments, ...uploadedNew]

      const res = await fetch(`/api/reports/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          projectId: form.projectId || undefined,
          siteUpdate: form.siteUpdate || undefined,
          employeeSummary: form.employeeSummary || undefined,
          queries: form.queries || undefined,
          employees: form.employees,
          attachments: attachmentsToUpdate,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || err?.message || 'Failed to update report')
      }
      toast.success('Report updated')
      setEditingId(null)
      setSelectedFiles([])
      setFilePreviews({})
      // refresh list
      const sid = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
      if (sid) {
        const r = await fetch(`/api/reports?type=supervisor&supervisorId=${encodeURIComponent(sid)}`, { cache: 'no-store' })
        const d = await r.json()
        setReports(Array.isArray(d) ? d : [])
      }
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || 'Failed to update report')
    } finally {
      setLoading(false)
    }
  }

  const onDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || err?.message || 'Delete failed')
      }
      setReports((prev) => prev.filter(r => r._id !== id))
      if (editingId === id) {
        setEditingId(null)
        setForm({ title: '', projectId: '', siteUpdate: '', employeeSummary: '', queries: '', employees: [], attachments: [] })
        setSelectedFiles([])
        setFilePreviews({})
      }
      toast.success('Report deleted')
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || 'Failed to delete')
    }
  }

  return (
    <>
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: form */}
      <div className="w-full p-4 md:p-6 bg-white rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Supervisor Daily Report</h2>
        <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-2">
          <Label htmlFor="title">Report Title</Label>
          <Input id="title" name="title" value={form.title} onChange={handleChange} placeholder="e.g., Site A - Daily Update" required />
        </div>

        <div className="grid gap-2">
          <Label>Project</Label>
          <Select value={form.projectId} onValueChange={(val) => setForm((p) => ({ ...p, projectId: val }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="siteUpdate">Site Update</Label>
          <Textarea id="siteUpdate" name="siteUpdate" value={form.siteUpdate} onChange={handleChange} rows={4} placeholder="Work completed, issues faced, materials received, etc." />
        </div>

        

        <div className="grid gap-2">
          <Label htmlFor="employeeSummary">Employee Summary</Label>
          <Textarea id="employeeSummary" name="employeeSummary" value={form.employeeSummary} onChange={handleChange} rows={3} placeholder="Attendance, performance, shifts, safety notes" />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="queries">Queries/Issues</Label>
          <Textarea id="queries" name="queries" value={form.queries} onChange={handleChange} rows={3} placeholder="Any questions or support needed" />
        </div>

        <div className="grid gap-2">
          <Label>Related Employees</Label>
          <div className="max-h-48 overflow-auto rounded border p-2 space-y-1">
            {employees.length === 0 ? (
              <p className="text-sm text-muted-foreground">No employees found</p>
            ) : (
              employees.map((emp) => (
                <label key={emp._id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.employees.includes(emp._id)}
                    onChange={() => toggleEmployee(emp._id)}
                  />
                  <span>{emp.name}{emp.role ? ` - ${emp.role}` : ''}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* File Attachments */}
        <div className="grid gap-2">
          <Label>Attachments</Label>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                multiple
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Paperclip className="h-4 w-4" />
                Add Files
              </Button>
              <span className="text-sm text-muted-foreground">
                Max 10MB per file. Images, PDFs, Documents supported.
              </span>
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected Files:</p>
                <div className="space-y-2 max-h-32 overflow-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex items-center gap-2">
                        {filePreviews[file.name] ? (
                          <img src={filePreviews[file.name]} alt="Preview" className="w-8 h-8 object-cover rounded" />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                            {getFileIcon(file.type)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.name)}
                        className="p-1 h-auto"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Attachments (for edit mode) */}
            {form.attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Current Attachments:</p>
                <div className="space-y-2 max-h-32 overflow-auto">
                  {form.attachments.map((attachment, index) => (
                    <div key={`existing-${index}`} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.open(attachment.fileUrl, '_blank')}>
                        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                          {getFileIcon(attachment.fileType)}
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px]">{attachment.fileName}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</p>
                        </div>
                        <Download className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          {editingId ? (
            <>
              <Button type="button" onClick={onUpdate} disabled={!canSubmit || loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setEditingId(null); setForm({ title: '', projectId: '', siteUpdate: '', employeeSummary: '', queries: '', employees: [], attachments: [] }); setSelectedFiles([]); setFilePreviews({}) }} disabled={loading}>
                Cancel
              </Button>
            </>
          ) : (
            <Button type="submit" disabled={!canSubmit}>
              {loading ? 'Submitting...' : 'Submit Report'}
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={() => { setForm({ title: '', projectId: '', siteUpdate: '', employeeSummary: '', queries: '', employees: [], attachments: [] }); setSelectedFiles([]); setFilePreviews({}) }} disabled={loading}>
            Reset
          </Button>
        </div>
        </form>
      </div>

      {/* Right: my reports list */}
      <div className="w-full p-4 md:p-6 bg-white rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">My Reports</h3>
        {reportsLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reports yet.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r._id} className="p-3 border rounded flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium">{r.title}</p>
                  {r.date && (
                    <p className="text-xs text-muted-foreground">{new Date(r.date).toLocaleString()}</p>
                  )}
                  {r.projectId && (
                    <p className="text-sm underline"><span className="font-medium"></span> {projects.find(p => p._id === r.projectId)?.title || '—'}</p>
                  )}
                  {r.siteUpdate && (
                    <p className="text-sm"><span className="font-bold">Site Update:</span> {r.siteUpdate}</p>
                  )}
                  {r.employeeSummary && (
                    <p className="text-sm"><span className="font-bold">Employee Summary:</span> {r.employeeSummary}</p>
                  )}
                  {r.queries && (
                    <p className="text-sm"><span className="font-bold">Queries:</span> {r.queries}</p>
                  )}
                  {Array.isArray(r.employees) && r.employees.length > 0 && (
                    <p className="text-sm"><span className="font-bold">Employees:</span> {employees.filter(e => r.employees?.includes(e._id)).map(e => e.name).join(', ')}</p>
                  )}
                  {Array.isArray(r.attachments) && r.attachments.length > 0 && (
                    <div className="text-sm">
                      <span className="font-bold">Attachments:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {r.attachments.map((attachment, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs cursor-pointer hover:bg-gray-200"
                            onClick={() => {
                              if (attachment.fileType.startsWith('image/')) {
                                openImagePreview(attachment.fileUrl, attachment.fileName)
                              } else {
                                window.open(attachment.fileUrl, '_blank')
                              }
                            }}
                          >
                            {getFileIcon(attachment.fileType)}
                            <span className="truncate max-w-[100px]">{attachment.fileName}</span>
                            <Eye className="h-3 w-3" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => loadForEdit(r)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => onDelete(r._id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
      {/* Image Preview Modal (unified with report-management) */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[800px] h-auto absolute" aria-describedby="preview-description">
          <DialogTitle className="text-lg font-semibold mb-2 pr-8 truncate">{previewFileName}</DialogTitle>
          <DialogDescription id="preview-description" className="sr-only">Preview of {previewFileName}</DialogDescription>
          {/* Download button */}
          {previewUrl && (
            <button
              type="button"
              onClick={handleDownloadPreview}
              className="absolute right-12 top-3 p-2 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <div className="relative w-full h-full flex items-center justify-center mt-6">
            {previewLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-[80vh] object-contain"
                onLoad={() => setPreviewLoading(false)}
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg'
                  setPreviewLoading(false)
                  toast.error('Failed to load image preview')
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
   )
}

export default SupervisorReports
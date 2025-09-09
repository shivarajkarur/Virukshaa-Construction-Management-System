'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Search, FileText, Trash2, Edit, X, Save, Loader2, Image, Eye, Download } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface Report {
  _id: string;
  title: string;
  type: 'supervisor' | 'employee' | 'supplier';
  content?: string;
  date: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
  // optional relational fields that some reports may include
  supervisorId?: string;
  projectId?: string;
  siteUpdate?: string;
  employeeSummary?: string;
  queries?: string;
  employees?: string[];
  attachments?: {
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl: string;
  }[];
  // Debug function to validate report structure
  validate?: () => boolean;
}

// Minimal view model for material requests (supplier tab)
interface MaterialRequestVM {
  _id: string;
  material: string;
  materialName: string;
  quantity: number;
  unit: string;
  status: string;
  requestDate: string;
  requiredDate: string;
  notes?: string;
  requestedBy: string;
  supervisor?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Supervisor {
  _id: string;
  name: string;
}

interface ProjectMini {
  _id: string;
  title: string;
}

const API_BASE_URL = '/api/reports';

const ReportManagement = () => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'supervisor' | 'supplier' | null>('supervisor');
  const [reports, setReports] = useState<Report[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequestVM[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [projects, setProjects] = useState<ProjectMini[]>([]);
  const [employees, setEmployees] = useState<{_id: string, name: string}[]>([]);
  const [counts, setCounts] = useState<{ supervisor: number; supplier: number }>({ supervisor: 0, supplier: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [reportDeleteOpen, setReportDeleteOpen] = useState(false);
  const [reportDeleteTargetId, setReportDeleteTargetId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewTimer, setPreviewTimer] = useState<number | null>(null);

  // Helper to render appropriate file icon (ported from supervisor-reports)
  const getFileIcon = (fileType: string) => {
    if (!fileType) return <FileText className="h-4 w-4" />;
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4 text-red-500" />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (fileType.includes('sheet') || fileType.includes('excel')) return <FileText className="h-4 w-4 text-green-500" />;
    return <FileText className="h-4 w-4" />;
  };

  // Force-download via server proxy to avoid CORS and ensure attachment disposition
  const handleDownloadPreview = () => {
    if (!previewUrl) return;
    const apiUrl = `/api/download?url=${encodeURIComponent(previewUrl)}&name=${encodeURIComponent(previewFileName || 'attachment')}`;
    window.location.href = apiUrl;
  };

  // Cache-bust helper to avoid stale cached URLs (esp. with R2 presigned or CDN)
  const cacheBusted = (url: string) => {
    try {
      const hasQuery = url.includes('?');
      return `${url}${hasQuery ? '&' : '?'}cb=${Date.now()}`;
    } catch {
      return url;
    }
  };

  // Open image preview with preloading to reduce perceived delay
  const openImagePreview = (url: string, name: string) => {
    const finalUrl = cacheBusted(url);
    setPreviewFileName(name);
    setPreviewLoading(true);
    setPreviewUrl(finalUrl);
    setPreviewOpen(true);

    // Preload image; when loaded, stop the spinner
    if (typeof window !== 'undefined') {
      const pre = new window.Image();
      pre.onload = () => setPreviewLoading(false);
      pre.onerror = () => {
        setPreviewLoading(false);
        toast.error('Failed to load image preview');
      };
      pre.src = finalUrl;

      // Fallback: if it takes too long, open in new tab
      if (previewTimer) {
        window.clearTimeout(previewTimer);
        setPreviewTimer(null);
      }
      const timerId = window.setTimeout(() => {
        if (previewLoading) {
          setPreviewLoading(false);
          window.open(finalUrl, '_blank');
        }
      }, 10000); // 10s timeout
      setPreviewTimer(timerId);
    }
  };

  // Clear pending preview timer when dialog closes or component unmounts
  useEffect(() => {
    return () => {
      if (previewTimer) {
        window.clearTimeout(previewTimer);
      }
    };
  }, [previewTimer]);

  // Fetch reports from the API
  const fetchReports = useCallback(async () => {
    if (!activeTab) return;

    setIsLoading(true);
    setError(null);

    try {
      if (activeTab === 'supplier') {
        // Load material requests for supplier tab
        const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
        const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
        const url = (userId && role === 'supervisor')
          ? `/api/material-requests?supervisorId=${encodeURIComponent(userId)}`
          : '/api/material-requests';
        const resp = await fetch(url, { cache: 'no-store' });
        if (!resp.ok) throw new Error('Failed to fetch material requests');
        const data: MaterialRequestVM[] = await resp.json();
        setMaterialRequests(data);
      } else {
        const params = new URLSearchParams();
        params.append('type', activeTab);
        if (searchTerm) params.append('search', searchTerm);
        // Add role parameter to ensure admin access
        const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
        if (role) params.append('role', role);
        const response = await fetch(`${API_BASE_URL}?${params.toString()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch reports');
        const data = await response.json();
        console.log('Fetched reports:', data); // Debug log to check report data
        setReports(data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchTerm]);

  // Fetch counts for all types (independent of active tab and search)
  const refreshCounts = useCallback(async () => {
    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
      const supplierUrl = (userId && role === 'supervisor')
        ? `/api/material-requests?supervisorId=${encodeURIComponent(userId)}`
        : '/api/material-requests';

      const [reportsRes, supplierRes] = await Promise.all([
        fetch(`${API_BASE_URL}`, { cache: 'no-store' }),
        fetch(supplierUrl, { cache: 'no-store' })
      ]);
      if (!reportsRes.ok) throw new Error('Failed to fetch reports for counts');
      const reportsData: Report[] = await reportsRes.json();
      const next = { supervisor: 0, supplier: 0 } as { supervisor: number; supplier: number };
      for (const r of reportsData) {
        if (r.type === 'supervisor') next.supervisor++;
      }
      if (supplierRes.ok) {
        const supplierData: any[] = await supplierRes.json();
        next.supplier = Array.isArray(supplierData) ? supplierData.length : 0;
      }
      setCounts(next);
    } catch (e) {
      console.error('Failed to refresh report counts', e);
    }
  }, []);

  // Load reports when tab or search term changes
  useEffect(() => {
    if (activeTab) {
      fetchReports();
    }
  }, [activeTab, fetchReports]);

  // Load counts on mount
  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  // Load supervisors and employees for name resolution
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const [supervisorsRes, employeesRes] = await Promise.all([
          fetch('/api/supervisors', { cache: 'no-store' }),
          fetch('/api/employees', { cache: 'no-store' })
        ]);
        
        if (supervisorsRes.ok) {
          const supervisorsData = await supervisorsRes.json();
          setSupervisors(Array.isArray(supervisorsData) ? supervisorsData.map((s: any) => ({ _id: s._id, name: s.name })) : []);
        }

        if (employeesRes.ok) {
          const employeesData = await employeesRes.json();
          setEmployees(Array.isArray(employeesData) ? employeesData.map((e: any) => ({ _id: e._id, name: e.name })) : []);
        }
      } catch (e) {
        console.error('Failed to load users', e);
      }
    };
    loadUsers();
  }, []);

  // Load projects for title resolution
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetch('/api/projects', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setProjects(Array.isArray(data) ? data.map((p: any) => ({ _id: p._id, title: p.title })) : []);
      } catch (e) {
        console.error('Failed to load projects', e);
      }
    };
    loadProjects();
  }, []);

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === '' ||
      report.title.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      (report.content ? report.content.toLowerCase() : '').includes(searchTerm.trim().toLowerCase());

    return (activeTab ? report.type === activeTab : true) && matchesSearch;
  });

  const filteredMaterialRequests = materialRequests.filter((req) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      req.materialName.toLowerCase().includes(term) ||
      req.material.toLowerCase().includes(term) ||
      req.status.toLowerCase().includes(term) ||
      (req.notes ? req.notes.toLowerCase() : '').includes(term)
    );
  });

  const handleEdit = (report: Report) => {
    setEditingReport(report);
    setEditedContent(report.content || '');
  };

  const handleSave = async () => {
    if (!editingReport) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/${editingReport._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editedContent,
          updatedBy: session?.user?.name || 'Unknown',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update report');
      }

      // Refresh the reports after successful update
      await fetchReports();
      // Refresh counts as well
      refreshCounts();
      setEditingReport(null);
    } catch (err) {
      console.error('Error updating report:', err);
      setError('Failed to update report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a supplier material request (component scope)
  const handleDeleteMaterialRequest = async (id: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const resp = await fetch(`/api/material-requests?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!resp.ok) throw new Error('Failed to delete material request');

      await fetchReports();
      refreshCounts();
      toast.success('Material request deleted');
    } catch (err) {
      console.error('Error deleting material request:', err);
      setError('Failed to delete material request. Please try again.');
      toast.error('Failed to delete material request');
    } finally {
      setDeleteOpen(false);
      setDeleteTargetId(null);
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      // Refresh after successful deletion
      await fetchReports();
      refreshCounts();
      toast.success('Report deleted');
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('Failed to delete report. Please try again.');
      toast.error('Failed to delete report');
    } finally {
      setReportDeleteOpen(false);
      setReportDeleteTargetId(null);
      setIsSubmitting(false);
    }
  };

  const renderReportType = (type: string) => {
    switch (type) {
      case 'supervisor':
        return 'Supervisor Report';
      case 'supplier':
        return 'Supply Requests from Supervisor (Material Request)';
      default:
        return 'Report';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">Report Management</h2>
        <p className="text-muted-foreground">View and manage all reports</p>
      </div>

      {/* Report Type Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {['supervisor', 'supplier'].map((type) => {
          const count = counts[type as keyof typeof counts];
          const isActive = activeTab === type;

          return (
            <Card
              key={type}
              className={`cursor-pointer transition-colors ${isActive ? 'border-primary bg-primary/50 text-white' : 'hover:bg-muted/50'
                }`}
              onClick={() => setActiveTab(type as any)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {type === 'supplier'
                    ? 'Supply Requests from Supervisor (Material Request)'
                    : `${type.charAt(0).toUpperCase() + type.slice(1)} Reports`}
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading && isActive ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                  ) : (
                    count
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {count === 1 ? 'Report' : 'Reports'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* Reports List */}
      {activeTab && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">{renderReportType(activeTab)}</h3>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={activeTab === 'supplier' ? 'Search material requests...' : 'Search reports...'}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activeTab === 'supplier' ? (
            filteredMaterialRequests.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">No material requests found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchTerm ? 'Try a different search term' : 'No material requests available'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredMaterialRequests.map((req) => (
                  <Card key={req._id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">
                            {req.materialName} ({req.unit}) • Qty: {req.quantity}
                            {req.projectId && (
                              <> {' '}• Project: {projects.find(p => p._id === req.projectId)?.title || req.projectId}</>
                            )}
                          </h4>
                          {/* <p className="text-sm text-muted-foreground">
                            Requested: {new Date(req.requestDate).toLocaleDateString()} • Required: {new Date(req.requiredDate).toLocaleDateString()}
                            <span className="ml-2">• Status: {req.status}</span>
                          </p> */}
                          {/* <p className="text-xs text-muted-foreground">
                            {req.supervisor
                              ? `Supervisor: ${supervisors.find(s => s._id === req.supervisor)?.name || req.supervisor}`
                              : (req.requestedBy ? `Requested by: ${req.requestedBy}` : '')}
                          </p> */}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => { setDeleteTargetId(req._id); setDeleteOpen(true); }}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mt-1 md:flex md:items-start md:justify-between md:gap-6">
                        <div className="md:w-6/12 w-full">
                          <div className="grid grid-cols-3 gap-y-1 gap-x-2 text-sm">
                            <div className="col-span-1 text-muted-foreground">Material</div>
                            <div className="col-span-2 font-medium">{req.materialName}</div>

                            <div className="col-span-1 text-muted-foreground">Unit</div>
                            <div className="col-span-2">{req.unit}</div>

                            <div className="col-span-1 text-muted-foreground">Quantity</div>
                            <div className="col-span-2">{req.quantity}</div>

                            {req.projectId && (
                              <>
                                <div className="col-span-1 text-muted-foreground">Project</div>
                                <div className="col-span-2">{projects.find(p => p._id === req.projectId)?.title || req.projectId}</div>
                              </>
                            )}

                            {/* <div className="col-span-1 text-muted-foreground">Requested</div>
                            <div className="col-span-2">{new Date(req.requestDate).toLocaleDateString()}</div> */}

                            <div className="col-span-1 text-muted-foreground">Required</div>
                            <div className="col-span-2">{new Date(req.requiredDate).toLocaleDateString()}</div>

                            <div className="col-span-1 text-muted-foreground">Status</div>
                            <div className="col-span-2 capitalize">{req.status}</div>

                            {req.supervisor && (
                              <>
                                <div className="col-span-1 text-muted-foreground">Supervisor</div>
                                <div className="col-span-2">{supervisors.find(s => s._id === req.supervisor)?.name || req.supervisor}</div>
                              </>
                            )}
                            {!req.supervisor && req.requestedBy && (
                              <>
                                <div className="col-span-1 text-muted-foreground">Requested by</div>
                                <div className="col-span-2">{req.requestedBy}</div>
                              </>
                            )}
                          </div>
                        </div>
                        {req.notes && (
                          <div className="md:w-6/12 w-full mt-3 md:mt-0">
                            Notes:
                            <div className="rounded-md border bg-muted/30 p-3">
                              <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-6">{req.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : reports.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">No reports found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm ? 'Try a different search term' : 'No reports available for this category'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredReports.map((report) => (
                <Card key={report._id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">
                          {((report as any).supervisorId && (supervisors.find(s => s._id === (report as any).supervisorId)?.name))
                            || report.createdBy }
                          {(report as any).projectId && (
                            <>
                              {' '}• Project: {projects.find(p => p._id === (report as any).projectId)?.title || (report as any).projectId}
                            </>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(report.date).toLocaleDateString()} • {report.createdBy}
                          {report.updatedAt && (
                            <span className="text-xs text-muted-foreground/70">
                              {' '}• Updated {new Date(report.updatedAt).toLocaleString()}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(report)}
                          disabled={isSubmitting}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => { setReportDeleteTargetId(report._id); setReportDeleteOpen(true); }}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingReport?._id === report._id ? (
                      <div className="space-y-4">
                        <textarea
                          className="w-full min-h-[100px] p-2 border rounded"
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          disabled={isSubmitting}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setEditingReport(null)}
                            disabled={isSubmitting}
                          >
                            <X className="h-4 w-4 mr-2" /> Cancel
                          </Button>
                          <Button
                            onClick={handleSave}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 md:flex md:items-start md:justify-between md:gap-6">
                        <div className="md:w-5/12 w-full space-y-2">
                          <div className="grid grid-cols-3 gap-y-1 gap-x-2 text-sm">
                            <div className="col-span-1 text-muted-foreground">Report Title</div>
                            <div className="col-span-2 font-medium">{report.title}</div>
                            {(report as any).siteUpdate && (
                              <>
                                <div className="col-span-1 text-muted-foreground">Site Update</div>
                                <div className="col-span-2">{(report as any).siteUpdate}</div>
                              </>
                            )}
                            {(report as any).employeeSummary && (
                              <>
                                <div className="col-span-1 text-muted-foreground">Employee Summary</div>
                                <div className="col-span-2">{(report as any).employeeSummary}</div>
                              </>
                            )}
                            {(report as any).queries && (
                              <>
                                <div className="col-span-1 text-muted-foreground">Queries</div>
                                <div className="col-span-2">{(report as any).queries}</div>
                              </>
                            )}
                            {Array.isArray((report as any).employees) && (report as any).employees.length > 0 && (
                              <>
                                <div className="col-span-1 text-muted-foreground">Employees</div>
                                <div className="col-span-2">
                                  {(report as any).employees.map((empId: string) => 
                                    employees.find(e => e._id === empId)?.name || empId
                                  ).join(', ')}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="md:w-7/12 w-full mt-3 md:mt-0">
                          {(report.content || '').length > 0 && (
                            <div className="rounded-md border bg-muted/30 p-3">
                              <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-5">
                                {report.content}
                              </p>
                            </div>
                          )}
                          {Array.isArray(report.attachments) && report.attachments.length > 0 && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium mb-2">Attachments:</h5>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {report.attachments.map((attachment, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs cursor-pointer hover:bg-gray-200"
                                    onClick={() => {
                                      if (attachment.fileType.startsWith('image/')) {
                                        // Preload and open image preview with cache-busting
                                        openImagePreview(attachment.fileUrl, attachment.fileName);
                                      } else {
                                        // Direct open/download for non-image files
                                        window.open(attachment.fileUrl, '_blank');
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
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Delete Confirmation Dialog for Material Requests */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete material request</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the selected material request.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { if (!isSubmitting) { setDeleteOpen(false); setDeleteTargetId(null); } }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => { if (deleteTargetId) handleDeleteMaterialRequest(deleteTargetId); }}
              disabled={!deleteTargetId || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog for Reports */}
      <Dialog open={reportDeleteOpen} onOpenChange={setReportDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete report</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the selected report.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { if (!isSubmitting) { setReportDeleteOpen(false); setReportDeleteTargetId(null); } }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => { if (reportDeleteTargetId) handleDelete(reportDeleteTargetId); }}
              disabled={!reportDeleteTargetId || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
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
                  e.currentTarget.src = '/placeholder.svg';
                  setPreviewLoading(false);
                  toast.error('Failed to load image preview');
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportManagement;

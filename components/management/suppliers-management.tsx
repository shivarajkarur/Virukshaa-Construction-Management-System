"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Phone, Mail, MapPin, Search, Filter, CreditCard, Grid3X3, List, RefreshCw, Building2, CheckCircle, XCircle, Package, UserCheck, Calendar, IndianRupee, Edit3, Eye, MessageCircle, Pencil } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface ProjectMaterial {
  _id?: string;
  projectId: string;
  materialType: string;
  quantity: number;
  amount: number;
}

interface BankDetail {
  accountNumber?: string
  accountHolderName?: string
  bankName?: string
  branch?: string
  ifscCode?: string
  upiId?: string
  accountType?: 'Savings' | 'Current' | 'Other'
  isPrimary?: boolean
}

interface Supplier {
  _id: string
  companyName: string
  contactPerson: string
  email: string
  phone: string
  materialTypes: string[]
  supplyStartDate?: string
  address: string
  avatar?: string
  assignedProjects?: string[]
  bankDetails?: BankDetail[]
  projectMaterials?: ProjectMaterial[]
  createdAt: string
  updatedAt: string
  totalPaid?: number
  dueAmount?: number
  lastPaymentDate?: string
}

interface Transaction {
  id: string
  date: string
  type: "Order" | "Payment" | "Delivery"
  amount: number
  status: "Pending" | "Completed" | "Cancelled"
  reference: string
  description?: string
}

interface ProjectMaterialLocal {
  _id?: string;
  projectId: string;
  materialType: string;
  quantity: number;
  amount: number;
  date?: string; // Add this line
}

const initialFormData = {
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  materialTypes: [] as string[],
  supplyStartDate: undefined as Date | undefined,
  address: "",
  avatar: "",
  status: 'Active' as 'Active' | 'Inactive',
  bankDetails: [] as Array<{
    accountNumber?: string;
    accountHolderName?: string;
    bankName?: string;
    branch?: string;
    ifscCode?: string;
    upiId?: string;
    accountType?: 'Savings' | 'Current' | 'Other';
    isPrimary?: boolean;
  }>,
}

const SuppliersManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [projectMaterialInputs, setProjectMaterialInputs] = useState<Record<string, ProjectMaterialLocal>>({});
  const [projectMaterials, setProjectMaterials] = useState<Record<string, ProjectMaterialLocal[]>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [materialOptions, setMaterialOptions] = useState([
    { value: "Cement", label: "Cement" },
    { value: "Sand", label: "Sand" },
    { value: "Gravel / Aggregate", label: "Gravel / Aggregate" },
    { value: "Bricks", label: "Bricks" },
    { value: "Steel Rods / TMT Bars", label: "Steel Rods / TMT Bars" },
    { value: "Concrete Mix", label: "Concrete Mix" },
    { value: "Wood / Timber", label: "Wood / Timber" },
    { value: "Paint", label: "Paint" },
  ]);

  const [materialInputValue, setMaterialInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingBankDetails, setEditingBankDetails] = useState<BankDetail[]>([]);
  const [isBankDetailsOpen, setIsBankDetailsOpen] = useState(false);
  const [currentBankDetail, setCurrentBankDetail] = useState<BankDetail | null>(null);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [selectedProjectForMaterial, setSelectedProjectForMaterial] = useState<string>("");

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier: Supplier) => {
      const matchesSearch = !searchTerm ||
        supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone.includes(searchTerm);
      return matchesSearch;
    });
  }, [suppliers, searchTerm]);

  useEffect(() => {
    fetchSuppliers()
  }, [])

  // Removed redundant auto-fetch of materials on selectedSupplier change to avoid duplicate requests.
  // Materials are fetched within fetchSupplierTransactions when opening the detail view.

  const fetchSupplierMaterials = async (supplierId: string) => {
    try {
      const response = await fetch(`/api/suppliers/${supplierId}/materials`)
      if (!response.ok) throw new Error('Failed to fetch supplier materials')
      const data = await response.json()
      
      const materialsObj: Record<string, ProjectMaterialLocal[]> = {}
      data.forEach((material: ProjectMaterialLocal) => {
        if (!materialsObj[material.projectId]) {
          materialsObj[material.projectId] = []
        }
        materialsObj[material.projectId].push(material)
      })
      // Also ensure assigned projects render even if no materials
      try {
        const supRes = await fetch(`/api/suppliers/${supplierId}`)
        if (supRes.ok) {
          const sup = await supRes.json()
          if (Array.isArray(sup.assignedProjects)) {
            for (const pid of sup.assignedProjects) {
              if (!materialsObj[pid]) materialsObj[pid] = []
            }
          }
        }
      } catch {}

      setProjectMaterials(materialsObj)
    } catch (error) {
      console.error('Error fetching supplier materials:', error)
      toast.error('Failed to load supplier materials')
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/suppliers", { cache: "no-store" })
      if (!response.ok) throw new Error("Failed to fetch suppliers")
      const data = await response.json()
      // Keep supplier.projectMaterials as an ARRAY from the backend to avoid type mismatches.
      // The grouped-by-project view is handled by `projectMaterials` state when a supplier is selected.
      setSuppliers(data)
    } catch (error) {
      console.error("Error fetching suppliers:", error)
      toast.error("Failed to load suppliers. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleMaterialSelect = (material: string) => {
    setFormData((prev) => {
      const newMaterials = prev.materialTypes.includes(material)
        ? prev.materialTypes.filter((m) => m !== material)
        : [...prev.materialTypes, material]
      return { ...prev, materialTypes: newMaterials }
    })
  }

  const handleMaterialCreate = () => {
    if (materialInputValue && !materialOptions.some((option) => option.value === materialInputValue)) {
      const newOption = { value: materialInputValue, label: materialInputValue }
      setMaterialOptions([...materialOptions, newOption])
      setFormData((prev) => ({
        ...prev,
        materialTypes: [...prev.materialTypes, newOption.value],
      }))
      setMaterialInputValue("")
    }
  }

  // Remove a selected material from the form selection
  const removeMaterial = (material: string, e?: React.MouseEvent) => {
    // Prevent bubbling to popover trigger or parent handlers
    if (e) e.stopPropagation()
    setFormData((prev) => ({
      ...prev,
      materialTypes: prev.materialTypes.filter((m) => m !== material),
    }))
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setEditingSupplier(null)
    setProjectMaterials({})
    setSelectedProjectForMaterial("")
    setProjectMaterialInputs({})
  }

  const openEditDialog = (supplier: Supplier) => {
    setFormData({
      companyName: supplier.companyName,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      materialTypes: [...supplier.materialTypes],
      supplyStartDate: supplier.supplyStartDate ? new Date(supplier.supplyStartDate) : undefined,
      address: supplier.address,
      avatar: supplier.avatar || "",
      status: 'Active',
      bankDetails: supplier.bankDetails ? [...supplier.bankDetails] : [],
    })
    setEditingSupplier(supplier)
    setIsAddDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Client-side validation
    if (!formData.companyName?.trim()) {
      toast.error("Company name is required")
      setLoading(false)
      return
    }
    if (!formData.contactPerson?.trim()) {
      toast.error("Contact person is required")
      setLoading(false)
      return
    }
    if (!formData.email?.trim()) {
      toast.error("Email is required")
      setLoading(false)
      return
    }
    if (!formData.phone?.trim()) {
      toast.error("Phone number is required")
      setLoading(false)
      return
    }
    if (!formData.address?.trim()) {
      toast.error("Address is required")
      setLoading(false)
      return
    }
    if (!formData.materialTypes?.length) {
      toast.error("Please add at least one material type")
      setLoading(false)
      return
    }

    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier._id}` : '/api/suppliers'
      const method = editingSupplier ? 'PUT' : 'POST'

      // Prepare the request body
      const requestBody = {
        companyName: formData.companyName.trim(),
        contactPerson: formData.contactPerson.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        materialTypes: formData.materialTypes,
        // Optional fields
        ...(formData.supplyStartDate && { supplyStartDate: formData.supplyStartDate }),
        ...(formData.avatar && { avatar: formData.avatar }),
        ...(formData.bankDetails?.length && { bankDetails: formData.bankDetails }),
      }
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const responseData = await response.json()

      if (!response.ok) {
        // console.error('Server response:', responseData)
        throw new Error(responseData.error || 'Failed to save supplier')
      }

      const savedSupplier = responseData
      toast.success(`Supplier ${editingSupplier ? "updated" : "created"} successfully`)

      // Update the suppliers list
      if (editingSupplier) {
        setSuppliers(suppliers.map(s => s._id === savedSupplier._id ? savedSupplier : s))
      } else {
        setSuppliers([savedSupplier, ...suppliers])
      }

      // Close the dialog and reset the form
      setIsAddDialogOpen(false)
      setEditingSupplier(null)
      resetForm()
    } catch (error: any) {
      toast.error(error.message || "Failed to save supplier. Please check the console for details.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/suppliers/${id}`, { method: "DELETE" })
      if (response.ok) {
        setSuppliers(suppliers.filter((s) => s._id !== id))
        toast.success("Supplier has been removed successfully.")
      } else {
        throw new Error("Failed to delete supplier")
      }
    } catch (error) {
      toast.error("Failed to delete supplier. Please try again.")
    }
  }

  const handleSupplierClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsDetailSheetOpen(true)
    fetchSupplierTransactions(supplier._id)
  }

  const fetchProjects = async () => {
    setIsLoadingProjects(true)
    try {
      const response = await fetch("/api/projects")
      if (!response.ok) throw new Error("Failed to fetch projects")
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error("Error fetching projects:", error)
      toast.error("Failed to load projects")
    } finally {
      setIsLoadingProjects(false)
    }
  }

  const handleProjectSelect = async (projectId: string) => {
    setSelectedProjectForMaterial(projectId);
    if (!selectedSupplier?._id) return
    try {
      // Persist assignment
      await fetch(`/api/suppliers/${selectedSupplier._id}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })
      // Ensure empty bucket exists so it renders immediately
      if (!projectMaterials[projectId]) {
        setProjectMaterials((prev) => ({
          ...prev,
          [projectId]: [],
        }));
      }
      // Update selected supplier local state
      setSelectedSupplier(prev => prev ? ({
        ...prev,
        assignedProjects: Array.from(new Set([...(prev.assignedProjects || []), projectId]))
      }) : prev)
    } catch (e) {
      console.error('Failed to assign project', e)
      toast.error('Failed to assign site to supplier')
    }
    // Initialize input state for this project if it doesn't exist
    if (!projectMaterialInputs[projectId]) {
      setProjectMaterialInputs(prev => ({
        ...prev,
        [projectId]: {
          materialType: "",
          quantity: 1,
          amount: 0,
          date: new Date().toISOString(),
          projectId,
        }
      }));
    }
  }

  // Update project material input
  const updateProjectMaterialInput = (projectId: string, field: string, value: string | number) => {
    setProjectMaterialInputs(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        [field]: field === 'materialType' ? value : Number(value)
      }
    }));
  }
  const addMaterialToProject = async (projectId: string) => {
    const currentInput = projectMaterialInputs[projectId] || {};
    const { materialType, quantity, amount } = currentInput as {
      materialType?: string;
      quantity?: number;
      amount?: number;
    };

    // Validate input values
    if (!materialType || quantity == null || amount == null || Number(quantity) <= 0 || Number(amount) < 0) {
      toast.error("Please fill all fields with valid values");
      return;
    }

    if (!selectedSupplier?._id) {
      toast.error("No supplier selected");
      return;
    }

    // Generate a unique ID for the new material entry
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Create the new material entry with all required fields
    const newMaterial = {
      _id: tempId,
      projectId,
      materialType,
      quantity: Number(quantity),
      amount: Number(amount),
      date: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    // Prepare the material data for the server (without temporary fields)
    const { _id, ...materialForServer } = newMaterial;

    setIsSaving(true);
    try {
      // 1. Update local project materials state
      setProjectMaterials(prev => ({
        ...prev,
        [projectId]: [...(prev[projectId] || []), newMaterial]
      }));

      // 2. Update supplier's materials in local state
      if (selectedSupplier) {
        setSelectedSupplier(prevSupplier => {
          if (!prevSupplier) return null;
          const currentMaterials = Array.isArray(prevSupplier.projectMaterials)
            ? prevSupplier.projectMaterials
            : [];
          return {
            ...prevSupplier,
            projectMaterials: [
              ...currentMaterials,
              {
                _id: tempId,
                projectId,
                materialType,
                quantity: Number(quantity),
                amount: Number(amount),
                date: timestamp,
                createdAt: timestamp,
                updatedAt: timestamp
              }
            ]
          };
        });
      }

      // 3. Send new material to server
      const response = await fetch(`/api/suppliers/${selectedSupplier._id}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materialForServer)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save material');
      }

      const result = await response.json();

      // 4. Update local state with server-generated ID
      setProjectMaterials(prev => ({
        ...prev,
        [projectId]: (prev[projectId] || []).map(m =>
          m._id === tempId ? { ...m, _id: result._id } : m
        )
      }));

      // 5. Update selected supplier's materials with server ID
      if (selectedSupplier) {
        setSelectedSupplier(prevSupplier => {
          if (!prevSupplier) return null;
          const currentMaterials = Array.isArray(prevSupplier.projectMaterials)
            ? [...prevSupplier.projectMaterials]
            : [];

          // Find and update the material with the server-generated ID
          const materialIndex = currentMaterials.findIndex(m => m._id === tempId);
          if (materialIndex !== -1) {
            currentMaterials[materialIndex] = {
              ...currentMaterials[materialIndex],
              _id: result._id
            };
          }

          return {
            ...prevSupplier,
            projectMaterials: currentMaterials
          };
        });
      }

      // 6. Reset the input form
      setProjectMaterialInputs(prev => ({
        ...prev,
        [projectId]: {
          materialType: "",
          quantity: 1,
          amount: 0,
          projectId: "",
          date: ""
        }
      }));

      toast.success(`Added new ${materialType} entry (Qty: ${quantity}, Amount: ₹${amount})`);
    } catch (error) {
      console.error('Error adding material:', error);
      toast.error(`Failed to add material: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Rollback material from project
      setProjectMaterials(prev => ({
        ...prev,
        [projectId]: (prev[projectId] || []).filter(m => m._id !== newMaterial._id)
      }));

      // Rollback material from supplier
      if (selectedSupplier) {
        setSelectedSupplier({
          ...selectedSupplier,
          projectMaterials: (selectedSupplier.projectMaterials || []).filter(m => m._id !== newMaterial._id)
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const removeMaterialFromProject = async (projectId: string, materialType: string) => {
    if (!selectedSupplier?._id) {
      toast.error("No supplier selected");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/suppliers/${selectedSupplier._id}/materials`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          materialType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove material');
      }

      // Update local state immediately
      setProjectMaterials(prev => ({
        ...prev,
        [projectId]: (prev[projectId] || []).filter(m => m.materialType !== materialType)
      }));

      // Update the selected supplier's project materials
      if (selectedSupplier) {
        const updatedProjectMaterials = (selectedSupplier.projectMaterials || []).filter(pm =>
          !(pm.projectId === projectId && pm.materialType === materialType)
        );

        setSelectedSupplier({
          ...selectedSupplier,
          projectMaterials: updatedProjectMaterials
        });
      }

      toast.success(`Removed ${materialType} from project`);
    } catch (error) {
      console.error('Error removing material:', error);
      toast.error(`Failed to remove material: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  }

  const removeProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedSupplier?._id) {
      toast.error("No supplier selected");
      return;
    }

    setIsSaving(true);
    try {
      // Get all materials for this project to remove them
      const projectMaterialsToRemove = projectMaterials[projectId] || [];

      // Remove each material for this project
      await Promise.all(
        projectMaterialsToRemove.map(material =>
          fetch(`/api/suppliers/${selectedSupplier._id}/materials`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              materialType: material.materialType
            })
          })
        )
      );

      // Unassign project itself
      await fetch(`/api/suppliers/${selectedSupplier._id}/projects`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })

      // Update local state to remove the project and its materials
      setProjectMaterials(prev => {
        const updated = { ...prev };
        delete updated[projectId];
        return updated;
      });

      // Update the projectMaterials in the selectedSupplier state
      if (selectedSupplier) {
        // Ensure projectMaterials remains an array; filter out any materials that belong to this project
        const updatedProjectMaterialsArray = Array.isArray(selectedSupplier.projectMaterials)
          ? selectedSupplier.projectMaterials.filter(pm => pm.projectId !== projectId)
          : [];

        setSelectedSupplier({
          ...selectedSupplier,
          projectMaterials: updatedProjectMaterialsArray,
          assignedProjects: (selectedSupplier.assignedProjects || []).filter(p => p !== projectId)
        });
      }

      toast.success("Removed project assignment and all associated materials");
    } catch (error) {
      console.error('Error removing project:', error);
      toast.error(`Failed to remove project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  }

  const fetchSupplierTransactions = async (supplierId: string) => {
    setIsLoadingTransactions(true);
    try {
      // Fetch projects and materials in parallel for faster load.
      // Only fetch projects if not already loaded.
      const projectsPromise = projects.length === 0 ? fetchProjects() : Promise.resolve();

      // Reset project materials for this supplier
      setProjectMaterials({});
      setProjectMaterialInputs({});

      // Start materials fetch
      const materialsFetch = fetch(`/api/suppliers/${supplierId}/materials`);

      // Await both
      const [_, materialsResponse] = await Promise.all([projectsPromise, materialsFetch]);
      if (materialsResponse.ok) {
        const materialsData = await materialsResponse.json();
        // console.log("Fetched materials data:", materialsData);

        // Group materials by projectId and keep _id and date for stable keys and display
        const groupedMaterials = materialsData.reduce((acc: any, material: any) => {
          if (!acc[material.projectId]) {
            acc[material.projectId] = [];
          }
          acc[material.projectId].push({
            _id: material._id,
            projectId: material.projectId,
            materialType: material.materialType,
            quantity: Number(material.quantity) || 0,
            amount: Number(material.amount) || 0,
            date: material.date
          });
          return acc;
        }, {});

        setProjectMaterials(groupedMaterials);

        // Initialize input states for existing projects
        const inputStates: Record<string, { materialType: string; quantity: number; amount: number; projectId: string; date: string }> = {};
        Object.keys(groupedMaterials).forEach(projectId => {
          inputStates[projectId] = {
            materialType: "",
            quantity: 1,
            amount: 0,
            projectId,
            date: new Date().toISOString(),
          };
        });
        setProjectMaterialInputs(inputStates);
      }

      // Mock transactions data (replace with actual API call when available)
      const mockTransactions: Transaction[] = [
        {
          id: "1",
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          type: "Payment",
          amount: 12500,
          status: "Completed",
          reference: "PAY-2023-001",
          description: "Payment for cement delivery",
        },
        {
          id: "2",
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          type: "Order",
          amount: 18750,
          status: "Completed",
          reference: "ORD-2023-045",
          description: "Bulk cement order",
        },
      ];

      setTransactions(mockTransactions);
    } catch (error) {
      console.error("Error loading supplier data:", error);
      toast.error("Failed to load supplier data");
    } finally {
      setIsLoadingTransactions(false);
    }
  }

  

 
  // Calculate statistics
  const totalSuppliers = suppliers.length

  // Early loading state
  if (loading && suppliers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading suppliers...</p>
        </div>
      </div>
    )
  }



  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
      {filteredSuppliers.map((supplier) => (
        <Card
          key={supplier._id}
          className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
          onClick={() => handleSupplierClick(supplier)}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 hidden">
                  <AvatarImage
                    src={supplier.avatar || `https://avatar.vercel.sh/${supplier.email}.png`}
                    alt={supplier.companyName}
                  />
                  <AvatarFallback>
                    {supplier.companyName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{supplier.companyName}</h3>
                  <p className="text-sm text-muted-foreground">{supplier.contactPerson}</p>
                </div>
              </div>
              
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{supplier.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{supplier.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{supplier.address}</span>
              </div>
              {supplier.supplyStartDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Supply Started: {format(new Date(supplier.supplyStartDate), "MMM yyyy")}</span>
                </div>
              )}
              {supplier.bankDetails && supplier.bankDetails.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {supplier.bankDetails.find(acc => acc.isPrimary)?.bankName || supplier.bankDetails[0]?.bankName || 'Bank Account'}
                    {supplier.bankDetails.find(acc => acc.isPrimary) && ' (Primary)'}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Registered: {format(new Date(supplier.createdAt), "MMM yyyy")}</span>
              </div>
            </div>
            {supplier.materialTypes && supplier.materialTypes.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Materials:</p>
                <div className="flex flex-wrap gap-1">
                  {supplier.materialTypes.slice(0, 3).map((material) => (
                    <Badge key={material} variant="outline" className="text-xs">
                      {material}
                    </Badge>
                  ))}
                  {supplier.materialTypes.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{supplier.materialTypes.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
                onClick={() => openEditDialog(supplier)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 hover:text-green-700 border-green-500 hover:bg-green-50 bg-transparent"
                onClick={() => window.open(`https://wa.me/${supplier.phone.replace(/[^0-9]/g, "")}`, "_blank")}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSupplier(supplier);
                  setIsDetailSheetOpen(true);
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {supplier.companyName}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(supplier._id)}>Delete</AlertDialogAction>
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
              <TableHead>Company</TableHead>
              <TableHead>Contact Person</TableHead>
              
              <TableHead>Materials</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.map((supplier) => (
              <TableRow
                key={supplier._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSupplierClick(supplier)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={supplier.avatar || `https://avatar.vercel.sh/${supplier.email}.png`}
                        alt={supplier.companyName}
                      />
                      <AvatarFallback>
                        {supplier.companyName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{supplier.companyName}</div>
                      <div className="text-sm text-muted-foreground">{supplier.address}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{supplier.contactPerson}</div>
                </TableCell>
                
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {supplier.materialTypes.slice(0, 2).map((material) => (
                      <Badge key={material} variant="outline" className="text-xs">
                        {material}
                      </Badge>
                    ))}
                    {supplier.materialTypes.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{supplier.materialTypes.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{supplier.phone}</div>
                    <div className="text-muted-foreground">{supplier.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(supplier)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {supplier.companyName}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(supplier._id)}>Delete</AlertDialogAction>
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

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="md:grid hidden sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">Registered suppliers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Suppliers</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {suppliers.filter(s => s.bankDetails?.length).length}
            </div>
            <p className="text-xs text-muted-foreground">Suppliers with bank details</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Suppliers Management</h2>
          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              setLoading(true)
              fetchSuppliers()
            }}
            className="ml-2"
            disabled={loading}
            title="Refresh suppliers"
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-blue-600"
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
              <RefreshCw className="w-5 h-5" />
            )}
          </Button>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSupplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
              <DialogDescription>
                {editingSupplier ? "Update supplier information" : "Create a new supplier record"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleFormChange("companyName", e.target.value)}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => handleFormChange("contactPerson", e.target.value)}
                    placeholder="Enter contact person name"
                    required
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
                    onChange={(e) => handleFormChange("email", e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Material Types *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between bg-transparent">
                      {formData.materialTypes.length > 0
                        ? `${formData.materialTypes.length} materials selected`
                        : "Select materials..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search or create..."
                        value={materialInputValue}
                        onValueChange={setMaterialInputValue}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleMaterialCreate()
                          }
                        }}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <Button variant="outline" size="sm" onClick={handleMaterialCreate}>
                            Add: {materialInputValue}
                          </Button>
                        </CommandEmpty>
                        <CommandGroup>
                          {materialOptions.map((material) => (
                            <CommandItem key={material.value} onSelect={() => handleMaterialSelect(material.value)}>
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.materialTypes.includes(material.value) ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {material.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {formData.materialTypes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.materialTypes.map((material) => (
                      <Badge key={material} variant="secondary" className="flex items-center gap-1 pr-1">
                        <span>{material}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${material}`}
                          className="ml-1 rounded hover:bg-muted/60 p-0.5"
                          onClick={(e) => removeMaterial(material, e)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Bank Account Details</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentBankDetail({
                        accountType: 'Savings',
                        isPrimary: false
                      });
                      setIsBankDetailsOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Bank Account
                  </Button>
                </div>

                {formData.bankDetails?.length ? (
                  <div className="space-y-2">
                    {formData.bankDetails.map((detail, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <div className="font-medium">
                            {detail.bankName || 'Bank Account'} {detail.isPrimary && '(Primary)'}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCurrentBankDetail(detail);
                                setIsBankDetailsOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updatedDetails = [...formData.bankDetails];
                                updatedDetails.splice(index, 1);
                                handleFormChange('bankDetails', updatedDetails);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          <div>Account: {detail.accountNumber}</div>
                          <div>Name: {detail.accountHolderName}</div>
                          {detail.ifscCode && <div>IFSC: {detail.ifscCode}</div>}
                          {detail.upiId && <div>UPI: {detail.upiId}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    No bank accounts added
                  </div>
                )}
              </div>

              {/* Bank Details Dialog */}
              <Dialog open={isBankDetailsOpen} onOpenChange={setIsBankDetailsOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {currentBankDetail?.accountNumber ? 'Edit Bank Account' : 'Add Bank Account'}
                    </DialogTitle>
                    <DialogDescription>
                      {currentBankDetail?.accountNumber
                        ? 'Update the bank account details below.'
                        : 'Enter the bank account details for this supplier.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Bank Name</Label>
                        <Input
                          value={currentBankDetail?.bankName || ''}
                          onChange={(e) => setCurrentBankDetail({
                            ...currentBankDetail,
                            bankName: e.target.value
                          })}
                          placeholder="Bank name (optional)"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Account Number</Label>
                        <Input
                          value={currentBankDetail?.accountNumber || ''}
                          onChange={(e) => setCurrentBankDetail({
                            ...currentBankDetail,
                            accountNumber: e.target.value.replace(/\D/g, '')
                          })}
                          placeholder="Account number (optional)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Account Holder Name</Label>
                        <Input
                          value={currentBankDetail?.accountHolderName || ''}
                          onChange={(e) => setCurrentBankDetail({
                            ...currentBankDetail,
                            accountHolderName: e.target.value
                          })}
                          placeholder="Account holder name (optional)"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Account Type *</Label>
                        <Select
                          value={currentBankDetail?.accountType || 'Savings'}
                          onValueChange={(value) => setCurrentBankDetail({
                            ...currentBankDetail,
                            accountType: value as 'Savings' | 'Current' | 'Other'
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select account type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Savings">Savings</SelectItem>
                            <SelectItem value="Current">Current</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>IFSC Code</Label>
                        <Input
                          value={currentBankDetail?.ifscCode || ''}
                          onChange={(e) => setCurrentBankDetail({
                            ...currentBankDetail,
                            ifscCode: e.target.value.toUpperCase()
                          })}
                          placeholder="e.g., SBIN0001234"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Branch</Label>
                        <Input
                          value={currentBankDetail?.branch || ''}
                          onChange={(e) => setCurrentBankDetail({
                            ...currentBankDetail,
                            branch: e.target.value
                          })}
                          placeholder="e.g., Mumbai Main"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>UPI ID</Label>
                      <Input
                        value={currentBankDetail?.upiId || ''}
                        onChange={(e) => setCurrentBankDetail({
                          ...currentBankDetail,
                          upiId: e.target.value.toLowerCase()
                        })}
                        placeholder="e.g., name@bank"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isPrimary"
                        checked={currentBankDetail?.isPrimary || false}
                        onCheckedChange={(checked) => setCurrentBankDetail({
                          ...currentBankDetail,
                          isPrimary: Boolean(checked)
                        })}
                      />
                      <Label htmlFor="isPrimary" className="font-normal">
                        Set as primary account
                      </Label>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsBankDetailsOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          if (currentBankDetail?.bankName || currentBankDetail?.accountNumber || currentBankDetail?.accountHolderName) {
                            if (!currentBankDetail?.bankName || !currentBankDetail.accountNumber || !currentBankDetail.accountHolderName) {
                              toast.error('Please fill in Bank Name, Account Number, and Account Holder Name if adding bank details');
                              return;
                            }
                          }

                          if (!currentBankDetail) return; // Guard clause in case currentBankDetail is null

                          const updatedDetails = [...(formData.bankDetails || [])];
                          const existingIndex = updatedDetails.findIndex(
                            d => d.accountNumber === currentBankDetail.accountNumber
                          );

                          if (currentBankDetail.isPrimary) {
                            updatedDetails.forEach(d => { d.isPrimary = false; });
                          }

                          if (existingIndex >= 0) {
                            updatedDetails[existingIndex] = { ...currentBankDetail };
                          } else {
                            updatedDetails.push({ ...currentBankDetail });
                          }

                          handleFormChange('bankDetails', updatedDetails);
                          setIsBankDetailsOpen(false);
                          setCurrentBankDetail(null);
                        }}
                      >
                        Save Bank Account
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="space-y-2">
                <Label>Supply Start Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.supplyStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.supplyStartDate ? format(formData.supplyStartDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={formData.supplyStartDate}
                      onSelect={(date) => handleFormChange("supplyStartDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {editingSupplier && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleFormChange("status", e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleFormChange("address", e.target.value)}
                  placeholder="Enter company address"
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setEditingSupplier(null)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingSupplier ? "Update Supplier" : "Create Supplier"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <div className="flex flex-wrap gap-3 items-center w-full">
          {/* Search */}
          <div className="relative flex-1 w-full lg:max-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          

          {/* Badge */}
          <Badge variant="default" className="ml-auto">
            {filteredSuppliers.length} Total
          </Badge>
        </div>



        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8 px-3"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-8 px-3"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Suppliers Display */}
      {viewMode === "grid" ? renderGridView() : renderListView()}

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No suppliers found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? "Try adjusting your search criteria"
              : "Get started by adding your first supplier"}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Supplier
            </Button>
          )}
        </div>
      )}

      {/* Supplier Detail Sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] sm:max-w-none flex flex-col">
          {selectedSupplier && (
            <div className="flex flex-col h-full">
              <SheetHeader className="shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={selectedSupplier.avatar || `https://avatar.vercel.sh/${selectedSupplier.email}.png`}
                      alt={selectedSupplier.companyName}
                    />
                    <AvatarFallback className="text-xl">
                      {selectedSupplier.companyName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <SheetTitle className="text-2xl">{selectedSupplier.companyName}</SheetTitle>
                    <p className="text-muted-foreground">{selectedSupplier.contactPerson}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      openEditDialog(selectedSupplier)
                      setIsDetailSheetOpen(false)
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </SheetHeader>
              <Tabs defaultValue="overview" className="mt-6 flex flex-col h-[calc(100%-100px)]">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="sites">Sites</TabsTrigger>

                </TabsList>
                <TabsContent value="overview" className="flex-1 overflow-y-auto pr-2 space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium">Bank Details</p>
                            <p className="text-xs text-muted-foreground">
                              {selectedSupplier.bankDetails?.length || 0} accounts
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium">Supply Started</p>
                            <p className="text-xs text-muted-foreground">
                              {selectedSupplier.supplyStartDate
                                ? format(new Date(selectedSupplier.supplyStartDate), "MMM yyyy")
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Company Information */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Company Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Email</p>
                            <p className="text-sm text-muted-foreground">{selectedSupplier.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Phone</p>
                            <p className="text-sm text-muted-foreground">{selectedSupplier.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Address</p>
                            <p className="text-sm text-muted-foreground">{selectedSupplier.address}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <UserCheck className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Contact Person</p>
                            <p className="text-sm text-muted-foreground">{selectedSupplier.contactPerson}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Registered</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(selectedSupplier.createdAt), "PPP")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Materials */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Available Materials</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedSupplier.materialTypes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedSupplier.materialTypes?.map((material) => (
                            <Badge key={`${material}-${selectedSupplier._id}`} variant="outline" className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {material}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No materials specified</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="sites" className="flex-1 overflow-y-auto space-y-6">
                  <Card className="shadow-md border rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold">🏗️ Site Assignment & Material Tracking</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Add New Site Select */}
                      <div className="space-y-2">
                        <Label htmlFor="project-select" className="text-sm font-medium text-muted-foreground">
                          ➕ Add New Site
                        </Label>
                        <Select onValueChange={handleProjectSelect} value="" disabled={isLoadingProjects}>
                          <SelectTrigger className="w-full h-10 rounded-md border px-4 text-sm shadow-sm">
                            <SelectValue placeholder={isLoadingProjects ? "Loading projects..." : "Select a site to add"} />
                          </SelectTrigger>
                          <SelectContent>
                            {projects
                              .filter((project) => !projectMaterials[project._id])
                              .map((project) => (
                                <SelectItem key={project._id} value={project._id}>
                                  {project.title}
                                </SelectItem>
                              ))}
                            {!isLoadingProjects && projects.length === Object.keys(projectMaterials).length && (
                              <div className="px-3 py-2 text-sm text-muted-foreground italic">No more sites available</div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Site Cards */}
                      {Object.entries(projectMaterials).map(([projectId, materials]) => {
                        const project = projects.find((p) => p._id === projectId)
                        const currentInput = projectMaterialInputs[projectId] || { materialType: "", quantity: 1, amount: 0 }
                        if (!project) return null

                        return (
                          <Card key={projectId} className="border shadow rounded-xl bg-muted/5">
                            <CardHeader className="flex flex-row justify-between items-start gap-2">
                              <div>
                                <h6 className="text-lg font-semibold">{project.title}</h6>
                                <p className="text-sm text-muted-foreground">{project.description}</p>
                                <div className="text-xs mt-1 text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {format(new Date(project.startDate || new Date()), "MMM d, yyyy")} -{" "}
                                    {project.endDate ? format(new Date(project.endDate), "MMM d, yyyy") : "Present"}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:bg-red-50"
                                onClick={(e) => removeProject(projectId, e)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {/* Add Material Form */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Add Material</Label>
                                <div className="gap-3 flex flex-col">
                                  <div className="sm:col-span-5">
                                    <Select
                                      value={currentInput.materialType}
                                      onValueChange={(value) => updateProjectMaterialInput(projectId, "materialType", value)}
                                    >
                                      <SelectTrigger className="w-full h-9">
                                        <SelectValue placeholder="Select material" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {selectedSupplier.materialTypes?.map((material) => (
                                          <SelectItem key={`${material}-${projectId}`} value={material}>
                                            {material}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Input
                                    type="number"
                                    placeholder="Qty"
                                    min="1"
                                    value={currentInput.quantity}
                                    onChange={(e) => updateProjectMaterialInput(projectId, "quantity", e.target.value)}
                                    className="sm:col-span-2 text-center h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <div className="relative sm:col-span-3">
                                    <IndianRupee className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                                    <Input
                                      type="number"
                                      placeholder="Amount"
                                      min="0"
                                      step="0.01"
                                      value={currentInput.amount}
                                      onChange={(e) => updateProjectMaterialInput(projectId, "amount", e.target.value)}
                                      className="pl-8 text-center h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </div>
                                  <Button
                                    onClick={() => addMaterialToProject(projectId)}
                                    disabled={
                                      !currentInput.materialType ||
                                      !currentInput.quantity ||
                                      Number(currentInput.quantity) <= 0 ||
                                      Number(currentInput.amount) < 0 ||
                                      isSaving
                                    }
                                    className="sm:col-span-2 h-9"
                                  >
                                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                  </Button>
                                </div>
                              </div>

                              {/* Material List */}
                              <div className="space-y-2">
                                {(materials || []).map((material, idx) => (
                                  <div
                                    key={material._id || `${projectId}-${material.materialType}-${material.date || ''}-${idx}`}
                                    className="flex flex-wrap sm:flex-nowrap justify-between items-center bg-white p-3 rounded border"
                                  >
                                    <div className="flex items-center gap-2 mb-2 sm:mb-0">
                                      <Package className="w-4 h-4 text-blue-600" />
                                      <div>
                                        <div className="font-medium text-sm">{material.materialType}</div>
                                        <div className="text-xs text-gray-500">
                                          {format(new Date(material.date || new Date()), 'dd MMM yyyy')}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-sm text-gray-600">
                                        <span className="font-medium">Qty:</span> {material.quantity}
                                        <span className="mx-2">|</span>
                                        <span className="font-medium">Amount:</span> ₹{material.amount.toFixed(2)}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-600 hover:bg-red-50"
                                        onClick={() => removeMaterialFromProject(projectId, material.materialType)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Totals */}
                              <div className="text-sm font-medium text-blue-800 bg-blue-50 p-3 rounded border mt-4">
                                Total: {(materials || []).length} materials – ₹{(materials || []).reduce((sum, m) => sum + (m.amount || 0), 0).toFixed(2)}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}

                      {/* Empty State */}
                      
                      {Object.keys(projectMaterials).length === 0 && (
                        <div className="text-center py-10 rounded-lg border border-dashed bg-muted/20 space-y-2">
                          <Building2 className="w-10 h-10 mx-auto text-muted-foreground mb-1" />
                          <h4 className="text-lg font-semibold">No Sites Assigned</h4>
                          <p className="text-sm text-muted-foreground">Select a site to begin assigning materials.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default SuppliersManagement

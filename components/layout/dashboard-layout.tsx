"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Building2,
  Menu as MenuIcon,
  Home,
  Users,
  FolderOpen,
  Package,
  ClipboardList,
  MessageSquare,
  CreditCard,
  Settings,
  LogOut,
  Truck,
  Image,
  X
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: string
  activeSection?: string
  onSectionChange?: (section: string) => void
}

export default function DashboardLayout({
  children,
  userRole,
  activeSection = "dashboard",
  onSectionChange,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminProfile, setAdminProfile] = useState<{ adminName: string; email: string; profileImage?: string } | null>(null)
  const [profileName, setProfileName] = useState<string>("")
  const [profileEmail, setProfileEmail] = useState<string>("")
  const [profileData, setProfileData] = useState<Record<string, any> | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now())
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const { toast } = useToast()

  // Load saved background image
  useEffect(() => {
    const savedBackground = localStorage.getItem('dashboardBackground')
    if (savedBackground) {
      setBackgroundImage(savedBackground)
    }
  }, [])

  // Save background image when it changes
  useEffect(() => {
    if (backgroundImage) {
      localStorage.setItem('dashboardBackground', backgroundImage)
    }
  }, [backgroundImage])
  const router = useRouter()

  // Fetch admin profile data with auto-update
  useEffect(() => {
    let isMounted = true

    const fetchAdminProfile = async () => {
      try {
        // Add a timestamp to prevent caching
        const response = await fetch(`/api/admin/profile?_t=${Date.now()}`)
        if (!response.ok) throw new Error('Failed to fetch admin profile')
        const data = await response.json()

        if (isMounted) {
          setAdminProfile({
            adminName: data.adminName,
            email: data.email,
            profileImage: data.profileImage
          })
        }
      } catch (error) {
        console.error('Error fetching admin profile:', error)
        if (isMounted) {
          toast({
            title: 'Error',
            description: 'Failed to load admin profile',
            variant: 'destructive',
          })
        }
      }
    }

    // Initial fetch
    fetchAdminProfile()

    // Set up a real-time check every 5 seconds
    const intervalId = setInterval(fetchAdminProfile, 50000)

    // Clean up
    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [lastUpdated])

  // Function to trigger a profile update
  const triggerProfileUpdate = () => {
    setLastUpdated(Date.now())
  }

  // Set up a custom event listener for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      triggerProfileUpdate()
    }

    // Listen for custom event when profile is updated
    window.addEventListener('profileUpdated', handleProfileUpdate)

    // Clean up
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate)
    }
  }, [])

  // Fetch logged-in user's profile (supervisor/client) for dropdown details
  useEffect(() => {
    const fetchRoleProfile = async () => {
      try {
        const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null
        const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
        const emailLS = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : ''
        if (!role) return

        // Admin already handled by adminProfile fetch
        if (role === 'admin') {
          setProfileName(adminProfile?.adminName || 'Admin')
          setProfileEmail(adminProfile?.email || emailLS || '')
          setProfileData(adminProfile ?
            {
              role: 'admin',
              ...adminProfile,
              profileImage: adminProfile.profileImage || '/placeholder-user.jpg'
            } :
            {
              role: 'admin',
              email: emailLS,
              profileImage: '/placeholder-user.jpg'
            })
          return
        }

        if (!userId) {
          setProfileName(role.charAt(0).toUpperCase() + role.slice(1))
          setProfileEmail(emailLS || '')
          setProfileData({ role, email: emailLS || '' })
          return
        }

        let url = ''
        if (role === 'supervisor') url = `/api/supervisors/${userId}`
        else if (role === 'client') url = `/api/clients/${userId}`
        else {
          setProfileName(role.charAt(0).toUpperCase() + role.slice(1))
          setProfileEmail(emailLS || '')
          return
        }

        const res = await fetch(url)
        if (!res.ok) throw new Error('Failed to fetch profile')
        const data = await res.json()

        // Try common name/email fields with safe fallbacks
        const name = data?.name || data?.fullName || data?.clientName || data?.username || role
        const email = data?.email || emailLS || ''
        setProfileName(name)
        setProfileEmail(email)
        // Exclude sensitive fields
        const { password, __v, ...safe } = data || {}
        setProfileData({ role, ...safe })
      } catch (e) {
        // Fallback to localStorage values
        const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'User' : 'User'
        const emailLS = typeof window !== 'undefined' ? localStorage.getItem('userEmail') || '' : ''
        setProfileName(role.charAt(0).toUpperCase() + role.slice(1))
        setProfileEmail(emailLS)
        setProfileData({ role, email: emailLS })
      }
    }

    fetchRoleProfile()
  }, [userRole, adminProfile])

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userId")
    localStorage.removeItem("userName")
    router.push("/")
  }

  const getNavItems = () => {
    const baseItems = [{ icon: Home, label: "Dashboard", href: "dashboard", id: "dashboard" }]

    switch (userRole) {
      case "admin":
        return [
          ...baseItems,
          // { icon: Users, label: "User Management", href: "users", id: "users" },
          // { icon: FolderOpen, label: "Projects", href: "projects", id: "projects" },
          { icon: Truck, label: "Suppliers", href: "suppliers", id: "suppliers" },
          { icon: ClipboardList, label: "Supervisors", href: "supervisors", id: "supervisors" },
          { icon: Users, label: "Employees", href: "employees", id: "employees" },
          { icon: Users, label: "Clients", href: "clients", id: "clients" },
          // { icon: Users, label: "All Workers", href: "workers", id: "workers" },
          // { icon: Package, label: "Materials", href: "materials", id: "materials" },
          { icon: ClipboardList, label: "Reports", href: "reports", id: "reports" },
          { icon: MessageSquare, label: "Payroll", href: "payroll", id: "payroll" },
          // { icon: MessageSquare, label: "Messages", href: "message", id: "message" },
          { icon: Settings, label: "Settings", href: "settings", id: "settings" },

        ]
      case "supervisor":
        return [
          ...baseItems,
          { icon: FolderOpen, label: "Task", href: "task", id: "task" },
          { icon: Users, label: "Employee", href: "employee", id: "employee" },
          { icon: ClipboardList, label: "Reports", href: "reports", id: "reports" },
          // { icon: Package, label: "Attendance", href: "attendance", id: "attendance" },
          { icon: Package, label: "Materials", href: "materials", id: "materials" },
        ]
      case "client":
        return [
          ...baseItems,
          { icon: FolderOpen, label: "My Projects", href: "projects", id: "projects" },
          { icon: CreditCard, label: "Payments", href: "payments", id: "payments" },
          { icon: MessageSquare, label: "Messages", href: "message", id: "message" },
        ]
      case "supplier":
        return [
          ...baseItems,
          { icon: Package, label: "Inventory", href: "inventory", id: "inventory" },
          { icon: ClipboardList, label: "Delivery Logs", href: "deliveries", id: "deliveries" },
          { icon: FolderOpen, label: "Orders", href: "orders", id: "orders" },
        ]
      default:
        return baseItems
    }
  }

  const navItems = getNavItems()

  const handleNavClick = (sectionId: string) => {
    if (onSectionChange) {
      onSectionChange(sectionId)
    }
    setSidebarOpen(false)
  }


  // bg-[#051118] 
  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? "w-full" : "w-64"} bg-[#fff0] shadow-md`}>
      <div className="flex items-center gap-0 p-6">
        <img src="/virukshaa3.png" alt="" className="min-w-[20px] h-8" />
        <span className="font-bold text-xl text-[#37db44]">Virukshaa</span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={activeSection === item.id ? "default" : "ghost"}
            className={`w-full justify-start gap-3 ${activeSection === item.id ? "bg-[#fff] text-[#316b35] hover:bg-[#fff] hover:shadow-lg shadow-md transition-shadow" : "hover:bg-[#F9F9F9] hover:text-[#000] text-[#051118]"
              }`}
            onClick={() => handleNavClick(item.id)}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Button>
        ))}
      </nav>
      <div className="text-center text-[12px] py-2 text-muted-foreground">developed by <a href="http://dezprox.com" target="_blank" className="text-green-600" rel="noopener noreferrer">Dezprox</a></div>

    </div>
  )

  const getSectionTitle = () => {
    const currentItem = navItems.find((item) => item.id === activeSection)
    return currentItem ? currentItem.label : "Dashboard"
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden fixed  top-4 left-4 z-50">
            <MenuIcon className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl relative left-10 font-semibold">
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)} - {getSectionTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={profileData?.avatar ||
                        (userRole === 'admin' && adminProfile?.profileImage) ||
                        '/placeholder-user.jpg'}
                      alt={`${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Profile`}
                      className="object-cover"
                    />
                    <AvatarFallback>{userRole.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profileName || adminProfile?.adminName || userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profileEmail || adminProfile?.email || localStorage.getItem("userEmail") || "user@example.com"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {profileData && (
                  <div className="px-3 py-2 max-h-56 overflow-auto space-y-2">
                    {Object.entries(profileData)
                      .filter(([key]) => !['password', '__v', '_id', 'id', 'totalPaid', 'dueAmount', 'salary', 'createdAt', 'updatedAt', 'status'].includes(key))
                      .map(([key, value]) => {
                        const label = key.replace(/([A-Z])/g, ' $1').trim()
                        let display: string = ''
                        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                          display = String(value)
                        } else if (Array.isArray(value)) {
                          display = `${value.length} item${value.length === 1 ? '' : 's'}`
                        } else if (value && typeof value === 'object') {
                          display = '—'
                        } else {
                          display = ''
                        }
                        return (
                          <div key={key} className="grid grid-cols-1 gap-1 border-b pb-2 last:border-none">
                            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
                            <span className="text-[13px] font-medium truncate">{display}</span>
                          </div>
                        )
                      })}
                  </div>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Background Image Upload */}
        <div className="absolute top-4 right-20 z-10 flex gap-2">
          {backgroundImage && (
            <button
              type="button"
              onClick={() => {
                setBackgroundImage(null);
                localStorage.removeItem('dashboardBackground');
                // Reset the file input
                const fileInput = document.getElementById('background-upload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
                toast({
                  title: 'Background Removed',
                  description: 'Dashboard background has been reset to default.',
                });
              }}
              className="inline-flex items-center  lg:gap-2 gap-1 px-3 py-2 bg-white/80 hover:bg-white/90 rounded-md shadow-sm transition-colors text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
              <span className="text-sm lg:block hidden">Remove</span>
            </button>
          )}
          <label htmlFor="background-upload" className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white/80 hover:bg-white/90 rounded-md shadow-sm transition-colors">
            <Image className="w-4 h-4" />
            <span className="text-sm lg:block hidden">Change Background</span>
          </label>
          <input
            id="background-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  // Validate file size (5MB limit)
                  if (file.size > 5 * 1024 * 1024) {
                    toast({
                      title: 'File Too Large',
                      description: 'Please select an image under 5MB.',
                      variant: 'destructive',
                    });
                    e.target.value = '';
                    return;
                  }

                  // Validate file type
                  if (!file.type.startsWith('image/')) {
                    toast({
                      title: 'Invalid File Type',
                      description: 'Please select an image file.',
                      variant: 'destructive',
                    });
                    e.target.value = '';
                    return;
                  }

                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('type', 'background');

                  const response = await fetch('/api/admin/upload-logo', {
                    method: 'POST',
                    body: formData,
                  });

                  const data = await response.json();

                  if (!response.ok) {
                    throw new Error(data.error || 'Upload failed');
                  }

                  if (!data.fileUrl) {
                    throw new Error('No file URL received from server');
                  }

                  setBackgroundImage(data.fileUrl);
                  localStorage.setItem('dashboardBackground', data.fileUrl);

                  toast({
                    title: 'Background Updated',
                    description: 'Dashboard background has been changed successfully.',
                  });
                } catch (error) {
                  console.error('Background upload error:', error);
                  toast({
                    title: 'Upload Failed',
                    description: 'Failed to upload background image. Please try again.',
                    variant: 'destructive',
                  });
                }
              }
            }}
          />
        </div>

        {/* Main Content Area */}
        <main
          className="flex-1 overflow-auto p-6"
          style={{
            backgroundImage: `url(${backgroundImage || '/virukshaa3.png'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

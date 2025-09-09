"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Users, ClipboardList, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: ""
  })
  const [isSignupLoading, setIsSignupLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSignupLoading(true)

    try {
      if (signupData.password !== signupData.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (!signupData.role) {
        throw new Error('Please select a role')
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: signupData.name,
          email: signupData.email,
          password: signupData.password,
          role: signupData.role
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      localStorage.setItem('userRole', signupData.role)
      localStorage.setItem('userEmail', signupData.email)
      localStorage.setItem('userName', signupData.name)
      router.push('/dashboard')
    } catch (error) {
      console.error('Signup error:', error)
      alert(error instanceof Error ? error.message : 'Signup failed. Please try again.')
    } finally {
      setIsSignupLoading(false)
    }
  }

  const handleLogin = async (demoRole?: string) => {
    setIsLoading(true);

    try {
      const selectedRole = demoRole || role;

      if (!selectedRole) {
        toast.error('Please select a role');
        throw new Error('Please select a role');
      }
      // Always authenticate against the API for all roles so passwords are validated
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role: selectedRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Login failed');
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem("userRole", selectedRole);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userName", data.user.name || 'User');
      // Persist backend user id for role-scoped data (e.g., supervisor tasks)
      if (data.user && data.user._id) {
        localStorage.setItem("userId", data.user._id);
      }
      router.push("/dashboard");
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 rounded-lg flex items-center justify-center">
            <img src="/virukshaa4.png" alt="" className="h-20 " />

          </div>
          <CardTitle className="text-2xl font-bold">Virukshaa Construction Product</CardTitle>
          <CardDescription>Construction Management System</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">UserName</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                >
                  <option value="">Select a role</option>
                  <option value="superadmin">Super Admin</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="client">Client</option>
                </select>
              </div>

              <Button
                onClick={() => handleLogin()}
                disabled={isLoading || !role}
                className={`w-full ${isLoading ? "bg-gray-400" : ""}`}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
        <div className="text-center text-[12px] py-2 text-muted-foreground">developed by <a href="http://dezprox.com" target="_blank" className="text-green-600" rel="noopener noreferrer">Dezprox</a></div>
      </Card>
    </div>
  )
}

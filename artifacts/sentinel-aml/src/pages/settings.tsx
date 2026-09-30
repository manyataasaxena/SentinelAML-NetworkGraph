import { useGetCurrentUser } from "@workspace/api-client-react"
import { Settings as SettingsIcon, Moon, Sun, Monitor, User, Shield, Key } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"

export default function Settings() {
  const { data: user } = useGetCurrentUser()
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your preferences and system configuration.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p className="mt-1 font-medium">{user?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                <p className="mt-1 font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Role</p>
                <div className="mt-1">
                  <Badge variant="secondary" className="capitalize">{user?.role.replace("_", " ")}</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                <p className="mt-1 font-medium">{user ? new Date(user.createdAt).toLocaleDateString() : "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Appearance
            </CardTitle>
            <CardDescription>Select the theme for the SentinelAML terminal.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <button 
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-colors ${theme === "light" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"}`}
              >
                <Sun className="w-8 h-8 mb-2" />
                <span className="font-medium">Light Mode</span>
              </button>
              <button 
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-colors ${theme === "dark" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"}`}
              >
                <Moon className="w-8 h-8 mb-2" />
                <span className="font-medium">Dark Mode</span>
              </button>
              <button 
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-colors ${theme === "system" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"}`}
              >
                <Monitor className="w-8 h-8 mb-2" />
                <span className="font-medium">System Sync</span>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Password Authentication</p>
                    <p className="text-sm text-muted-foreground">Standard email and password login.</p>
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

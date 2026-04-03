'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogOut, Star, Shield } from 'lucide-react'

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 text-accent fill-accent" />
            <span className="text-xl font-bold text-foreground">Little Stars</span>
          </div>
          <Button
            onClick={handleLogout}
            disabled={isLoading}
            variant="outline"
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            {isLoading ? 'Signing out...' : 'Logout'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <Card className="mx-auto max-w-2xl border-border/50 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl text-foreground">Admin Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg text-muted-foreground">Coming Soon</p>
            <p className="mt-2 text-sm text-muted-foreground">
              The admin dashboard is currently under development.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

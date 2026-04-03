'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Star } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)

    try {
      console.log('[v0] Attempting login with:', email)
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('[v0] Auth response:', { authData, authError })

      if (authError) {
        console.log('[v0] Auth error:', authError.message)
        toast.error(authError.message || 'Invalid email or password')
        return
      }

      if (!authData.user) {
        console.log('[v0] No user in auth data')
        toast.error('Invalid email or password')
        return
      }

      console.log('[v0] User authenticated:', authData.user.id)

      // Get user role from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      console.log('[v0] Profile response:', { profile, profileError })

      if (profileError) {
        console.log('[v0] Profile error:', profileError.message)
        // If no profile exists, default to parent role
        toast.info('Redirecting to parent dashboard...')
        router.push('/parent/dashboard')
        return
      }

      if (!profile) {
        console.log('[v0] No profile found, defaulting to parent')
        router.push('/parent/dashboard')
        return
      }

      console.log('[v0] User role:', profile.role)

      // Redirect based on role
      switch (profile.role) {
        case 'admin':
          router.push('/admin/dashboard')
          break
        case 'teacher':
          router.push('/teacher/dashboard')
          break
        case 'parent':
          router.push('/parent/dashboard')
          break
        default:
          console.log('[v0] Unknown role, defaulting to parent')
          router.push('/parent/dashboard')
      }
    } catch (error) {
      console.log('[v0] Catch error:', error)
      toast.error('An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2">
            <Star className="h-8 w-8 text-accent fill-accent" />
            <span className="text-2xl font-bold text-foreground">Little Stars</span>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-foreground">Welcome Back</CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign in to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-5">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-foreground">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-foreground">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </div>
                <div className="mt-4 text-center">
                  <Link
                    href="#"
                    className="text-sm text-primary hover:underline underline-offset-4"
                  >
                    Forgot password?
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary underline underline-offset-4">
              Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

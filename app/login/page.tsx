'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFormState, useFormStatus } from 'react-dom'
import { Star } from 'lucide-react'
import Link from 'next/link'
import { loginAction, type LoginState } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-[#FF6B6B] px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-[#ff5a5a] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? 'Signing in...' : 'Sign In'}
    </button>
  )
}

export default function LoginPage() {
  const [state, formAction] = useFormState<LoginState, FormData>(loginAction, {})

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
              <form action={formAction}>
                <div className="flex flex-col gap-5">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-foreground">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-foreground">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      className="bg-input border-border"
                    />
                  </div>
                  {state?.error ? (
                    <p className="text-sm font-medium text-red-600">{state.error}</p>
                  ) : null}
                  <SubmitButton />
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-2">
            <Link href="/" className="hover:text-primary underline underline-offset-4">
              Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

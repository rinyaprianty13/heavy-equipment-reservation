'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { EmLogo } from '@/components/em-logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === 'sign-up'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = isSignUp
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password })

      setLoading(false)

      if (error) {
        console.error('[v0] Auth error:', error)
        setError(error.message ?? 'Something went wrong')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('[v0] Auth exception:', err)
      setLoading(false)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    }
  }

  return (
    <main className="flex min-h-svh flex-col bg-background">
      <div className="border-b border-border bg-background/95 px-4 py-6 backdrop-blur-sm">
        <div className="mx-auto max-w-md">
          <EmLogo href="/" />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-border bg-card p-8">
          <div className="mb-6 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-1 w-8 rounded bg-primary" />
              <span className="text-xs font-semibold uppercase text-primary">
                {isSignUp ? 'Registration' : 'Authentication'}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSignUp
                ? 'Register to access the EMCL equipment reservation system'
                : 'Sign in to manage your equipment reservations'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className="border-border bg-input"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="border-border bg-input"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="border-border bg-input"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading
                ? 'Please wait...'
                : isSignUp
                  ? 'Create account'
                  : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <Link
              href={isSignUp ? '/sign-in' : '/sign-up'}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </Link>
          </p>
        </Card>
      </div>
    </main>
  )
}

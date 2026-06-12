'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Menu, X } from 'lucide-react'
import { EmLogo } from '@/components/em-logo'
import { signOut } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

type NavLink = {
  href: string
  label: string
}

type EmNavbarProps = {
  variant?: 'public' | 'app'
  links?: NavLink[]
  showAdmin?: boolean
  userEmail?: string
}

const publicLinks: NavLink[] = [
  { href: '#features', label: 'Features' },
  { href: '#workflow', label: 'Workflow' },
  { href: '#equipment', label: 'Equipment' },
]

export function EmNavbar({
  variant = 'public',
  links,
  showAdmin = false,
  userEmail,
}: EmNavbarProps) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navLinks =
    links ??
    (variant === 'app'
      ? [
          { href: '/dashboard', label: 'Dashboard' },
          ...(showAdmin ? [{ href: '/admin/equipment', label: 'Admin' }] : []),
        ]
      : publicLinks)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <EmLogo href={variant === 'app' ? '/dashboard' : '/'} />

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {variant === 'public' ? (
            <>
              <Link href="/sign-in">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </>
          ) : (
            <>
              {userEmail && (
                <span className="max-w-[180px] truncate text-sm text-muted-foreground">
                  {userEmail}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-card/50 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium hover:text-primary"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {variant === 'public' ? (
              <>
                <Link href="/sign-in" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="mt-2 w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Get Started</Button>
                </Link>
              </>
            ) : (
              <Button
                variant="outline"
                className="mt-2 w-full"
                onClick={() => {
                  setMobileOpen(false)
                  handleSignOut()
                }}
              >
                Sign Out
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

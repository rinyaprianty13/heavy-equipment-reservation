import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowRight, Calendar, CheckCircle2, Shield } from 'lucide-react'
import { EmNavbar } from '@/components/em-navbar'
import { EmFooter } from '@/components/em-footer'
import { EmSectionHeader } from '@/components/em-section-header'
import { Button } from '@/components/ui/button'

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EmNavbar />

      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="h-1 w-12 rounded bg-primary" />
                <span className="text-sm font-semibold uppercase text-primary">
                  Operations Platform
                </span>
              </div>
              <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
                Heavy Equipment Reservation System
              </h1>
              <p className="text-balance text-lg text-muted-foreground">
                Streamlined reservation management for cranes, forklifts, manlifts,
                and other heavy equipment across EMCL Cepu operations.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up">
                  <Button size="lg" className="w-full gap-2 sm:w-auto">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative flex h-80 items-center justify-center rounded-xl border border-primary/30 bg-gradient-to-br from-primary/20 to-primary/5">
              <div className="text-center">
                <div className="mb-4 text-6xl font-bold text-primary/40">🏗️</div>
                <p className="text-sm text-muted-foreground">
                  EMCL Equipment Operations
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
      </section>

      <section className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Equipment Types', value: '4+' },
              { label: 'Approval Workflow', value: 'Multi-level' },
              { label: 'Conflict Detection', value: 'Real-time' },
              { label: 'Audit Trail', value: '100%' },
            ].map((metric) => (
              <div key={metric.label} className="space-y-2">
                <p className="text-3xl font-bold text-primary">{metric.value}</p>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="border-b border-border">
        <div className="mx-auto max-w-7xl space-y-12 px-4 py-24 sm:px-6 lg:px-8">
          <EmSectionHeader
            label="Features"
            title="Built for Field Operations"
            description="Request, approve, and track heavy equipment reservations with automated conflict detection and full audit compliance."
          />
          <div className="grid gap-8 lg:grid-cols-3">
            {[
              {
                icon: CheckCircle2,
                title: 'Smart Approvals',
                description:
                  'Multi-level approval workflow with notes, reassignment, and complete audit trail for compliance.',
              },
              {
                icon: Calendar,
                title: 'Visual Calendar',
                description:
                  'See equipment availability across all sites with filtering by type, site, and status.',
              },
              {
                icon: Shield,
                title: 'Conflict Prevention',
                description:
                  'Automatic double-booking detection with alternative equipment suggestions.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-border bg-card p-6 transition hover:border-primary/50"
              >
                <item.icon className="mb-4 h-8 w-8 text-primary" />
                <h3 className="mb-3 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-7xl space-y-12 px-4 py-24 sm:px-6 lg:px-8">
          <EmSectionHeader
            label="Workflow"
            title="From Request to Approval"
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { step: '01', title: 'Submit Request', desc: 'Select equipment and dates' },
              { step: '02', title: 'Conflict Check', desc: 'System detects overlaps' },
              { step: '03', title: 'Approver Review', desc: 'Pending queue review' },
              { step: '04', title: 'Confirmed', desc: 'Notifications sent' },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-lg border border-border bg-background p-6 transition hover:border-primary/50"
              >
                <p className="mb-2 text-2xl font-bold text-primary">{item.step}</p>
                <h4 className="mb-2 font-semibold">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="equipment" className="border-b border-border">
        <div className="mx-auto max-w-7xl space-y-12 px-4 py-24 sm:px-6 lg:px-8">
          <EmSectionHeader
            label="Equipment"
            title="Supported Equipment Types"
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Cranes', icon: '🏗️' },
              { name: 'Forklifts', icon: '🚜' },
              { name: 'Manlifts', icon: '🪜' },
              { name: 'Other', icon: '⚙️' },
            ].map((item) => (
              <div
                key={item.name}
                className="rounded-lg border border-primary/30 bg-primary/5 p-8 text-center"
              >
                <div className="mb-3 text-4xl">{item.icon}</div>
                <p className="font-semibold">{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-gradient-to-r from-primary/20 to-primary/5">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Ready to Reserve Equipment?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Sign up to submit requests, track approvals, and manage equipment
            reservations across EMCL Cepu sites.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto">
                Create Account
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <EmFooter />
    </div>
  )
}

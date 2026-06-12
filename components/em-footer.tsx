import { EmLogo } from '@/components/em-logo'

export function EmFooter() {
  return (
    <footer className="border-t border-border bg-background/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-4 font-semibold text-foreground">Reservation System</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Equipment requests</li>
              <li>Approval workflow</li>
              <li>Conflict detection</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-foreground">Equipment Types</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Mobile cranes</li>
              <li>Forklifts</li>
              <li>Manlifts</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-foreground">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Operations team</li>
              <li>Internal use only</li>
              <li>EMCL Cepu site</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <EmLogo href="/" size="sm" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ExxonMobil Cepu Limited. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

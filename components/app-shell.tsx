import { EmNavbar } from '@/components/em-navbar'
import { EmFooter } from '@/components/em-footer'

type AppShellProps = {
  children: React.ReactNode
  userEmail?: string
  showAdmin?: boolean
}

export function AppShell({ children, userEmail, showAdmin }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <EmNavbar variant="app" userEmail={userEmail} showAdmin={showAdmin} />
      <main className="flex-1">{children}</main>
      <EmFooter />
    </div>
  )
}

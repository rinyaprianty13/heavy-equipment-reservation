import { cn } from '@/lib/utils'

type EmSectionHeaderProps = {
  label: string
  title: string
  description?: string
  className?: string
}

export function EmSectionHeader({
  label,
  title,
  description,
  className,
}: EmSectionHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <div className="h-1 w-12 rounded bg-primary" />
        <span className="text-sm font-semibold uppercase text-primary">{label}</span>
      </div>
      <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      {description && (
        <p className="max-w-2xl text-lg text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

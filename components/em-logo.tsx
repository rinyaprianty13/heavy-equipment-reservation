import Link from 'next/link'
import { cn } from '@/lib/utils'

type EmLogoProps = {
  href?: string
  size?: 'sm' | 'md'
  showSubtitle?: boolean
  className?: string
}

export function EmLogo({
  href = '/',
  size = 'md',
  showSubtitle = true,
  className,
}: EmLogoProps) {
  const iconSize = size === 'sm' ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-xl'
  const titleSize = size === 'sm' ? 'text-base' : 'text-lg'

  const content = (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground',
          iconSize
        )}
      >
        EM
      </div>
      {showSubtitle && (
        <div className="hidden sm:block">
          <p className={cn('font-bold text-foreground leading-tight', titleSize)}>
            ExxonMobil Cepu
          </p>
          <p className="text-xs text-muted-foreground">Limited Company</p>
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-90">
        {content}
      </Link>
    )
  }

  return content
}

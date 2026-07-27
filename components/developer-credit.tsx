import { cn } from '@/lib/utils'

type DeveloperCreditProps = {
  className?: string
  variant?: 'default' | 'sidebar'
}

export function DeveloperCredit({ className, variant = 'default' }: DeveloperCreditProps) {
  const isSidebar = variant === 'sidebar'

  return (
    <p
      className={cn(
        'text-center text-[11px] leading-snug',
        isSidebar
          ? 'text-sidebar-foreground/45 group-data-[collapsible=icon]:hidden'
          : 'text-muted-foreground',
        className,
      )}
    >
      Desenvolvido por{' '}
      <span className={cn('font-medium', isSidebar ? 'text-sidebar-foreground/70' : 'text-foreground/80')}>
        Victor Santos
      </span>
    </p>
  )
}

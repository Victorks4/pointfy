'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ThemeToggleProps = {
  className?: string
  variant?: 'icon' | 'sidebar'
}

export function ThemeToggle({ className, variant = 'icon' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const activeTheme = resolvedTheme ?? theme ?? 'light'
  const isDark = activeTheme === 'dark'

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark')
  }, [isDark, setTheme])

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn('h-9 w-9', className)}
        aria-label="Alternar tema"
        disabled
      />
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={variant === 'sidebar' ? 'sm' : 'icon'}
      className={cn(
        variant === 'sidebar'
          ? 'w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent'
          : 'h-9 w-9',
        className,
      )}
      onClick={toggleTheme}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {variant === 'sidebar' ? (
        <span>{isDark ? 'Modo claro' : 'Modo escuro'}</span>
      ) : null}
    </Button>
  )
}

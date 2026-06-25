'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useData } from '@/lib/data-context'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { PontifyDataFlowBrand } from '@/components/pontify-data-flow-brand'
import {
  Clock,
  LayoutDashboard,
  FileText,
  Bell,
  Users,
  LogOut,
  CalendarDays,
  ShieldCheck,
  Megaphone,
  FileBarChart2,
  SlidersHorizontal,
  Target,
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

function menuButtonClass(isActive: boolean) {
  return cn(
    'group relative py-1.5 text-sidebar-foreground transition-all duration-200',
    isActive ? 'neon-sidebar-active bg-sidebar-accent' : 'hover:bg-sidebar-accent/70',
  )
}

function menuIconClass(isActive: boolean) {
  return cn(
    'rounded-lg p-1.5 transition-colors',
    isActive
      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
      : 'text-sidebar-foreground/65 group-hover:bg-sidebar-accent group-hover:text-sidebar-foreground',
  )
}

export function DashboardSidebar() {
  const { user, logout } = useAuth()
  const { getNotificacoesByUser, getCompensacoesPendentesGestor } = useData()
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const notificacoesNaoLidas = user ? getNotificacoesByUser(user.id).filter((n) => !n.lida).length : 0
  const compensacoesPendentes =
    user?.cargo === 'gestor' ? getCompensacoesPendentesGestor(user.id).length : 0

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    await logout()
  }

  const userMenuItems = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Registrar Presença', href: '/dashboard/ponto', icon: Clock },
    { title: 'Histórico', href: '/dashboard/historico', icon: CalendarDays },
    { title: 'Justificativas', href: '/dashboard/justificativas', icon: FileText },
    { title: 'Relatórios', href: '/dashboard/relatorios', icon: FileBarChart2 },
    {
      title: 'Notificações',
      href: '/dashboard/notificacoes',
      icon: Bell,
      badge: notificacoesNaoLidas > 0 ? notificacoesNaoLidas : null,
    },
  ]

  const adminMenuItems = [
    { title: 'Painel Admin', href: '/dashboard/admin', icon: ShieldCheck },
    { title: 'Usuários', href: '/dashboard/admin/usuarios', icon: Users },
    { title: 'Notificações', href: '/dashboard/admin/notificacoes', icon: Megaphone },
    { title: 'Desafios', href: '/dashboard/admin/desafios', icon: Target },
    { title: 'Configurações', href: '/dashboard/admin/configuracoes-ponto', icon: SlidersHorizontal },
    { title: 'Justificativas', href: '/dashboard/admin/justificativas', icon: FileText },
  ]

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  const logoHref =
    user?.cargo === 'admin'
      ? '/dashboard/admin'
      : user?.cargo === 'gestor'
        ? '/dashboard/gestor'
        : '/dashboard'

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border [&_[data-sidebar=sidebar]]:!bg-gradient-to-b [&_[data-sidebar=sidebar]]:!from-[#24364e] [&_[data-sidebar=sidebar]]:!to-[#16263a] dark:[&_[data-sidebar=sidebar]]:!from-[#1e3047] dark:[&_[data-sidebar=sidebar]]:!to-[#121f30]"
    >
      <SidebarHeader className="border-b border-sidebar-border !gap-0 !p-0">
        <div className="neon-logo-shell pontify-logo-shell mx-2 mb-0.5 mt-0.5 transition-transform duration-200 hover:scale-[1.03]">
          <div className="pontify-logo-shell-inner">
            <Link
              href={logoHref}
              className="pontify-logo-trigger flex flex-col outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
            >
              <span className="pontify-logo-wrap relative inline-flex overflow-hidden rounded-md px-2 pt-0.5">
                <Image
                  src="/pontifylogo.png"
                  alt="Pontify"
                  width={800}
                  height={200}
                  className="pontify-logo-img block h-9 w-auto max-w-[min(100%,14.75rem)] object-contain object-left sm:h-24 sm:max-w-[min(100%,14.85rem)]"
                  sizes="(max-width: 768px) 240px, 252px"
                  priority
                />
                <span
                  aria-hidden
                  className="pontify-logo-shine pointer-events-none absolute inset-0 -translate-x-full"
                />
              </span>
              <PontifyDataFlowBrand variant="sidebar" />
            </Link>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1.5 px-2 [&>[data-sidebar=group]:first-child]:pt-0">
        {user?.cargo === 'estagiario' && (
          <SidebarGroup data-fy-anchor="fy-sidebar-menu" className="p-1.5">
            <SidebarGroupLabel className="h-7 min-h-[1.75rem] text-xs uppercase tracking-wider text-sidebar-foreground/55">
              Menu Principal
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {userMenuItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} className={menuButtonClass(isActive)}>
                        <Link href={item.href} className="flex items-center gap-3">
                          <div className={menuIconClass(isActive)}>
                            <item.icon className="h-4 w-4" />
                          </div>
                          <span className="flex-1">{item.title}</span>
                          {item.badge ? (
                            <Badge
                              variant="default"
                              className="flex h-5 min-w-[20px] animate-pulse items-center justify-center bg-sidebar-primary text-xs text-sidebar-primary-foreground"
                            >
                              {item.badge}
                            </Badge>
                          ) : null}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {user?.cargo === 'gestor' && (
          <SidebarGroup data-fy-anchor="fy-sidebar-gestor" className="p-1.5">
            <SidebarGroupLabel className="h-7 min-h-[1.75rem] text-xs uppercase tracking-wider text-sidebar-foreground/55">
              Coordenação
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/dashboard/gestor' || pathname.startsWith('/dashboard/gestor/')}
                    className={menuButtonClass(
                      pathname === '/dashboard/gestor' || pathname.startsWith('/dashboard/gestor/'),
                    )}
                  >
                    <Link href="/dashboard/gestor" className="flex items-center gap-3">
                      <div
                        className={menuIconClass(
                          pathname === '/dashboard/gestor' || pathname.startsWith('/dashboard/gestor/'),
                        )}
                      >
                        <Users className="h-4 w-4" />
                      </div>
                      <span className="flex-1">Meus estagiários</span>
                      {compensacoesPendentes > 0 ? (
                        <Badge
                          className="flex h-5 min-w-[20px] animate-pulse items-center justify-center bg-amber-500 text-xs text-white dark:bg-amber-500/90"
                          title={`${compensacoesPendentes} compensação(ões) pendente(s)`}
                        >
                          {compensacoesPendentes}
                        </Badge>
                      ) : null}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {[
                  { title: 'Registrar Presença', href: '/dashboard/ponto', icon: Clock },
                  { title: 'Histórico', href: '/dashboard/historico', icon: CalendarDays },
                  { title: 'Relatórios', href: '/dashboard/relatorios', icon: FileBarChart2 },
                ].map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} className={menuButtonClass(isActive)}>
                        <Link href={item.href} className="flex items-center gap-3">
                          <div className={menuIconClass(isActive)}>
                            <item.icon className="h-4 w-4" />
                          </div>
                          <span className="flex-1">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/dashboard/notificacoes'}
                    className={menuButtonClass(pathname === '/dashboard/notificacoes')}
                  >
                    <Link href="/dashboard/notificacoes" className="flex items-center gap-3">
                      <div className={menuIconClass(pathname === '/dashboard/notificacoes')}>
                        <Bell className="h-4 w-4" />
                      </div>
                      <span className="flex-1">Notificações</span>
                      {notificacoesNaoLidas > 0 ? (
                        <Badge className="flex h-5 min-w-[20px] items-center justify-center bg-sidebar-primary text-xs text-sidebar-primary-foreground">
                          {notificacoesNaoLidas}
                        </Badge>
                      ) : null}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {user?.cargo === 'admin' && (
          <SidebarGroup data-fy-anchor="fy-sidebar-admin" className="p-1.5">
            <SidebarGroupLabel className="h-7 min-h-[1.75rem] text-xs uppercase tracking-wider text-sidebar-foreground/55">
              Administração
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {adminMenuItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} className={menuButtonClass(isActive)}>
                        <Link href={item.href} className="flex items-center gap-3">
                          <div className={menuIconClass(isActive)}>
                            <item.icon className="h-4 w-4" />
                          </div>
                          <span className="flex-1">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="space-y-1 border-t border-sidebar-border p-1.5">
        <ThemeToggle variant="sidebar" className="rounded-lg" />
        <div className="flex items-center gap-2.5 rounded-xl bg-black/15 p-1.5 dark:bg-black/25">
          <Avatar className="h-9 w-9 ring-2 ring-white/15">
            <AvatarFallback className="bg-sidebar-accent text-sm font-semibold text-sidebar-foreground">
              {user?.nome ? getInitials(user.nome) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{user?.nome}</p>
            <p className="truncate text-xs capitalize text-sidebar-foreground/55">{user?.cargo}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

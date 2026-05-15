'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
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
import { motion } from 'framer-motion'
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

export function DashboardSidebar() {
  const { user, logout } = useAuth()
  const { getNotificacoesByUser } = useData()
  const pathname = usePathname()
  const router = useRouter()

  const notificacoesNaoLidas = user ? getNotificacoesByUser(user.id).filter(n => !n.lida).length : 0

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const userMenuItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Registrar Ponto',
      href: '/dashboard/ponto',
      icon: Clock,
    },
    {
      title: 'Histórico',
      href: '/dashboard/historico',
      icon: CalendarDays,
    },
    {
      title: 'Justificativas',
      href: '/dashboard/justificativas',
      icon: FileText,
    },
    {
      title: 'Notificações',
      href: '/dashboard/notificacoes',
      icon: Bell,
      badge: notificacoesNaoLidas > 0 ? notificacoesNaoLidas : null,
    },
  ]

  const adminMenuItems = [
    {
      title: 'Painel Admin',
      href: '/dashboard/admin',
      icon: ShieldCheck,
    },
    {
      title: 'Usuários',
      href: '/dashboard/admin/usuarios',
      icon: Users,
    },
    {
      title: 'Notificações',
      href: '/dashboard/admin/notificacoes',
      icon: Megaphone,
    },
    {
      title: 'Relatórios',
      href: '/dashboard/admin/relatorios',
      icon: FileBarChart2,
    },
    {
      title: 'Desafios',
      href: '/dashboard/admin/desafios',
      icon: Target,
    },
    {
      title: 'Configurações',
      href: '/dashboard/admin/configuracoes-ponto',
      icon: SlidersHorizontal,
    },
    {
      title: 'Justificativas',
      href: '/dashboard/admin/justificativas',
      icon: FileText,
    },
  ]

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const logoHref =
    user?.cargo === 'admin'
      ? '/dashboard/admin'
      : user?.cargo === 'gestor'
        ? '/dashboard/gestor'
        : '/dashboard'

  return (
    <Sidebar className="border-r border-[#31435f] [&_[data-sidebar=sidebar]]:!bg-gradient-to-b [&_[data-sidebar=sidebar]]:!from-[#24364e] [&_[data-sidebar=sidebar]]:!to-[#16263a]">
      <SidebarHeader className="border-b border-[#31435f] !gap-0 !p-0">
        <motion.div
          className="pontify-logo-shell mx-2 mb-0.5 mt-0.5"
          whileHover={{ scale: 1.03 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        >
          <div className="pontify-logo-shell-inner">
            <Link
              href={logoHref}
              className="pontify-logo-trigger flex flex-col outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#16263a]"
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
                  unoptimized
                />
                <span aria-hidden className="pontify-logo-shine pointer-events-none absolute inset-0 -translate-x-full" />
              </span>
              <PontifyDataFlowBrand variant="sidebar" />
            </Link>
          </div>
        </motion.div>
      </SidebarHeader>

      <SidebarContent className="gap-1.5 px-2 [&>[data-sidebar=group]:first-child]:pt-0">
        {user?.cargo === 'estagiario' && (
          <SidebarGroup data-fy-anchor="fy-sidebar-menu" className="p-1.5">
            <SidebarGroupLabel className="h-7 min-h-[1.75rem] text-[#9db0c9] text-xs uppercase tracking-wider">
              Menu Principal
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {userMenuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      className={`group relative py-1.5 transition-all duration-200 text-[#d7e2f2] ${pathname === item.href ? 'bg-[#344a64]' : 'hover:bg-[#31455f]'}`}
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <div
                          className={`p-1.5 rounded-lg transition-colors ${
                            pathname === item.href ? 'bg-[#2f73e0] text-white' : 'group-hover:bg-[#35506f] text-[#a8bbd4]'
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                        </div>
                        <span className="flex-1">{item.title}</span>
                        {item.badge && (
                          <Badge
                            variant="default"
                            className="bg-[#1f7ae0] text-white h-5 min-w-[20px] flex items-center justify-center text-xs animate-pulse"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {user?.cargo === 'gestor' && (
          <SidebarGroup data-fy-anchor="fy-sidebar-gestor" className="p-1.5">
            <SidebarGroupLabel className="h-7 min-h-[1.75rem] text-[#9db0c9] text-xs uppercase tracking-wider">
              Coordenação
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/dashboard/gestor' || pathname.startsWith('/dashboard/gestor/')}
                    className={`group relative py-1.5 transition-all duration-200 text-[#d7e2f2] ${pathname === '/dashboard/gestor' || pathname.startsWith('/dashboard/gestor/') ? 'bg-[#344a64]' : 'hover:bg-[#31455f]'}`}
                  >
                    <Link href="/dashboard/gestor" className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-lg transition-colors ${
                          pathname === '/dashboard/gestor' || pathname.startsWith('/dashboard/gestor/')
                            ? 'bg-[#2f73e0] text-white'
                            : 'group-hover:bg-[#35506f] text-[#a8bbd4]'
                        }`}
                      >
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="flex-1">Meus estagiários</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {user?.cargo === 'admin' && (
          <SidebarGroup data-fy-anchor="fy-sidebar-admin" className="p-1.5">
            <SidebarGroupLabel className="h-7 min-h-[1.75rem] text-[#9db0c9] text-xs uppercase tracking-wider">
              Administração
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      className={`group relative py-1.5 transition-all duration-200 text-[#d7e2f2] ${pathname === item.href ? 'bg-[#344a64]' : 'hover:bg-[#31455f]'}`}
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <div
                          className={`p-1.5 rounded-lg transition-colors ${
                            pathname === item.href ? 'bg-[#2f73e0] text-white' : 'group-hover:bg-[#35506f] text-[#a8bbd4]'
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                        </div>
                        <span className="flex-1">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-[#31435f] p-1.5">
        <div className="flex items-center gap-2.5 p-1.5 rounded-xl bg-[#1e3047]/80">
          <Avatar className="h-9 w-9 ring-2 ring-blue-200/30">
            <AvatarFallback className="bg-[#2d4565] text-[#dce8f8] text-sm font-semibold">
              {user?.nome ? getInitials(user.nome) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-semibold text-[#e6effa] truncate">{user?.nome}</span>
            <span className="text-xs text-[#8ea2bd] capitalize">
              {user?.cargo === 'admin'
                ? 'Administrador'
                : user?.cargo === 'gestor'
                  ? 'Gestor'
                  : 'Estagiário'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="shrink-0 text-[#9db0c9] hover:text-white hover:bg-[#35506f] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="sr-only">Sair</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

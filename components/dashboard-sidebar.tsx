'use client'

import Link from 'next/link'
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
  Sparkles,
} from 'lucide-react'
import { useFy } from '@/lib/fy-context'

export function DashboardSidebar() {
  const { user, logout } = useAuth()
  const { getNotificacoesByUser } = useData()
  const { restartOnboarding } = useFy()
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

  return (
    <Sidebar className="border-r border-[#31435f] [&_[data-sidebar=sidebar]]:!bg-gradient-to-b [&_[data-sidebar=sidebar]]:!from-[#24364e] [&_[data-sidebar=sidebar]]:!to-[#16263a]">
      <SidebarHeader className="border-b border-[#31435f]">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#2f73e0] text-white shadow-lg shadow-[#2f73e0]/30">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-white">PontoDigital</span>
            <span className="text-xs text-[#8ea2bd]">Gestão de Ponto</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {user?.cargo !== 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[#9db0c9] text-xs uppercase tracking-wider">
              Menu Principal
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {userMenuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      className={`group relative transition-all duration-200 text-[#d7e2f2] ${pathname === item.href ? 'bg-[#344a64]' : 'hover:bg-[#31455f]'}`}
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

        {user?.cargo === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[#9db0c9] text-xs uppercase tracking-wider">
              Administração
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      className={`group relative transition-all duration-200 text-[#d7e2f2] ${pathname === item.href ? 'bg-[#344a64]' : 'hover:bg-[#31455f]'}`}
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

      <SidebarFooter className="border-t border-[#31435f] p-2 space-y-2">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start gap-2 text-[#b8cce6] hover:text-white hover:bg-[#35506f] text-sm h-9 px-3"
          onClick={() => restartOnboarding()}
        >
          <Sparkles className="h-4 w-4 shrink-0 text-sky-300" />
          Tour com o Fy
        </Button>
        <div className="flex items-center gap-3 p-2 rounded-xl bg-[#1e3047]/80">
          <Avatar className="h-10 w-10 ring-2 ring-blue-200/30">
            <AvatarFallback className="bg-[#2d4565] text-[#dce8f8] text-sm font-semibold">
              {user?.nome ? getInitials(user.nome) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-semibold text-[#e6effa] truncate">{user?.nome}</span>
            <span className="text-xs text-[#8ea2bd] capitalize">
              {user?.cargo === 'admin' ? 'Administrador' : 'Estagiário'}
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

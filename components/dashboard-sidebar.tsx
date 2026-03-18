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
  Settings,
  LogOut,
  CalendarDays,
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
      icon: Settings,
    },
    {
      title: 'Usuários',
      href: '/dashboard/admin/usuarios',
      icon: Users,
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
    <Sidebar className="border-r-0 bg-gradient-to-b from-blue-800 via-blue-900 to-blue-950">
      <SidebarHeader className="border-b border-blue-700/50">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/30 text-white shadow-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-white">PontoDigital</span>
            <span className="text-xs text-blue-200/60">Gestão de Ponto</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-blue-300/60 text-xs uppercase tracking-wider">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="group relative transition-all duration-200 hover:bg-blue-700/50 text-white"
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-colors ${pathname === item.href ? 'bg-blue-500 text-white' : 'group-hover:bg-blue-600/50'}`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <Badge 
                          variant="default" 
                          className="bg-blue-500 text-white h-5 min-w-[20px] flex items-center justify-center text-xs animate-pulse"
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

        {user?.cargo === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-blue-300/60 text-xs uppercase tracking-wider">
              Administração
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      className="group relative transition-all duration-200 hover:bg-blue-700/50 text-white"
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg transition-colors ${pathname === item.href ? 'bg-blue-500 text-white' : 'group-hover:bg-blue-600/50'}`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-blue-700/50 p-2">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-blue-700/30">
          <Avatar className="h-10 w-10 ring-2 ring-blue-400/30">
            <AvatarFallback className="bg-blue-500 text-white text-sm font-semibold">
              {user?.nome ? getInitials(user.nome) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-semibold text-white truncate">{user?.nome}</span>
            <span className="text-xs text-blue-200/60 capitalize">
              {user?.cargo === 'admin' ? 'Administrador' : 'Estagiário'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="shrink-0 text-blue-200/70 hover:text-white hover:bg-blue-700/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="sr-only">Sair</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

import { Clock, LayoutDashboard, FileText, Bell, Users, CheckSquare, BarChart3, Settings, LogOut, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  roles: ('user' | 'admin')[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['user', 'admin'] },
  { label: 'Registrar Ponto', icon: Clock, path: '/registrar-ponto', roles: ['user'] },
  { label: 'Meu Histórico', icon: FileText, path: '/historico', roles: ['user'] },
  { label: 'Notificações', icon: Bell, path: '/notificacoes', roles: ['user', 'admin'] },
  { label: 'Usuários', icon: Users, path: '/admin/usuarios', roles: ['admin'] },
  { label: 'Aprovações', icon: CheckSquare, path: '/admin/aprovacoes', roles: ['admin'] },
  { label: 'Relatórios', icon: BarChart3, path: '/admin/relatorios', roles: ['admin'] },
  { label: 'Configurações', icon: Settings, path: '/admin/configuracoes', roles: ['admin'] },
];

export default function AppSidebar() {
  const { user, logout, switchRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const filteredItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 gradient-sidebar flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
          <Clock className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-sidebar-foreground">Ponto Digital</h1>
          <p className="text-xs text-sidebar-muted">Gestão de Frequência</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-4 space-y-2">
        <button
          onClick={() => switchRole(user.role === 'admin' ? 'user' : 'admin')}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <ArrowLeftRight size={14} />
          Trocar para {user.role === 'admin' ? 'Usuário' : 'Admin'}
        </button>

        <div className="flex items-center gap-3 px-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-primary">
            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
            <p className="text-xs text-sidebar-muted truncate">{user.role === 'admin' ? 'Administrador' : 'Estagiário'}</p>
          </div>
          <button onClick={logout} className="text-sidebar-muted hover:text-sidebar-foreground transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

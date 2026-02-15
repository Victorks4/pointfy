import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockUsers, mockTimeEntries, mockBalances } from '@/data/mockData';
import { formatHoursDecimal, formatBalance } from '@/utils/timeUtils';
import { Users, Clock, CheckSquare, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const totalUsers = mockUsers.length;
  const pendingEntries = mockTimeEntries.filter(e => e.status === 'pending').length;
  const todayEntries = mockTimeEntries.filter(e => e.date === '2026-02-15').length;
  const totalHoursMonth = mockBalances.reduce((sum, b) => sum + b.workedHours, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
        <p className="text-muted-foreground">Visão geral do sistema de frequência.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usuários</p>
                <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-warning">{pendingEntries}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Registros Hoje</p>
                <p className="text-2xl font-bold text-foreground">{todayEntries}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
                <Clock className="h-5 w-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Horas no Mês</p>
                <p className="text-2xl font-bold text-foreground">{formatHoursDecimal(totalHoursMonth)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-approved/10">
                <CheckSquare className="h-5 w-5 text-positive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users table + hour balance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Usuários Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockUsers.map(u => {
                const bal = mockBalances.find(b => b.userId === u.id);
                const isPos = (bal?.balance ?? 0) >= 0;
                return (
                  <div key={u.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.department} • {u.weeklyHours}h/sem</p>
                      </div>
                    </div>
                    {bal && (
                      <div className="flex items-center gap-1.5">
                        {isPos ? <TrendingUp className="h-4 w-4 text-positive" /> : <TrendingDown className="h-4 w-4 text-negative" />}
                        <span className={cn('text-sm font-semibold', isPos ? 'text-positive' : 'text-negative')}>
                          {formatBalance(bal.balance)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Aprovações Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockTimeEntries.filter(e => e.status === 'pending').map(e => {
                const u = mockUsers.find(u => u.id === e.userId);
                return (
                  <div key={e.id} className="flex items-center justify-between rounded-lg border border-pending/30 bg-pending/5 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{u?.name || 'Usuário'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {formatHoursDecimal(e.totalHours)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-md bg-approved/15 px-3 py-1.5 text-xs font-medium text-approved-foreground hover:bg-approved/25 transition-colors">
                        Aprovar
                      </button>
                      <button className="rounded-md bg-rejected/15 px-3 py-1.5 text-xs font-medium text-rejected-foreground hover:bg-rejected/25 transition-colors">
                        Rejeitar
                      </button>
                    </div>
                  </div>
                );
              })}
              {mockTimeEntries.filter(e => e.status === 'pending').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma aprovação pendente.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

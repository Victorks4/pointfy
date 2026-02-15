import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { mockTimeEntries, mockBalances, mockNotifications } from '@/data/mockData';
import { formatHoursDecimal, formatBalance } from '@/utils/timeUtils';
import { Clock, TrendingUp, TrendingDown, CalendarDays, Bell, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { label: 'Pendente', className: 'bg-pending/15 text-pending-foreground border-pending/30' },
    approved: { label: 'Aprovado', className: 'bg-approved/15 text-approved-foreground border-approved/30' },
    rejected: { label: 'Rejeitado', className: 'bg-rejected/15 text-rejected-foreground border-rejected/30' },
  }[status] || { label: status, className: '' };

  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}

export default function UserDashboard() {
  const { user } = useAuth();
  if (!user) return null;

  const entries = mockTimeEntries.filter(e => e.userId === user.id);
  const balance = mockBalances.find(b => b.userId === user.id);
  const notifications = mockNotifications.filter(n => !n.read);
  const today = entries.find(e => e.date === '2026-02-15');
  const isPositive = (balance?.balance ?? 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Olá, {user.name.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Acompanhe seu registro de ponto e saldo de horas.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Horas Hoje</p>
                <p className="text-2xl font-bold text-foreground">{today ? formatHoursDecimal(today.totalHours) : '--'}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Banco de Horas</p>
                <p className={cn('text-2xl font-bold', isPositive ? 'text-positive' : 'text-negative')}>
                  {balance ? formatBalance(balance.balance) : '--'}
                </p>
              </div>
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', isPositive ? 'bg-approved/10' : 'bg-rejected/10')}>
                {isPositive ? <TrendingUp className="h-5 w-5 text-positive" /> : <TrendingDown className="h-5 w-5 text-negative" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Horas no Mês</p>
                <p className="text-2xl font-bold text-foreground">{balance ? formatHoursDecimal(balance.workedHours) : '--'}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
                <CalendarDays className="h-5 w-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Notificações</p>
                <p className="text-2xl font-bold text-foreground">{notifications.length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                <Bell className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent entries + status */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Registros Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {entries.length === 0 && <p className="text-sm text-muted-foreground">Nenhum registro encontrado.</p>}
              {entries.slice(0, 5).map(entry => (
                <div key={entry.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
                      <p className="font-medium text-foreground">{new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.entry1 || '--'} → {entry.exit1 || '--'} | {entry.entry2 || '--'} → {entry.exit2 || '--'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">{formatHoursDecimal(entry.totalHours)}</span>
                    <StatusBadge status={entry.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Ponto de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            {today ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Entrada 1', value: today.entry1, icon: CheckCircle2 },
                    { label: 'Saída 1', value: today.exit1, icon: today.exit1 ? CheckCircle2 : AlertTriangle },
                    { label: 'Entrada 2', value: today.entry2, icon: today.entry2 ? CheckCircle2 : AlertTriangle },
                    { label: 'Saída 2', value: today.exit2, icon: today.exit2 ? CheckCircle2 : AlertTriangle },
                  ].map(item => (
                    <div key={item.label} className="rounded-lg border p-3 text-center">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-lg font-bold text-foreground">{item.value || '--:--'}</p>
                      <item.icon className={cn('mx-auto mt-1 h-4 w-4', item.value ? 'text-positive' : 'text-muted-foreground/40')} />
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total do Dia</p>
                  <p className="text-xl font-bold text-foreground">{formatHoursDecimal(today.totalHours)}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <XCircle className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum registro hoje.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

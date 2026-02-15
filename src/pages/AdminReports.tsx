import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockUsers, mockBalances, mockTimeEntries } from '@/data/mockData';
import { formatHoursDecimal, formatBalance } from '@/utils/timeUtils';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminReports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Visão consolidada de horas e banco de horas.</p>
        </div>
        <Button variant="outline" onClick={() => toast.info('Funcionalidade disponível com banco de dados.')}>
          <Download className="mr-2 h-4 w-4" /> Exportar
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Resumo Mensal — Fevereiro 2026</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Usuário</th>
                  <th className="pb-3 font-medium">Departamento</th>
                  <th className="pb-3 font-medium">Carga Semanal</th>
                  <th className="pb-3 font-medium">Horas Esperadas</th>
                  <th className="pb-3 font-medium">Horas Trabalhadas</th>
                  <th className="pb-3 font-medium">Saldo</th>
                  <th className="pb-3 font-medium">Registros</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map(u => {
                  const bal = mockBalances.find(b => b.userId === u.id);
                  const entries = mockTimeEntries.filter(e => e.userId === u.id).length;
                  const isPos = (bal?.balance ?? 0) >= 0;
                  return (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="font-medium text-foreground">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground">{u.department}</td>
                      <td className="py-3">{u.weeklyHours}h</td>
                      <td className="py-3">{bal ? formatHoursDecimal(bal.expectedHours) : '--'}</td>
                      <td className="py-3 font-semibold">{bal ? formatHoursDecimal(bal.workedHours) : '--'}</td>
                      <td className="py-3">
                        {bal ? (
                          <div className="flex items-center gap-1">
                            {isPos ? <TrendingUp className="h-3.5 w-3.5 text-positive" /> : <TrendingDown className="h-3.5 w-3.5 text-negative" />}
                            <span className={cn('font-semibold', isPos ? 'text-positive' : 'text-negative')}>{formatBalance(bal.balance)}</span>
                          </div>
                        ) : '--'}
                      </td>
                      <td className="py-3">{entries}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

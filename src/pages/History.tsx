import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { mockTimeEntries } from '@/data/mockData';
import { formatHoursDecimal } from '@/utils/timeUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { label: 'Pendente', className: 'bg-pending/15 text-pending-foreground border-pending/30' },
    approved: { label: 'Aprovado', className: 'bg-approved/15 text-approved-foreground border-approved/30' },
    rejected: { label: 'Rejeitado', className: 'bg-rejected/15 text-rejected-foreground border-rejected/30' },
  }[status] || { label: status, className: '' };
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}

export default function History() {
  const { user } = useAuth();
  const [month, setMonth] = useState('2026-02');
  if (!user) return null;

  const entries = mockTimeEntries.filter(e => e.userId === user.id && e.date.startsWith(month));
  const totalMonth = entries.reduce((sum, e) => sum + e.totalHours, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meu Histórico</h1>
          <p className="text-muted-foreground">Visualize seus registros de ponto.</p>
        </div>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2026-02">Fevereiro 2026</SelectItem>
            <SelectItem value="2026-01">Janeiro 2026</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Registros do Mês</CardTitle>
            <div className="rounded-lg bg-muted px-3 py-1.5">
              <span className="text-sm font-semibold text-foreground">Total: {formatHoursDecimal(totalMonth)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Data</th>
                  <th className="pb-3 font-medium">Entrada 1</th>
                  <th className="pb-3 font-medium">Saída 1</th>
                  <th className="pb-3 font-medium">Entrada 2</th>
                  <th className="pb-3 font-medium">Saída 2</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="py-3 font-medium text-foreground">
                      {new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' })}
                    </td>
                    <td className="py-3">{e.entry1 || '--'}</td>
                    <td className="py-3">{e.exit1 || '--'}</td>
                    <td className="py-3">{e.entry2 || '--'}</td>
                    <td className="py-3">{e.exit2 || '--'}</td>
                    <td className="py-3 font-semibold">{formatHoursDecimal(e.totalHours)}</td>
                    <td className="py-3"><StatusBadge status={e.status} /></td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Nenhum registro neste mês.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

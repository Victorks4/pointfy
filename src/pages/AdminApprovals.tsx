import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockTimeEntries, mockUsers } from '@/data/mockData';
import { formatHoursDecimal } from '@/utils/timeUtils';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { label: 'Pendente', className: 'bg-pending/15 text-pending-foreground border-pending/30' },
    approved: { label: 'Aprovado', className: 'bg-approved/15 text-approved-foreground border-approved/30' },
    rejected: { label: 'Rejeitado', className: 'bg-rejected/15 text-rejected-foreground border-rejected/30' },
  }[status] || { label: status, className: '' };
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}

export default function AdminApprovals() {
  const pending = mockTimeEntries.filter(e => e.status === 'pending');
  const others = mockTimeEntries.filter(e => e.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Aprovações</h1>
        <p className="text-muted-foreground">Gerencie os registros de ponto pendentes.</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Pendentes ({pending.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pending.map(e => {
              const u = mockUsers.find(u => u.id === e.userId);
              return (
                <div key={e.id} className="flex items-center justify-between rounded-lg border border-pending/30 bg-pending/5 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{u?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {e.entry1} → {e.exit1} | {e.entry2 || '--'} → {e.exit2 || '--'} • <span className="font-semibold">{formatHoursDecimal(e.totalHours)}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-approved/30 text-positive hover:bg-approved/10" onClick={() => toast.success('Registro aprovado!')}>
                      <Check className="mr-1 h-4 w-4" /> Aprovar
                    </Button>
                    <Button size="sm" variant="outline" className="border-rejected/30 text-negative hover:bg-rejected/10" onClick={() => toast.error('Registro rejeitado.')}>
                      <X className="mr-1 h-4 w-4" /> Rejeitar
                    </Button>
                  </div>
                </div>
              );
            })}
            {pending.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">Nenhum registro pendente.</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Histórico de Aprovações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Usuário</th>
                  <th className="pb-3 font-medium">Data</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {others.map(e => {
                  const u = mockUsers.find(u => u.id === e.userId);
                  return (
                    <tr key={e.id} className="border-b last:border-0">
                      <td className="py-3 font-medium text-foreground">{u?.name}</td>
                      <td className="py-3">{new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                      <td className="py-3 font-semibold">{formatHoursDecimal(e.totalHours)}</td>
                      <td className="py-3"><StatusBadge status={e.status} /></td>
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

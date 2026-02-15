import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Configure regras do sistema de ponto.</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-5 w-5 text-primary" />
            Regras de Preenchimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="font-medium text-foreground mb-1">Formato de Horário</p>
              <p>HH:MM — Decimal americano obrigatório</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium text-foreground mb-1">Horários Fechados</p>
              <p>Não permitidos (minutos ≠ 00)</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium text-foreground mb-1">Fechamento Mensal</p>
              <p>Mês anterior bloqueado automaticamente</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium text-foreground mb-1">Auditoria</p>
              <p>Todas alterações são registradas no log</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/60">
            Configurações avançadas estarão disponíveis com a integração do banco de dados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

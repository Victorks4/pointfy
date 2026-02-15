import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockNotifications } from '@/data/mockData';
import { Bell, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  alert: AlertCircle,
};

const colorMap = {
  info: 'text-info bg-info/10',
  warning: 'text-warning bg-warning/10',
  alert: 'text-destructive bg-destructive/10',
};

export default function Notifications() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
        <p className="text-muted-foreground">Comunicados e alertas do sistema.</p>
      </div>

      <div className="space-y-3">
        {mockNotifications.map(n => {
          const Icon = iconMap[n.type];
          return (
            <Card key={n.id} className={cn('shadow-card transition-all', !n.read && 'border-l-4 border-l-primary')}>
              <CardContent className="flex items-start gap-4 p-4">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', colorMap[n.type])}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{n.title}</h3>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    {new Date(n.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { validateTime, validateTimeSequence, calculateDailyHours, formatHoursDecimal } from '@/utils/timeUtils';
import { Clock, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TimeEntry() {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const [entry1, setEntry1] = useState('');
  const [exit1, setExit1] = useState('');
  const [entry2, setEntry2] = useState('');
  const [exit2, setExit2] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const fields = [
    { id: 'entry1', label: 'Entrada 1', value: entry1, setter: setEntry1 },
    { id: 'exit1', label: 'Saída 1', value: exit1, setter: setExit1 },
    { id: 'entry2', label: 'Entrada 2', value: entry2, setter: setEntry2 },
    { id: 'exit2', label: 'Saída 2', value: exit2, setter: setExit2 },
  ];

  const totalHours = calculateDailyHours(
    entry1 || null, exit1 || null, entry2 || null, exit2 || null
  );

  const handleSave = () => {
    const newErrors: Record<string, string> = {};

    // Validate individual times
    fields.forEach(f => {
      if (f.value) {
        const result = validateTime(f.value);
        if (!result.valid) newErrors[f.id] = result.error!;
      }
    });

    // At least entry1 required
    if (!entry1) newErrors.entry1 = 'Entrada 1 é obrigatória';

    // Validate sequence
    if (Object.keys(newErrors).length === 0) {
      const seq = validateTimeSequence(entry1 || null, exit1 || null, entry2 || null, exit2 || null);
      if (!seq.valid) {
        toast.error(seq.error);
        return;
      }
    }

    // Check paired entries
    if (entry2 && !exit1) newErrors.exit1 = 'Preencha Saída 1 antes de Entrada 2';
    if (exit2 && !entry2) newErrors.entry2 = 'Preencha Entrada 2 antes de Saída 2';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaved(true);
    toast.success('Ponto registrado com sucesso! Aguardando aprovação.');
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Registrar Ponto</h1>
        <p className="text-muted-foreground capitalize">{today}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-primary" />
              Horários do Dia
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Formato HH:MM — Horários fechados (ex: 08:00) não são permitidos.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {fields.map(f => (
                <div key={f.id} className="space-y-2">
                  <Label htmlFor={f.id}>{f.label}</Label>
                  <Input
                    id={f.id}
                    placeholder="08:15"
                    value={f.value}
                    onChange={e => { f.setter(e.target.value); setSaved(false); }}
                    className={errors[f.id] ? 'border-destructive' : ''}
                    disabled={saved}
                  />
                  {errors[f.id] && (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {errors[f.id]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="rounded-lg bg-muted px-4 py-2">
                <p className="text-xs text-muted-foreground">Total calculado</p>
                <p className="text-xl font-bold text-foreground">{formatHoursDecimal(totalHours)}</p>
              </div>
              <Button onClick={handleSave} disabled={saved} className="gradient-primary">
                {saved ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Registrado</> : <><Save className="mr-2 h-4 w-4" /> Salvar Ponto</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Rules card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Regras de Preenchimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 text-warning shrink-0" />
              <p>Formato HH:MM obrigatório</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 text-warning shrink-0" />
              <p>Horários "fechados" (minutos = 00) não são aceitos</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 text-warning shrink-0" />
              <p>Saída deve ser após a entrada</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 text-warning shrink-0" />
              <p>Sem sobreposição de horários</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 text-info shrink-0" />
              <p>Registros ficam pendentes até aprovação</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

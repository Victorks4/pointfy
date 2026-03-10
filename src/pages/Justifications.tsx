import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { mockJustifications } from '@/data/mockData';
import { FileText, Upload, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Justification } from '@/types';

const COMPENSADO_KEYWORDS = ['COMP', 'comp', 'compensado', 'Compensado'];

export default function Justifications() {
  const { user } = useAuth();
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [justifications, setJustifications] = useState<Justification[]>(mockJustifications);

  if (!user) return null;

  const userJustifications = justifications.filter(j => j.userId === user.id);

  const isCompensado = COMPENSADO_KEYWORDS.some(kw => description.includes(kw));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      toast.error('Selecione a data da justificativa.');
      return;
    }

    if (isCompensado) {
      // Compensado logic: abate 6h do banco
      const newJustification: Justification = {
        id: String(Date.now()),
        userId: user.id,
        date,
        type: 'compensado',
        description,
        createdAt: new Date().toISOString(),
      };
      setJustifications(prev => [newJustification, ...prev]);
      toast.success('Compensação registrada! 6h serão abatidas do banco de horas.');
      setDate('');
      setDescription('');
      return;
    }

    // Atestado logic
    if (!file) {
      toast.error('Anexe o atestado para justificar a falta.');
      return;
    }

    const newJustification: Justification = {
      id: String(Date.now()),
      userId: user.id,
      date,
      type: 'atestado',
      description,
      attachmentName: file.name,
      createdAt: new Date().toISOString(),
    };
    setJustifications(prev => [newJustification, ...prev]);
    toast.success('Atestado enviado com sucesso! O RH será notificado por e-mail.');
    setDate('');
    setDescription('');
    setFile(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Justificativas</h1>
        <p className="text-muted-foreground">Registre atestados ou compensações de horas.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-primary" />
              Nova Justificativa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="just-date">Data da Falta / Compensação</Label>
                <Input
                  id="just-date"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="just-desc">Descrição</Label>
                <Textarea
                  id="just-desc"
                  placeholder="Descreva o motivo ou escreva COMP para compensação..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                />
                {isCompensado && (
                  <div className="flex items-center gap-2 rounded-lg bg-info/10 p-3 text-sm text-info">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <p>Compensação detectada — 6h serão abatidas do banco de horas.</p>
                  </div>
                )}
              </div>

              {!isCompensado && (
                <div className="space-y-2">
                  <Label htmlFor="just-file">Anexar Atestado</Label>
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="just-file"
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex-1"
                    >
                      <Upload className="h-4 w-4" />
                      {file ? file.name : 'Clique para selecionar arquivo'}
                    </label>
                    <input
                      id="just-file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={e => setFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">PDF, JPG ou PNG (máx. 10MB)</p>
                </div>
              )}

              <div className="flex items-center gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>Atestados serão enviados automaticamente para o e-mail do RH.</p>
              </div>

              <Button type="submit" className="gradient-primary">
                <Send className="mr-2 h-4 w-4" />
                {isCompensado ? 'Registrar Compensação' : 'Enviar Atestado'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userJustifications.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma justificativa registrada.</p>
              )}
              {userJustifications.map(j => (
                <div key={j.id} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {new Date(j.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                    <Badge variant="outline" className={
                      j.type === 'atestado'
                        ? 'bg-info/15 text-info border-info/30'
                        : 'bg-approved/15 text-approved-foreground border-approved/30'
                    }>
                      {j.type === 'atestado' ? 'Atestado' : 'Compensado'}
                    </Badge>
                  </div>
                  {j.description && <p className="text-xs text-muted-foreground">{j.description}</p>}
                  {j.attachmentName && (
                    <p className="text-xs text-primary flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {j.attachmentName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

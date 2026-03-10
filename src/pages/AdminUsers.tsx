import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { mockUsers } from '@/data/mockData';
import { User } from '@/types';
import { UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [open, setOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ra, setRa] = useState('');
  const [department, setDepartment] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('30');
  const [cargo, setCargo] = useState('Estagiário');
  const [recessDate, setRecessDate] = useState('');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !ra || !department) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    const newUser: User = {
      id: String(Date.now()),
      name,
      email,
      role: 'user',
      department,
      weeklyHours: Number(weeklyHours),
      ra,
      cargo,
      recessStartDate: recessDate || undefined,
    };

    setUsers(prev => [...prev, newUser]);
    toast.success(`Usuário ${name} cadastrado com sucesso!`);
    setOpen(false);
    // Reset form
    setName('');
    setEmail('');
    setRa('');
    setDepartment('');
    setWeeklyHours('30');
    setCargo('Estagiário');
    setRecessDate('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os estagiários e horistas do sistema.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="new-name">Nome Completo *</Label>
                <Input id="new-name" value={name} onChange={e => setName(e.target.value)} placeholder="Nome do estagiário" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email">E-mail *</Label>
                <Input id="new-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@empresa.com" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-ra">RA *</Label>
                  <Input id="new-ra" value={ra} onChange={e => setRa(e.target.value)} placeholder="2024001" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-cargo">Cargo</Label>
                  <Select value={cargo} onValueChange={setCargo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Estagiário">Estagiário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-dept">Departamento *</Label>
                  <Input id="new-dept" value={department} onChange={e => setDepartment(e.target.value)} placeholder="Desenvolvimento" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-hours">Carga Horária Semanal</Label>
                  <Input id="new-hours" type="number" value={weeklyHours} onChange={e => setWeeklyHours(e.target.value)} min="1" max="44" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-recess">Data de Início do Recesso Remunerado</Label>
                <Input id="new-recess" type="date" value={recessDate} onChange={e => setRecessDate(e.target.value)} />
                <p className="text-xs text-muted-foreground">O estagiário não poderá registrar ponto durante 15 dias a partir desta data.</p>
              </div>
              <Button type="submit" className="w-full gradient-primary">
                <UserPlus className="mr-2 h-4 w-4" />
                Cadastrar Usuário
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            Lista de Usuários ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Nome</th>
                  <th className="pb-3 font-medium">E-mail</th>
                  <th className="pb-3 font-medium">RA</th>
                  <th className="pb-3 font-medium">Departamento</th>
                  <th className="pb-3 font-medium">Cargo</th>
                  <th className="pb-3 font-medium">Carga Horária</th>
                  <th className="pb-3 font-medium">Recesso</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  // Check if user is on recess
                  const isOnRecess = u.recessStartDate && (() => {
                    const start = new Date(u.recessStartDate + 'T00:00:00');
                    const end = new Date(start);
                    end.setDate(end.getDate() + 15);
                    const now = new Date();
                    return now >= start && now <= end;
                  })();

                  return (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="font-medium text-foreground">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground">{u.email}</td>
                      <td className="py-3">{u.ra || '—'}</td>
                      <td className="py-3">{u.department}</td>
                      <td className="py-3">{u.cargo || 'Estagiário'}</td>
                      <td className="py-3">{u.weeklyHours}h/semana</td>
                      <td className="py-3 text-xs">
                        {u.recessStartDate
                          ? new Date(u.recessStartDate + 'T12:00:00').toLocaleDateString('pt-BR')
                          : '—'}
                      </td>
                      <td className="py-3">
                        {isOnRecess ? (
                          <Badge variant="outline" className="bg-warning/15 text-warning border-warning/30">Em Recesso</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-approved/15 text-approved-foreground border-approved/30">Ativo</Badge>
                        )}
                      </td>
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

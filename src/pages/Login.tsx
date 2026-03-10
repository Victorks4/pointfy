import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, LogIn, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      navigate('/dashboard');
    } else {
      toast.error('Credenciais inválidas');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branded */}
      <div className="hidden lg:flex lg:w-[45%] gradient-primary relative flex-col items-center justify-center p-12 text-primary-foreground">
        {/* Decorative shapes */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-br-[80px]" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/5 rounded-tl-[100px]" />
        <div className="absolute top-1/4 right-8 w-16 h-16 bg-white/10 rounded-full" />
        
        <div className="relative z-10 text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm shadow-lg">
            <Clock className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Bem-vindo de volta!</h1>
          <p className="text-primary-foreground/80 max-w-xs mx-auto leading-relaxed">
            Acesse o sistema para gerenciar sua frequência e acompanhar suas horas de trabalho.
          </p>
          <div className="pt-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-5 py-2.5 text-sm font-medium">
              Ponto Digital
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg">
              <Clock className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Ponto Digital</h1>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Entrar no Sistema</h2>
            <p className="text-muted-foreground">Insira suas credenciais para acessar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full gradient-primary h-11 text-base" disabled={loading}>
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="rounded-xl border border-dashed bg-muted/50 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Credenciais de demonstração:</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><span className="font-medium text-foreground">Usuário:</span> maria@empresa.com</p>
              <p><span className="font-medium text-foreground">Admin:</span> admin@empresa.com</p>
              <p className="text-muted-foreground/70">(qualquer senha)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Clock, User, Lock, ArrowRight } from "lucide-react";
import { LoginLeftPanel } from "@/components/login-left-panel";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await login(email, senha);
      if (success) {
        const savedUser = sessionStorage.getItem("currentUser");
        const parsedUser = savedUser ? JSON.parse(savedUser) : null;
        if (parsedUser?.cargo === "admin") {
          router.push("/dashboard/admin");
        } else if (parsedUser?.cargo === "gestor") {
          router.push("/dashboard/gestor");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError("Email ou senha incorretos");
      }
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh w-full max-w-full flex-col lg:min-h-dvh lg:flex-row lg:items-stretch">
      <LoginLeftPanel mounted={mounted}>
        <div
          className={`mb-auto flex items-center gap-3 pt-8 transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "-translate-y-5 opacity-0"}`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
            <Clock className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">PONTIFY</span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h1
            className={`mb-4 text-4xl font-bold transition-all delay-200 duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}
          >
            Bem-vindo de volta!
          </h1>
          <p
            className={`mb-8 max-w-xs text-white/80 transition-all delay-300 duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}
          >
            Para continuar conectado conosco, faça login com suas credenciais
            pessoais
          </p>

          <div
            className={`rounded-xl bg-white/10 p-4 text-sm backdrop-blur-sm transition-all delay-400 duration-700 ${mounted ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
          >
            <p className="mb-2 font-medium">Credenciais de teste:</p>
            <div className="space-y-1 text-left text-white/90">
              <p>
                <span className="text-white/60">Admin:</span>{" "}
                admin@empresa.com / admin123
              </p>
              <p>
                <span className="text-white/60">Estagiário:</span>{" "}
                estagiario@empresa.com / est123
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8" />
      </LoginLeftPanel>

      {/* Painel Direito - Formulário */}
      <div className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-background p-8 lg:min-h-0">
        <div
          className={`w-full max-w-md transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}
        >
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white">
              <Clock className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl text-black">Pontify</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-black mb-2">
              Entrar na Conta
            </h2>
            <p className="text-gray-500">
              Digite suas credenciais para acessar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email" className="text-gray-700">
                  Email
                </FieldLabel>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-black" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 text-base border-2 border-gray-200 transition-all focus:border-gray-500 focus:ring-gray-500/20"
                    required
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="senha" className="text-gray-700">
                  Senha
                </FieldLabel>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-black" />
                  <Input
                    id="senha"
                    type="password"
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="pl-12 h-12 text-base border-2 border-gray-200 transition-all focus:border-gray-500 focus:ring-gray-500/20"
                    required
                  />
                </div>
              </Field>
            </FieldGroup>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive text-center">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
            <Image
              src="/fy-mascote.png"
              alt="Fy, guia do Pontify"
              width={44}
              height={44}
              className="shrink-0 object-contain"
            />
            <p className="text-sm text-blue-950/85 leading-snug text-left">
              Depois do login, o <strong>Fy</strong> aparece no canto da tela com dicas em um balão — sem janelas extras.
            </p>
          </div>

          {/* Info mobile */}
          <div className="lg:hidden mt-8 p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground text-center mb-2">
              Credenciais de teste:
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="text-center">
                <strong>Admin:</strong> admin@empresa.com / admin123
              </p>
              <p className="text-center">
                <strong>Estagiário:</strong> estagiario@empresa.com / est123
              </p>
              <p className="text-center">
                <strong>Gestor:</strong> gestor@empresa.com / gestor123
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

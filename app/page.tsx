"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Clock, User, Lock, ArrowRight } from "lucide-react";

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
        router.push("/dashboard");
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
    <main className="min-h-screen flex">
      {/* Painel Esquerdo - Decorativo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        {/* Elementos decorativos geométricos */}
        <div className="absolute inset-0">
          {/* Quadrado rotacionado superior esquerdo */}
          <div
            className={`absolute -top-10 -left-10 w-32 h-32 border-2 border-white/20 rotate-45 transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"}`}
          />

          {/* Quadrado rotacionado meio esquerdo */}
          <div
            className={`absolute top-1/4 left-10 w-20 h-20 border-2 border-white/30 rotate-12 transition-all duration-1000 delay-200 ${mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
          />

          {/* Losango inferior esquerdo */}
          <div
            className={`absolute bottom-20 left-20 w-16 h-16 bg-white/10 rotate-45 transition-all duration-1000 delay-400 ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
          />

          {/* Quadrado grande inferior */}
          <div
            className={`absolute -bottom-20 left-1/3 w-40 h-40 border-2 border-white/15 rotate-45 transition-all duration-1000 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          />

          {/* Círculo decorativo */}
          <div
            className={`absolute top-1/3 right-10 w-24 h-24 rounded-full border-2 border-white/20 transition-all duration-1000 delay-500 ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
          />
        </div>

        {/* Conteúdo do painel esquerdo */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
          {/* Logo */}
          <div
            className={`flex items-center gap-3 mb-auto pt-8 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-5"}`}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm">
              <Clock className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg">PONTIFY</span>
          </div>

          {/* Texto de boas-vindas */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h1
              className={`text-4xl font-bold mb-4 transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
            >
              Bem-vindo de volta!
            </h1>
            <p
              className={`text-white/80 max-w-xs mb-8 transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
            >
              Para continuar conectado conosco, faça login com suas credenciais
              pessoais
            </p>

            {/* Informações de teste */}
            <div
              className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 text-sm transition-all duration-700 delay-400 ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
            >
              <p className="font-medium mb-2">Credenciais de teste:</p>
              <div className="space-y-1 text-white/90 text-left">
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
        </div>
      </div>

      {/* Painel Direito - Formulário */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
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
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { LoginBrandLoader } from "@/components/login-brand-loader";
import { PontifyDataFlowBrand } from "@/components/pontify-data-flow-brand";
import { User, Lock, ArrowRight } from "lucide-react";
import { LoginLeftPanel } from "@/components/login-left-panel";
import {
  LOGIN_SYNC_TRANSITION,
  LoginAmbientProvider,
} from "@/lib/login-ambient-context";

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
    <LoginAmbientProvider submitting={isLoading}>
      <main className="flex min-h-dvh w-full max-w-full flex-col lg:min-h-dvh lg:flex-row lg:items-stretch">
        <LoginLeftPanel mounted={mounted}>
          <div className="pointer-events-none min-h-dvh flex-1 select-none lg:min-h-0" aria-hidden />
        </LoginLeftPanel>

        <div className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-background p-8 lg:min-h-0">
          <div
            className={`w-full max-w-md transition-all duration-700 delay-200 ${mounted ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"}`}
          >
            <div className="mb-10 flex lg:hidden justify-center px-2">
              <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white px-4 py-3.5 shadow-lg shadow-black/10">
                <PontifyDataFlowBrand variant="inline" />
              </div>
            </div>

            <div className="mb-8 text-center">
              <h2 className="mb-2 text-2xl font-bold text-black">
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
                  <div className="group relative">
                    <User className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-black" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 border-2 border-gray-200 pl-12 text-base transition-all focus:border-gray-500 focus:ring-gray-500/20"
                      required
                    />
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="senha" className="text-gray-700">
                    Senha
                  </FieldLabel>
                  <div className="group relative">
                    <Lock className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-black" />
                    <Input
                      id="senha"
                      type="password"
                      placeholder="Digite sua senha"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="h-12 border-2 border-gray-200 pl-12 text-base transition-all focus:border-gray-500 focus:ring-gray-500/20"
                      required
                    />
                  </div>
                </Field>
              </FieldGroup>

              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                  <p className="text-center text-sm text-destructive">
                    {error}
                  </p>
                </div>
              )}

              <motion.div
                className="w-full"
                animate={
                  isLoading
                    ? {
                        scale: [1, 1.018, 1],
                        filter: [
                          "brightness(1) drop-shadow(0 11px 20px rgb(59 130 246 / .22))",
                          "brightness(1.08) drop-shadow(0 15px 32px rgb(96 165 250 / .38))",
                          "brightness(1) drop-shadow(0 11px 20px rgb(59 130 246 / .22))",
                        ],
                      }
                    : { scale: 1 }
                }
                transition={
                  isLoading
                    ? LOGIN_SYNC_TRANSITION.pulse
                    : { type: "spring", stiffness: 520, damping: 32 }
                }
                whileHover={!isLoading ? { scale: 1.02 } : undefined}
                whileTap={!isLoading ? { scale: 0.986 } : undefined}
              >
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full cursor-pointer border border-blue-500/34 bg-gradient-to-br from-[#2875f0] to-[#2061d9] text-base font-semibold text-white shadow-[0_10px_32px_-8px_rgb(41_104_230_/_0.55)] transition-[box-shadow,color] hover:from-[#2e7efb] hover:to-[#2567ea] hover:shadow-[0_14px_36px_-6px_rgb(41_104_230_/_0.62)]"
                >
                  {isLoading ? (
                    <>
                      <LoginBrandLoader />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="ml-2 h-5 w-5 shrink-0" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            <div className="mt-6 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
              <Image
                src="/fy-mascote.png"
                alt="Fy, guia do Pontify"
                width={44}
                height={44}
                className="shrink-0 object-contain"
              />
              <p className="text-left text-sm leading-snug text-blue-950/85">
                Depois do login, o <strong>Fy</strong> aparece no canto da tela com dicas em um balão — sem janelas extras.
              </p>
            </div>

          </div>
        </div>
      </main>
    </LoginAmbientProvider>
  );
}

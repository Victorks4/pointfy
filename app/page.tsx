"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { signInAction } from "@/app/actions/auth";
import { useAuth } from "@/lib/auth-context";
import { navigateAfterLogin } from "@/lib/post-login-nav";
import { prefetchDashboardData } from "@/lib/data-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { LoginBrandLoader } from "@/components/login-brand-loader";
import { PontifyDataFlowBrand } from "@/components/pontify-data-flow-brand";
import { User, Lock, ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";

const LoginLeftPanel = dynamic(
  () => import("@/components/login-left-panel").then((m) => ({ default: m.LoginLeftPanel })),
  {
    ssr: false,
    loading: () => (
      <div className="login-left-panel min-h-[42vh] w-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 lg:min-h-dvh" />
    ),
  },
);
import { GsapLoginEntrance } from "@/components/gsap-login-entrance";
import {
  LOGIN_SYNC_TRANSITION,
  LoginAmbientProvider,
} from "@/lib/login-ambient-context";

function useIsDesktopLoginPanel() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setShow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return show;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const showLoginPanel = useIsDesktopLoginPanel();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (searchParams.get("error") === "auth") {
      setError("Não foi possível concluir o login. Tente novamente com email e senha.");
    }
  }, [searchParams]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (authLoading || isLoading || !user) return;
    navigateAfterLogin(user.cargo);
  }, [user, authLoading, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signInAction(email, senha);
      if (result.ok) {
        prefetchDashboardData();
        navigateAfterLogin(result.cargo);
        return;
      }
      setError(result.error || "Email ou senha incorretos. Tente novamente.");
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Verificando sessão...</p>
      </div>
    );
  }

  return (
    <LoginAmbientProvider submitting={isLoading}>
      <GsapLoginEntrance>
      <main className="login-page flex min-h-dvh w-full max-w-full flex-col lg:min-h-dvh lg:flex-row lg:items-stretch">
        {showLoginPanel ? (
          <div
            data-gsap-login-panel
            className="login-page-panel relative w-full shrink-0 overflow-hidden lg:min-h-dvh lg:min-w-0 lg:flex-1 lg:basis-0"
          >
            <LoginLeftPanel />
          </div>
        ) : null}

        <div
          data-gsap-login-form
          className="login-page-form flex min-h-dvh w-full flex-1 flex-col items-center justify-center bg-background p-6 sm:p-8 lg:min-h-dvh lg:min-w-0 lg:flex-1 lg:basis-0"
        >
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
                    <User className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-black" aria-hidden />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="neon-input-glow h-12 border-2 border-gray-200 pl-12 text-base transition-all focus:border-gray-500 focus:ring-gray-500/20"
                      required
                    />
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="senha" className="text-gray-700">
                    Senha
                  </FieldLabel>
                  <div className="group relative">
                    <Lock className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-black" aria-hidden />
                    <Input
                      id="senha"
                      type="password"
                      placeholder="Digite sua senha"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="neon-input-glow h-12 border-2 border-gray-200 pl-12 text-base transition-all focus:border-gray-500 focus:ring-gray-500/20"
                      required
                    />
                  </div>
                </Field>
              </FieldGroup>

              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3" role="alert">
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
                  aria-busy={isLoading}
                  className="neon-login-submit h-12 w-full cursor-pointer border border-blue-500/34 bg-gradient-to-br from-[#2875f0] to-[#2061d9] text-base font-semibold text-white transition-[box-shadow,color] hover:from-[#2e7efb] hover:to-[#2567ea]"
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

            <div className="mt-6 flex items-center gap-3 rounded-xl border border-cyan-200/80 bg-blue-50/60 p-3 shadow-[0_0_20px_-8px_var(--neon-glow-cyan)] dark:border-cyan-500/40 dark:bg-[#1a2d44] dark:shadow-[0_0_20px_-8px_var(--neon-glow-cyan)]">
              <Image
                src="/fy-mascote.png"
                alt="Fy, guia do Pontify"
                width={44}
                height={44}
                className="shrink-0 object-contain"
              />
              <p className="text-left text-sm leading-snug text-blue-950/85 dark:text-slate-100">
                Depois do login, o <strong>Fy</strong> aparece no canto da tela com dicas em um balão, sem janelas extras.
              </p>
            </div>

          </div>
        </div>
      </main>
      </GsapLoginEntrance>
    </LoginAmbientProvider>
  );
}

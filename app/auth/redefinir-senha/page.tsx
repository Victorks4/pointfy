'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { completePasswordResetAction } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { toast } from 'sonner'

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session))
      setCheckingSession(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (senha !== confirmacao) {
      toast.error('As senhas não coincidem')
      return
    }

    setLoading(true)
    const result = await completePasswordResetAction(senha, confirmacao)
    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success('Senha alterada com sucesso')
    router.replace('/?reset=success')
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-6">
        <p className="text-sm text-muted-foreground">Verificando link...</p>
      </div>
    )
  }

  if (!hasSession) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Link inválido ou expirado</CardTitle>
            <CardDescription>
              Solicite um novo link de recuperação de senha para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/auth/esqueci-senha">Solicitar novo link</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Voltar ao login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Redefinir senha</CardTitle>
          <CardDescription>Defina uma nova senha para acessar sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="nova-senha">Nova senha</FieldLabel>
                <Input
                  id="nova-senha"
                  type="password"
                  autoComplete="new-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  minLength={6}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirmar-senha">Confirmar senha</FieldLabel>
                <Input
                  id="confirmar-senha"
                  type="password"
                  autoComplete="new-password"
                  value={confirmacao}
                  onChange={(e) => setConfirmacao(e.target.value)}
                  minLength={6}
                  required
                />
              </Field>
              <Button type="submit" className="w-full" disabled={loading} aria-busy={loading}>
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

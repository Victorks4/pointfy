'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { changePasswordAction } from '@/app/actions/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { toast } from 'sonner'

export default function AlterarSenhaPage() {
  const router = useRouter()
  const { user, retryProfileLoad, hydrateUser } = useAuth()
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (senha !== confirmacao) {
      toast.error('As senhas não coincidem')
      return
    }
    setLoading(true)
    const result = await changePasswordAction(senha, confirmacao)
    setLoading(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Senha alterada com sucesso')
    if (user) hydrateUser({ ...user, mustChangePassword: false })
    await retryProfileLoad()
    router.refresh()
    router.replace('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
          <CardDescription>
            {user?.nome ? `Olá, ${user.nome}. ` : ''}
            Defina uma nova senha para continuar usando o sistema.
          </CardDescription>
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
                {loading ? 'Salvando...' : 'Salvar e continuar'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

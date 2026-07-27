'use client'

import { useState } from 'react'
import Link from 'next/link'
import { requestPasswordResetAction } from '@/app/actions/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { ArrowLeft, Mail } from 'lucide-react'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await requestPasswordResetAction(email)
    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setSubmitted(true)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Recuperar senha</CardTitle>
          <CardDescription>
            Informe o e-mail da sua conta. Enviaremos um link para redefinir a senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-4" role="status">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Caso exista uma conta vinculada a este e-mail, enviamos um link para redefinição de senha.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                  Voltar ao login
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="recovery-email">E-mail</FieldLabel>
                  <div className="relative">
                    <Mail
                      className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="recovery-email"
                      type="email"
                      autoComplete="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </Field>
              </FieldGroup>

              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}

              <Button type="submit" className="w-full" disabled={loading} aria-busy={loading}>
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </Button>

              <Button asChild variant="ghost" className="w-full">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                  Voltar ao login
                </Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

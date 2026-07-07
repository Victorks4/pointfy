import type { User } from '@/lib/types'
import { emptyLabel } from '@/lib/display-utils'

export function collectGestorIds(usuario: Pick<User, 'gestorId' | 'gestorIds'>): string[] {
  const ids = new Set<string>()
  if (usuario.gestorId) ids.add(usuario.gestorId)
  for (const id of usuario.gestorIds ?? []) ids.add(id)
  return [...ids]
}

export function getGestorNomes(usuario: Pick<User, 'gestorId' | 'gestorIds'>, usuarios: User[]): string {
  const nomes = collectGestorIds(usuario)
    .map((id) => usuarios.find((x) => x.id === id)?.nome)
    .filter((nome): nome is string => Boolean(nome?.trim()))
  return nomes.length > 0 ? nomes.join(', ') : emptyLabel(null)
}

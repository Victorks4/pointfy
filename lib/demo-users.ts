import type { User } from '@/lib/types'

/**
 * Usuários seed para demo no front (auth + data compartilham a mesma lista).
 * Senhas ficam só para o fluxo de login mock — trocar por API depois.
 */
export const DEMO_USERS_SEED: User[] = [
  {
    id: '1',
    email: 'admin@empresa.com',
    ra: 'ADM001',
    nome: 'Administrador',
    cargo: 'admin',
    departamento: 'RH',
    cargaHorariaSemanal: 2400,
    dataInicioRecesso: null,
    dataFimRecesso: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'estagiario@empresa.com',
    ra: 'EST001',
    nome: 'João Silva',
    cargo: 'estagiario',
    departamento: 'TI',
    cargaHorariaSemanal: 1800,
    dataInicioRecesso: null,
    dataFimRecesso: null,
    createdAt: new Date().toISOString(),
    gestorId: '3',
  },
  {
    id: '3',
    email: 'gestor@empresa.com',
    ra: 'GES001',
    nome: 'Maria Gestora',
    cargo: 'gestor',
    departamento: 'TI',
    cargaHorariaSemanal: 2400,
    dataInicioRecesso: null,
    dataFimRecesso: null,
    createdAt: new Date().toISOString(),
  },
]

const DEMO_PASSWORD_BY_EMAIL: Record<string, string> = {
  'admin@empresa.com': 'admin123',
  'estagiario@empresa.com': 'est123',
  'gestor@empresa.com': 'gestor123',
}

export function cloneDemoUsersForDataState(): User[] {
  return DEMO_USERS_SEED.map((user) => ({ ...user }))
}

export function findDemoLoginUser(email: string, senha: string): User | null {
  if (DEMO_PASSWORD_BY_EMAIL[email] !== senha) return null
  const found = DEMO_USERS_SEED.find((u) => u.email === email)
  return found ? { ...found } : null
}

/**
 * @deprecated Usuários demo agora vivem no Supabase Auth.
 * Use `npm run db:seed` após configurar .env.local e rodar as migrations.
 */
export const DEMO_LOGIN_HINT = {
  admin: { email: 'admin@empresa.com', senha: 'admin123' },
  estagiario: { email: 'estagiario@empresa.com', senha: 'est123' },
  gestor: { email: 'gestor@empresa.com', senha: 'gestor123' },
} as const

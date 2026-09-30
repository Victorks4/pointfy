-- Zera dados operacionais dos ESTAGIARIOS (presenca, saldo, justificativas, desafios).
-- Mantem: auth.users, profiles, gestores, admins, configs, feriados, desafios_semanais.
-- Preferir: npm run db:reset-estagiarios-ops  e  npm run db:reset-estagiarios-ops -- --confirm

SELECT 'estagiarios' AS item, COUNT(*)::bigint AS qtd FROM profiles WHERE cargo = 'estagiario'
UNION ALL
SELECT 'ponto_registros', COUNT(*) FROM ponto_registros pr
  JOIN profiles p ON p.id = pr.user_id WHERE p.cargo = 'estagiario'
UNION ALL
SELECT 'justificativas', COUNT(*) FROM justificativas j
  JOIN profiles p ON p.id = j.user_id WHERE p.cargo = 'estagiario'
UNION ALL
SELECT 'desafio_progressos', COUNT(*) FROM desafio_progressos dp
  JOIN profiles p ON p.id = dp.user_id WHERE p.cargo = 'estagiario'
UNION ALL
SELECT 'bloqueios_presenca', COUNT(*) FROM bloqueios_presenca b
  JOIN profiles p ON p.id = b.user_id WHERE p.cargo = 'estagiario'
UNION ALL
SELECT 'notificacoes_pessoais', COUNT(*) FROM notificacoes n
  JOIN profiles p ON p.id = n.user_id WHERE p.cargo = 'estagiario'
UNION ALL
SELECT 'notificacao_leituras', COUNT(*) FROM notificacao_leituras nl
  JOIN profiles p ON p.id = nl.user_id WHERE p.cargo = 'estagiario';
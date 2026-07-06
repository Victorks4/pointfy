-- Feriado de 2 de julho — Independência da Bahia (comum no calendário FIEB/SENAI-BA)
INSERT INTO feriados (data, nome, tipo, recorrente) VALUES
  ('2026-07-02', 'Independência da Bahia', 'municipal', true)
ON CONFLICT (data) DO NOTHING;

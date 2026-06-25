# Performance e Core Web Vitals — Pointfy

## Medir LCP, INP e CLS

| Métrica | O que é | Meta (boa) |
|---------|---------|------------|
| **LCP** | Maior elemento visível carregado | ≤ 2,5 s |
| **INP** | Responsividade a cliques/toques | ≤ 200 ms |
| **CLS** | Estabilidade visual (layout shift) | ≤ 0,1 |

### Passo a passo (local, produção)

```bash
npm run build
npm run start
```

1. Abra `http://localhost:3000`, `/dashboard`, `/dashboard/ponto`.
2. Chrome DevTools → **Lighthouse** → Performance (Mobile e Desktop).
3. DevTools → **Performance** → grave interação (salvar presença, abrir select).
4. Extensão [Web Vitals](https://chrome.google.com/webstore/detail/web-vitals) para INP/LCP em tempo real.

### Instrumentação em dev

Com `NODE_ENV=development`, métricas são logadas no console via `lib/web-vitals.ts` (carregado em `app/layout.tsx`).

### Produção (Vercel)

- `@vercel/analytics` já está no layout.
- Opcional: adicionar `@vercel/speed-insights` para RUM de CWV em produção.

---

## Análise de bundle

```bash
# Após build
npm run build
npm run analyze

# Build + análise
npm run analyze:build

# Relatório HTML interativo (webpack-bundle-analyzer)
npm run analyze:visual
```

Saída JSON: `reports/bundle-summary.json`.

---

## Otimizações aplicadas no projeto

- **Carga inicial do dashboard** em um único request (`GET /api/v1/data` → `loadDashboardSnapshot`).
- **Refresh incremental** após mutações (`refreshPontos` / `refreshJustificativas` em vez de refetch completo).
- **Cache server** para dados semi-estáticos via `unstable_cache` + `revalidateTag` em ações admin.
- **Middleware enxuto** — matcher apenas em `/` e `/dashboard/:path*`.
- **LiveClock** isolado nas páginas de presença e home do dashboard (evita re-render da página a cada 1s).
- **Fy** carregado com `next/dynamic`; guia mascote após primeiro paint ou tour ativo.
- Páginas pesadas (`ponto`, `gestor`, `admin/usuarios`) com `dynamic()` para code-splitting.
- **jspdf** importado só no clique em Relatórios.
- **FyChromaVideo** pausa `requestAnimationFrame` com aba oculta ou `prefers-reduced-motion`.
- **loading.tsx** nas rotas do dashboard.
- Imagens com `next/image` e otimização habilitada em `next.config.mjs`.
- Dependências mortas removidas (`three`, `@react-three/*`, `bcryptjs`, `recharts`).

---

## Baseline (após otimizações — medição local)

Build: `npm run build` — OK (Next.js 16.1.6).

Bundle (`npm run analyze`): ~2,36 MB bruto / ~722 KB gzip (chunks estáticos). jspdf não entra no chunk inicial do dashboard (import dinâmico em Relatórios).

| Rota | LCP | INP | CLS | Performance Lighthouse |
|------|-----|-----|-----|----------------------|
| `/` (login) | medir | medir | medir | medir |
| `/dashboard` | medir | medir | medir | medir |
| `/dashboard/ponto` | medir | medir | medir | medir |

Para métricas de campo: `npm run start` → Lighthouse no Chrome (ver seção acima). Em dev, CWV aparecem no console via `WebVitalsReporter`.

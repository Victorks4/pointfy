import { test, expect } from '@playwright/test'

test.describe('Autenticação', () => {
  test.skip(!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD, 'Defina E2E_EMAIL e E2E_PASSWORD')

  test('login estagiário carrega dashboard', async ({ page }) => {
    await page.goto('/')
    await page.fill('#email', process.env.E2E_EMAIL!)
    await page.fill('#senha', process.env.E2E_PASSWORD!)
    await page.getByRole('button', { name: /entrar/i }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    await expect(page.locator('body')).not.toContainText('Carregando dados...', { timeout: 15000 })
  })

  test('F5 mantém sessão no dashboard', async ({ page }) => {
    await page.goto('/')
    await page.fill('#email', process.env.E2E_EMAIL!)
    await page.fill('#senha', process.env.E2E_PASSWORD!)
    await page.getByRole('button', { name: /entrar/i }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    await page.reload()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
  })

  test('logout volta ao login', async ({ page }) => {
    await page.goto('/')
    await page.fill('#email', process.env.E2E_EMAIL!)
    await page.fill('#senha', process.env.E2E_PASSWORD!)
    await page.getByRole('button', { name: /entrar/i }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    await page.getByRole('button', { name: /sair/i }).click()
    await page.waitForURL('/', { timeout: 15000 })
    await expect(page.getByRole('heading', { name: /entrar na conta/i })).toBeVisible()
  })
})

test.describe('Controle de acesso', () => {
  test.skip(!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD, 'Defina E2E_EMAIL e E2E_PASSWORD')

  test('estagiário não acessa admin', async ({ page }) => {
    await page.goto('/')
    await page.fill('#email', process.env.E2E_EMAIL!)
    await page.fill('#senha', process.env.E2E_PASSWORD!)
    await page.getByRole('button', { name: /entrar/i }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    await page.goto('/dashboard/admin')
    await expect(page).not.toHaveURL(/\/dashboard\/admin$/, { timeout: 10000 })
  })
})

test.describe('Login admin', () => {
  test.skip(
    !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
    'Defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD',
  )

  test('admin redireciona para /dashboard/admin', async ({ page }) => {
    await page.goto('/')
    await page.fill('#email', process.env.E2E_ADMIN_EMAIL!)
    await page.fill('#senha', process.env.E2E_ADMIN_PASSWORD!)
    await page.getByRole('button', { name: /entrar/i }).click()
    await page.waitForURL(/\/dashboard\/admin/, { timeout: 15000 })
  })
})

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $here "migrate.env"
if (-not (Test-Path $envFile)) { Write-Error "Crie migrate.env a partir de migrate.env.example" }
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') { Set-Item -Path "Env:$($matches[1].Trim())" -Value $matches[2].Trim() }
}
$legacy = $env:LEGACY_DATABASE_URL
if (-not $legacy) { Write-Error "LEGACY_DATABASE_URL ausente" }
$out = Join-Path $here "out"
New-Item -ItemType Directory -Force -Path $out | Out-Null
Write-Host "Exportando auth..."
pg_dump $legacy --data-only --column-inserts --table=auth.users --table=auth.identities -f (Join-Path $out "auth_users.sql")
$tables = @("profiles","estagiario_gestores","ponto_registros","justificativas","bloqueios_presenca","notificacoes","notificacao_leituras","desafios_semanais","desafio_progressos","ponto_configs","feriados","horario_trabalho")
$args = $tables | ForEach-Object { "--table=public.$_" }
Write-Host "Exportando public..."
pg_dump $legacy --data-only --column-inserts @args -f (Join-Path $out "public_data.sql")
Write-Host "OK: scripts/db/out/"

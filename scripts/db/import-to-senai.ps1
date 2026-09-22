$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $here "migrate.env"
if (-not (Test-Path $envFile)) { Write-Error "Crie migrate.env" }
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') { Set-Item -Path "Env:$($matches[1].Trim())" -Value $matches[2].Trim() }
}
$target = $env:TARGET_DATABASE_URL
$out = Join-Path $here "out"
psql $target -v ON_ERROR_STOP=1 -f (Join-Path $out "auth_users.sql")
psql $target -v ON_ERROR_STOP=1 -f (Join-Path $out "public_data.sql")
Write-Host "Import concluido."

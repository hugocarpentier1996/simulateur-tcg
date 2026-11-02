@echo off
rem Lance la table de jeu (Docker Desktop requis) puis ouvrir http://127.0.0.1:5173/
cd /d "%~dp0"
docker info >nul 2>&1
if errorlevel 1 (
  echo Demarrage de Docker Desktop...
  start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  :attente
  timeout /t 3 >nul
  docker info >nul 2>&1
  if errorlevel 1 goto attente
)
docker compose run --rm --service-ports dev sh -c "pnpm install --frozen-lockfile --store-dir /pnpm/store && pnpm dev --host 0.0.0.0"
pause

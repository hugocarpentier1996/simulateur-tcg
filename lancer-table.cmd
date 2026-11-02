@echo off
rem Lance la table de jeu (Docker Desktop requis) puis ouvrir http://127.0.0.1:5173/
cd /d "%~dp0"
docker info >/dev/null 2>&1 && goto pret
echo Demarrage de Docker Desktop...
if exist "%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe" (start "" "%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe") else (start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe")
:attente
timeout /t 3 >nul
docker info >/dev/null 2>&1 || goto attente
:pret
docker compose run --rm --service-ports dev sh -c "pnpm install --frozen-lockfile --store-dir /pnpm/store && pnpm dev --host 0.0.0.0"
pause

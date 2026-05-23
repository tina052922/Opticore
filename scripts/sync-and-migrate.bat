@echo off
cd /d "%~dp0.."
git pull origin main
call npx prisma generate
call npx prisma migrate deploy
echo Done.

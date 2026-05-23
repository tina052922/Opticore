@echo off
cd /d "%~dp0.."
echo Aborting merge if any...
git merge --abort 2>nul
echo Fetching origin/main...
git fetch origin main
echo Resetting to GitHub main...
git reset --hard origin/main
echo Removing .next build folder...
if exist .next rmdir /s /q .next
git checkout -- .next 2>nul
echo.
echo SUCCESS: Now on GitHub main. Run:
echo   npm install
echo   npx prisma generate
echo   npx prisma migrate deploy
echo   npm run prisma:seed
echo   npm run dev
pause

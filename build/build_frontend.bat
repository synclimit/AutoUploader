@echo off
echo [BUILD] Building Frontend (React)...
cd /d "%~dp0..\frontend\app"
call npm install
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%
echo [BUILD] Copying frontend to backend static folder...
cd /d "%~dp0.."
xcopy /s /i /y "frontend\app\dist" "backend\frontend_dist"
if %errorlevel% neq 0 exit /b %errorlevel%
echo [BUILD] Frontend build complete.

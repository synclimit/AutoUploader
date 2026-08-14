@echo off
echo ===================================================
echo Memulai Raynz PitStop (Dev Mode - Direct Python & Vite)
echo ===================================================
echo.
cd /d "D:\RaynzPitStop"

echo Stopping previous processes on port 18888 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :18888') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /f /pid %%a >nul 2>&1

echo Starting Raynz PitStop Backend (Port 18888)...
cd /d "D:\RaynzPitStop\backend"
start "Raynz PitStop Backend" venv\Scripts\python.exe main.py

echo Starting Raynz PitStop Frontend (Port 5173)...
cd /d "D:\RaynzPitStop\frontend\app"
start "Raynz PitStop Frontend" npm run dev

echo.
echo Raynz PitStop Dev Mode launched successfully!
pause

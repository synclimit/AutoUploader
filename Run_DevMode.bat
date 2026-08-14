@echo off
echo ===================================================
echo Memulai Raynz PitStop (Dev Mode - Direct Python and Vite)
echo ===================================================
echo.
cd /d "D:\RaynzPitStop"

echo Stopping previous processes on port 8000 and 5188...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5188') do taskkill /f /pid %%a >nul 2>&1

echo Starting Raynz PitStop Backend (Port 8000)...
cd /d "D:\RaynzPitStop\backend"
start "Raynz PitStop Backend" venv\Scripts\python.exe main.py

echo Starting Raynz PitStop Frontend (Port 5188)...
cd /d "D:\RaynzPitStop\frontend\app"
start "Raynz PitStop Frontend" npm run dev

echo.
echo Raynz PitStop Dev Mode launched successfully!
echo Frontend UI: http://localhost:5188
echo Backend API: http://localhost:8000
echo.
pause

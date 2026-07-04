@echo off
echo [CLEAN] Removing old build directories...
cd /d "%~dp0.."
rmdir /s /q "backend\build" 2>nul
rmdir /s /q "backend\dist" 2>nul
rmdir /s /q "backend\frontend_dist" 2>nul
rmdir /s /q "frontend\app\dist" 2>nul
rmdir /s /q "release" 2>nul
mkdir "release"
echo [CLEAN] Clean complete.

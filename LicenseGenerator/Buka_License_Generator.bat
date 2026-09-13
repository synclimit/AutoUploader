@echo off
title License Generator - Raynz PitStop
cd /d "%~dp0"

echo Membuka License Generator...
if exist "%~dp0..\backend\venv\Scripts\python.exe" (
    start "" "%~dp0..\backend\venv\Scripts\python.exe" "%~dp0main.py"
) else (
    echo Menjalankan dengan Python sistem...
    start "" python "%~dp0main.py"
)

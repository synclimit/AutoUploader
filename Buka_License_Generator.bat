@echo off
title License Generator - Raynz PitStop
cd /d "%~dp0"

echo Membuka License Generator...
if exist "%~dp0backend\venv\Scripts\python.exe" (
    start "" "%~dp0backend\venv\Scripts\python.exe" "%~dp0LicenseGenerator\main.py"
) else (
    echo Menjalankan dengan Python sistem...
    start "" python "%~dp0LicenseGenerator\main.py"
)

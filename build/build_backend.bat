@echo off
echo [BUILD] Building Backend (PyInstaller onedir)...
cd /d "%~dp0..\backend"
cmd /c "taskkill /f /im RaynzPitStop.exe >nul 2>&1 & exit /b 0"
if exist dist\RaynzPitStop rmdir /s /q dist\RaynzPitStop >nul 2>&1
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    call pyinstaller AutoUploader.spec --clean -y
) else (
    call python -m PyInstaller AutoUploader.spec --clean -y
)
if %errorlevel% neq 0 exit /b %errorlevel%
echo [BUILD] Backend build complete.

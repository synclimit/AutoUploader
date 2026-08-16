@echo off
echo [BUILD] Building Backend (PyInstaller onedir)...
cd /d "%~dp0..\backend"
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    call pyinstaller AutoUploader.spec --clean -y
) else (
    call python -m PyInstaller AutoUploader.spec --clean -y
)
if %errorlevel% neq 0 exit /b %errorlevel%
echo [BUILD] Backend build complete.

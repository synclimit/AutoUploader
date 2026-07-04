@echo off
echo [BUILD] Building Backend (PyInstaller onedir)...
cd /d "%~dp0..\backend"
call venv\Scripts\activate
call pyinstaller AutoUploader.spec --clean -y
if %errorlevel% neq 0 exit /b %errorlevel%
echo [BUILD] Backend build complete.

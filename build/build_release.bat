@echo off
cd /d "%~dp0"
echo Starting AutoUploader Release Pipeline...
python build_manager.py
if %errorlevel% neq 0 (
    echo Build failed. Check release\installer.log for details.
    pause
    exit /b %errorlevel%
)
echo Build finished successfully!
pause

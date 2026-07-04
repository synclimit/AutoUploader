@echo off
echo [BUILD] Creating Installer (Inno Setup)...
cd /d "%~dp0"
set ISCC="%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe"
if not exist %ISCC% set ISCC="C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
%ISCC% installer.iss
if %errorlevel% neq 0 exit /b %errorlevel%
echo [BUILD] Installer creation complete.

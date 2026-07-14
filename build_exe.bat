@echo off
echo Membangun file .exe untuk Raynz PitStop...
echo Mohon tunggu, proses ini mungkin membutuhkan waktu beberapa menit.

cd backend
call venv\Scripts\activate.bat

echo Menginstal PyInstaller...
pip install pyinstaller

echo Memulai proses build...
pyinstaller --noconfirm --onefile --name "RaynzPitStop_App" --noconsole --add-data "frontend_dist;frontend_dist" --add-data "services\license\keys\public.pem;services\license\keys" --add-data "..\client_secret.json;." --icon="../logo_baru.ico" main.py

echo.
echo Build Selesai!
echo File RaynzPitStop.exe Anda berada di folder: d:\RaynzPitStop\backend\dist\RaynzPitStop
echo Anda dan teman Anda bisa langsung menjalankan file .exe tersebut.
pause

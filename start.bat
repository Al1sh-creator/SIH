@echo off
echo =========================================
echo 🚀 Starting FarmSense Servers...
echo =========================================

echo Starting AI Engine (Django - Port 8000)...
start "FarmSense AI Engine" cmd /k "cd ai-engine && venv\Scripts\python.exe manage.py runserver 8000"

echo Starting Server (Node.js - Port 5000)...
start "FarmSense Server" cmd /k "cd server && npm run dev"

echo Starting Client (React - Port 5173)...
start "FarmSense Client" cmd /k "cd client && npm run dev"

echo.
echo  All servers are starting in new windows!
echo You can close this window.

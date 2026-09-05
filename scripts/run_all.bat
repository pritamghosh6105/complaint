@echo off
echo =====================================================================
echo    CivicPulse AI — Intelligent Citizen Complaint Management System
echo =====================================================================
echo.

cd /d "%~dp0\.."

echo [1/3] Starting Python FastAPI ML Microservice on port 8000...
start "CivicPulse - ML Microservice" cmd /k "cd ml-service\src\api && python main.py"

ping 127.0.0.1 -n 3 >nul

echo [2/3] Starting Node.js Backend API on port 5000...
start "CivicPulse - Backend API" cmd /k "cd backend && npm start"

ping 127.0.0.1 -n 3 >nul

echo [3/3] Starting React Vite Frontend on port 3000...
start "CivicPulse - Frontend Web" cmd /k "cd frontend && npm run dev"

echo.
echo =====================================================================
echo  All 3 services successfully launched!
echo  • Frontend:    http://localhost:3000
echo  • Backend API: http://localhost:5000
echo  • ML Swagger:  http://localhost:8000/docs
echo =====================================================================

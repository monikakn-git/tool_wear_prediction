@echo off
title Generalized Tool Wear Prediction - NASA Milling Dataset
echo =====================================================================
echo  GENERALIZED TOOL WEAR PREDICTION FOR MANUFACTURING (ANN REGRESSION)
echo  Dataset: NASA Milling Wear Benchmark (Matsuura MC-510V CNC)
echo  Standard: ISO 3685 Tool Life Flank Wear (VB)
echo =====================================================================
echo.

cd /d "%~dp0"

echo [1/2] Launching FastAPI Backend Server on http://127.0.0.1:8000 ...
start "Milling Wear - Backend API" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak > nul

echo [2/2] Launching React Vite Frontend on http://localhost:5173 ...
cd frontend
start "Milling Wear - React Frontend" cmd /k "npm run dev"

timeout /t 2 /nobreak > nul
echo.
echo Application successfully launched!
echo Backend Swagger API: http://127.0.0.1:8000/docs
echo Frontend Web Dashboard: http://localhost:5173
echo.
echo Opening browser...
start http://localhost:5173
pause


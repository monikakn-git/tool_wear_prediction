@echo off
title AI-Powered Smart Tool Intelligence & Wear Prediction
echo =====================================================================
echo  AI-POWERED SMART TOOL INTELLIGENCE, WEAR PREDICTION & RECOMMENDATIONS
echo  Integrated Full-Stack Manufacturing Application (v2.0)
echo =====================================================================
echo.

cd /d "%~dp0"

echo [1/2] Verifying production frontend build...
if not exist "frontend\dist\index.html" (
    echo Building React frontend for production integration...
    cd frontend
    call npm run build
    cd ..
)

echo [2/2] Launching Integrated Unified Application on http://127.0.0.1:8000 ...
echo (FastAPI serves both the REST API endpoints and the React Frontend UI directly)
start "Smart Tool Intelligence - Unified Server" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak > nul
echo.
echo Application successfully running!
echo Unified Web App: http://127.0.0.1:8000/
echo Swagger API Docs: http://127.0.0.1:8000/docs
echo.
echo Opening browser to http://127.0.0.1:8000/ ...
start http://127.0.0.1:8000/
pause

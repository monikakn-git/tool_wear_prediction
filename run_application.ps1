# Generalized Tool Wear Prediction - PowerShell Launcher
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host " GENERALIZED TOOL WEAR PREDICTION FOR MANUFACTURING (ANN REGRESSION)" -ForegroundColor White
Write-Host " Dataset: NASA Milling Wear Benchmark · Standard: ISO 3685 (VB)" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $projectRoot

Write-Host "`n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Green
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload" -PassThru

Start-Sleep -Seconds 3

Write-Host "[2/2] Starting React Vite Frontend on http://localhost:5173 ..." -ForegroundColor Green
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$projectRoot\frontend'; npm run dev" -PassThru

Start-Sleep -Seconds 2

Write-Host "`nApplication running successfully!" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "Backend API: http://127.0.0.1:8000/docs`n" -ForegroundColor White

Start-Process "http://localhost:5173"


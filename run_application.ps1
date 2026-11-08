# AI-Powered Smart Tool Intelligence - Unified PowerShell Launcher
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host " AI-POWERED SMART TOOL INTELLIGENCE, WEAR PREDICTION & RECOMMENDATIONS" -ForegroundColor White
Write-Host " Integrated Full-Stack Manufacturing Application (v2.0)" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $projectRoot

# Ensure production bundle exists
if (-not (Test-Path "$projectRoot\frontend\dist\index.html")) {
    Write-Host "`nBuilding React frontend for integrated serving..." -ForegroundColor Yellow
    Set-Location "$projectRoot\frontend"
    npm run build
    Set-Location $projectRoot
}

Write-Host "`nLaunching Unified Full-Stack Application on http://127.0.0.1:8000 ..." -ForegroundColor Green
Write-Host "(FastAPI serves both REST APIs and the React Single-Page Application)" -ForegroundColor Gray

$serverProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload" -PassThru

Start-Sleep -Seconds 3

Write-Host "`nApplication running successfully!" -ForegroundColor Cyan
Write-Host "Unified Full-Stack App: http://127.0.0.1:8000/" -ForegroundColor White
Write-Host "Backend Swagger API:     http://127.0.0.1:8000/docs`n" -ForegroundColor White

Start-Process "http://127.0.0.1:8000/"

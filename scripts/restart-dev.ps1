$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot

function Stop-PortProcess {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Port
  )

  $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique

  foreach ($processId in $connections) {
    if ($processId -and $processId -ne 0) {
      Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
  }
}

Write-Host "Stopping processes on ports 3001 and 5173..."
Stop-PortProcess -Port 3001
Stop-PortProcess -Port 5173

Start-Sleep -Seconds 1

Write-Host "Starting backend server..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$projectRoot'; npm run dev:server"

Write-Host "Starting frontend server..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$projectRoot'; npm run dev:client"

Write-Host "Done. Backend: http://localhost:3001  Frontend: http://localhost:5173"

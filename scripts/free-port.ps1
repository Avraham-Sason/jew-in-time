[CmdletBinding()]
param(
    [int]$Port = 8081
)

$ErrorActionPreference = 'Stop'

$connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if (-not $connections) {
    Write-Host "Port $Port free."
    exit 0
}

$pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($procId in $pids) {
    try {
        $proc = Get-Process -Id $procId -ErrorAction Stop
        Write-Host "Killing PID $procId ($($proc.ProcessName)) on port $Port"
        Stop-Process -Id $procId -Force -ErrorAction Stop
    } catch {
        Write-Warning "Failed to kill PID ${procId}: $_"
    }
}

Start-Sleep -Milliseconds 400
$still = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($still) {
    Write-Error "Port $Port still in use after kill."
    exit 1
}
Write-Host "Port $Port freed."

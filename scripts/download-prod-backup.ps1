# Download latest production backup from VPS to your PC.
# Usage (PowerShell):
#   .\scripts\download-prod-backup.ps1
#   .\scripts\download-prod-backup.ps1 -Server root@76.13.11.228 -Dest "C:\Omar\Work\Sahlaa\City_Tools_System"

param(
    [string]$Server = "root@76.13.11.228",
    [string]$RemoteDir = "/root/backups/original",
    [string]$Dest = "C:\Omar\Work\Sahlaa\City_Tools_System"
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path $Dest | Out-Null

Write-Host "Fetching latest backup list from $Server ..."
$latest = ssh $Server "ls -t ${RemoteDir}/citytools_pos_FULL_*.dump 2>/dev/null | head -1"
if (-not $latest) {
    Write-Error "No backup found on server. Run: ./scripts/migrate-prod-to-city-tools.sh backup"
}

$base = [System.IO.Path]::GetFileNameWithoutExtension($latest.Trim())
Write-Host "Latest: $base"

foreach ($ext in @(".dump", ".sql")) {
    $remote = "${RemoteDir}/${base}${ext}"
    $local = Join-Path $Dest "${base}${ext}"
    Write-Host "Downloading $remote -> $local"
    scp "${Server}:${remote}" $local
}

Write-Host "Done. Files saved to $Dest"

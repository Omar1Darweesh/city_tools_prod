# Fix Arabic encoding for store content on test stack
# Usage: powershell -ExecutionPolicy Bypass -File fix-arabic-store.ps1

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$base = 'https://city-tools.lamarpos.cloud/api/store'
$jsonPath = Join-Path $PSScriptRoot 'fix-arabic-store.json'
$data = Get-Content -Path $jsonPath -Encoding UTF8 | ConvertFrom-Json

function Invoke-Utf8Patch {
    param([string]$Url, [object]$Body)
    $utf8 = New-Object System.Text.UTF8Encoding $false
    $bytes = $utf8.GetBytes(($Body | ConvertTo-Json -Depth 10 -Compress))
    $tmp = [System.IO.Path]::GetTempFileName()
    [System.IO.File]::WriteAllBytes($tmp, $bytes)
    curl.exe -s -X PATCH $Url -H 'Content-Type: application/json; charset=utf-8' --data-binary "@$tmp" | Out-Null
    Remove-Item $tmp -Force
}

foreach ($s in $data.statistics) {
    Invoke-Utf8Patch "$base/statistics/$($s.id)" $s
    Write-Host "statistics $($s.id): $($s.labelAr)"
}

foreach ($t in $data.trustFeatures) {
    Invoke-Utf8Patch "$base/trust-features/$($t.id)" $t
    Write-Host "trust $($t.id): $($t.titleAr)"
}

foreach ($c in $data.discountCards) {
    Invoke-Utf8Patch "$base/discount-cards/$($c.id)" $c
    Write-Host "discount $($c.id): $($c.titleAr)"
}

foreach ($z in $data.deliveryZones) {
    Invoke-Utf8Patch "$base/delivery-zones/$($z.id)" $z
    Write-Host "zone $($z.id): $($z.nameAr)"
}

foreach ($h in $data.heroSlides) {
    Invoke-Utf8Patch "$base/hero-slides/$($h.id)" $h
    Write-Host "hero $($h.id): $($h.titleAr)"
}

Write-Host "`nDone. Verify at https://city-tools.lamarpos.cloud/ar/admin/statistics"

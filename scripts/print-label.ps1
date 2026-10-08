# scripts/print-label.ps1
# Usage: .\print-label.ps1 -PdfPath "C:\path\to\label.pdf" -PrinterName "Dymo"

param(
    [Parameter(Mandatory=$true)]
    [string]$PdfPath,
    
    [Parameter(Mandatory=$true)]
    [string]$PrinterName
)

# Validate PDF exists
if (-Not (Test-Path $PdfPath)) {
    Write-Error "PDF file not found: $PdfPath"
    exit 1
}

# Check if printer exists
$printers = Get-Printer | Select-Object -ExpandProperty Name
if ($printers -notcontains $PrinterName) {
    Write-Error "Printer not found: $PrinterName"
    Write-Host "Available printers:"
    $printers | ForEach-Object { Write-Host "  - $_" }
    exit 1
}

# Print using default PDF viewer association
Start-Process -FilePath $PdfPath -Verb PrintTo -ArgumentList "`"$PrinterName`""

Write-Host "Label sent to printer: $PrinterName"

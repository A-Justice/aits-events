# AITS Events - Create Deployment ZIP
# Run this script with: .\create-deploy-zip.ps1

$ErrorActionPreference = "Stop"

# Configuration
$zipName = "aits-events-deploy.zip"
$tempDir = "deploy-temp"
$excludeDirs = @(
    "node_modules",
    ".git",
    "_original_reference",
    "dist",
    ".cursor"
)
$excludeFiles = @(
    "package-lock.json",
    "vite.config.js",
    "create-deploy-zip.ps1",
    ".gitignore",
    "*.log"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AITS Events - Deployment Package" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Remove old zip if exists
if (Test-Path $zipName) {
    Write-Host "Removing old zip file..." -ForegroundColor Yellow
    Remove-Item $zipName -Force
}

# Remove temp directory if exists
if (Test-Path $tempDir) {
    Write-Host "Cleaning up temp directory..." -ForegroundColor Yellow
    Remove-Item $tempDir -Recurse -Force
}

# Create temp directory
Write-Host "Creating temp directory..." -ForegroundColor Green
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy files to temp directory
Write-Host "Copying files..." -ForegroundColor Green

# Get all items excluding specified directories and files
$items = Get-ChildItem -Path "." -Force | Where-Object {
    $_.Name -notin $excludeDirs -and
    $_.Name -ne $tempDir -and
    $_.Name -ne $zipName -and
    $_.Extension -ne ".log"
}

foreach ($item in $items) {
    $destPath = Join-Path $tempDir $item.Name
    
    if ($item.Name -in $excludeFiles) {
        continue
    }
    
    if ($item.PSIsContainer) {
        Write-Host "  Copying folder: $($item.Name)" -ForegroundColor Gray
        Copy-Item -Path $item.FullName -Destination $destPath -Recurse -Force
    } else {
        Write-Host "  Copying file: $($item.Name)" -ForegroundColor Gray
        Copy-Item -Path $item.FullName -Destination $destPath -Force
    }
}

# Create the zip file
Write-Host ""
Write-Host "Creating ZIP file: $zipName" -ForegroundColor Green
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipName -Force

# Get zip file size
$zipSize = (Get-Item $zipName).Length / 1MB
$zipSizeFormatted = "{0:N2}" -f $zipSize

# Clean up temp directory
Write-Host "Cleaning up..." -ForegroundColor Yellow
Remove-Item $tempDir -Recurse -Force

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SUCCESS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Created: $zipName ($zipSizeFormatted MB)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Upload Instructions:" -ForegroundColor Yellow
Write-Host "1. Login to GoDaddy cPanel" -ForegroundColor White
Write-Host "2. Open File Manager" -ForegroundColor White
Write-Host "3. Navigate to public_html" -ForegroundColor White
Write-Host "4. Upload $zipName" -ForegroundColor White
Write-Host "5. Extract the zip file" -ForegroundColor White
Write-Host "6. Delete the zip file from server" -ForegroundColor White
Write-Host ""
Write-Host "Don't forget to:" -ForegroundColor Yellow
Write-Host "- Add your domain to Firebase authorized domains" -ForegroundColor White
Write-Host "- Ensure SSL (HTTPS) is enabled" -ForegroundColor White
Write-Host ""


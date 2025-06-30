# BatchConvertPDFs.ps1

<##>
# PowerShell script to batch convert multiple PDF files to Markdown.
# Usage: 
# .\BatchConvertPDFs.ps1 -SourceDir <directory-with-pdfs> -OutputDir <output-directory> -FilePattern "*.pdf"
<##>

param(
    [Parameter(Mandatory=$true)]
    [string]$SourceDir,
    
    [Parameter(Mandatory=$true)]
    [string]$OutputDir,
    
    [Parameter(Mandatory=$false)]
    [string]$FilePattern = "*.pdf"
)

# Check if the source directory exists
if (-Not (Test-Path $SourceDir)) {
    Write-Error "Source directory not found: $SourceDir"
    exit 1
}

# Create the output directory if it doesn't exist
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "Created output directory: $OutputDir"
}

# Get the path to the PDF to Markdown converter script
$converterScript = Join-Path $PSScriptRoot "ConvertPDFToMarkdown.ps1"

if (-Not (Test-Path $converterScript)) {
    Write-Error "Converter script not found: $converterScript"
    exit 1
}

# Get all PDF files in the source directory
$pdfFiles = Get-ChildItem -Path $SourceDir -Filter $FilePattern

if ($pdfFiles.Count -eq 0) {
    Write-Warning "No PDF files found in $SourceDir matching pattern $FilePattern"
    exit 0
}

Write-Host "Found $($pdfFiles.Count) PDF files to process..."

# Process each PDF file
foreach ($pdf in $pdfFiles) {
    Write-Host "Converting $($pdf.Name)..."
    & $converterScript -FilePath $pdf.FullName -OutputDir $OutputDir
}

Write-Host "Batch conversion complete. All files have been processed."

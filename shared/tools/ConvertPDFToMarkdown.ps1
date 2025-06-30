# ConvertPDFToMarkdown.ps1

<##>
# PowerShell script to convert a PDF file to a Markdown document using Pandoc.
# It creates a new markdown file with the same name as the PDF.
# Usage: .\ConvertPDFToMarkdown.ps1 -FilePath <path-to-pdf-file> [-OutputDir <output-directory>]
<##>

param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = ""
)

if (-Not (Test-Path $FilePath)) {
    Write-Error "File not found: $FilePath"
    exit 1
}

# Get base name and directory
$sourceDir = Split-Path $FilePath
$base = [System.IO.Path]::GetFileNameWithoutExtension($FilePath)

# Use output directory if provided, otherwise use the source directory
$outputDirPath = if ($OutputDir -and $OutputDir -ne "") { $OutputDir } else { $sourceDir }

# Create the output directory if it doesn't exist
if (-not (Test-Path $outputDirPath)) {
    New-Item -ItemType Directory -Path $outputDirPath -Force | Out-Null
    Write-Host "Created output directory: $outputDirPath"
}

# Find the next available sequential number
$seq = 1
$outputPath = Join-Path $outputDirPath ("${base}_$seq.md")
while (Test-Path $outputPath) {
    $seq++
    $outputPath = Join-Path $outputDirPath ("${base}_$seq.md")
}

# Run Pandoc to convert PDF to Markdown
pandoc $FilePath -f pdf -t markdown -o $outputPath

Write-Host "Markdown document generated at: $outputPath"

# Optional: Extract plain text version as well (useful for further processing)
$textOutputPath = Join-Path $outputDirPath ("${base}_$seq.txt")
pandoc $FilePath -f pdf -t plain -o $textOutputPath

Write-Host "Plain text version also generated at: $textOutputPath"

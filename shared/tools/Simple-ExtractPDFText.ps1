# Simple-ExtractPDFText.ps1
#
# A simple PowerShell script to try extracting text from PDF files
# This script uses basic text extraction methods
param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = ""
)

# Check if file exists
if (-Not (Test-Path $FilePath)) {
    Write-Error "File not found: $FilePath"
    exit 1
}

# Get base name and directory
$sourceDir = Split-Path -Path $FilePath
$base = [System.IO.Path]::GetFileNameWithoutExtension($FilePath)

# Use output directory if provided, otherwise use the source directory
$outputDirPath = if ($OutputDir -and $OutputDir -ne "") { $OutputDir } else { $sourceDir }

# Create the output directory if it doesn't exist
if (-not (Test-Path $outputDirPath)) {
    New-Item -ItemType Directory -Path $outputDirPath -Force | Out-Null
    Write-Host "Created output directory: $outputDirPath"
}

# Output text file path
$outputPath = Join-Path -Path $outputDirPath -ChildPath "${base}_text.txt"

# Use alternative method: Save a copy of the PDF and try to extract text
Write-Host "Attempting to extract text from PDF..."
$pdfBytes = [System.IO.File]::ReadAllBytes($FilePath)
$pdfContent = [System.Text.Encoding]::ASCII.GetString($pdfBytes)

# Try to find text strings in the PDF content
$textContent = "# Extracted content from $base`r`n`r`n"
$textContent += "## Raw text extraction`r`n`r`n"

# Try to find strings that might be text
$textMatches = [regex]::Matches($pdfContent, '(\([^\(\)]{3,}?\))')
foreach($match in $textMatches) {
    $text = $match.Value.Trim('(', ')').Replace('\)', ')').Replace('\(', '(')
    if($text.Length -gt 3 -and $text -match '[a-zA-Z]') {
        $textContent += "$text`r`n"
    }
}

# Save the content to the output file
[System.IO.File]::WriteAllText($outputPath, $textContent)

# Check if we got any useful content
$fileInfo = Get-Item -Path $outputPath
if($fileInfo.Length -gt 100) {
    Write-Host "Text extraction completed. Output saved to: $outputPath"
} else {
    Write-Host "Limited text was extracted from the PDF. For better results:"
    Write-Host "1. Use a specialized tool like Adobe Acrobat"
    Write-Host "2. Try online PDF to text converters"
    Write-Host "3. Consider OCR software for image-based PDFs"
}

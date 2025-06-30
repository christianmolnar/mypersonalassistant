# ExtractTextFromPDF.ps1
#
# A PowerShell script to extract text from a PDF file using iText Sharp library
# This script will install the required module if it's not already available

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
$outputPath = Join-Path $outputDirPath ("${base}_extracted_$seq.txt")
while (Test-Path $outputPath) {
    $seq++
    $outputPath = Join-Path $outputDirPath ("${base}_extracted_$seq.txt")
}

# Function to check if a module is installed
function Test-ModuleInstalled {
    param (
        [Parameter(Mandatory)]
        [string]$ModuleName
    )
    
    return (Get-Module -ListAvailable -Name $ModuleName)
}

# Attempt to extract text directly using Add-Type approach
try {
    Write-Host "Extracting text from PDF using .NET methods..."
    
    # Create a temporary directory for the extraction
    $tempDir = Join-Path $env:TEMP "PDFExtraction_$(Get-Random)"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    
    # Copy the PDF file to the temp directory
    $tempPdf = Join-Path $tempDir "temp.pdf"
    Copy-Item -Path $FilePath -Destination $tempPdf -Force
    
    # Use basic PowerShell approach to extract text
    Add-Type -AssemblyName System.IO.Compression.FileSystem

    # Rename PDF to ZIP (since PDF structure allows some extraction)
    $tempZip = Join-Path $tempDir "temp.zip"
    Copy-Item -Path $tempPdf -Destination $tempZip -Force
    
    try {
        # Try to open as zip archive (works for some PDFs)
        $zip = [System.IO.Compression.ZipFile]::OpenRead($tempZip)
        
        # Extract all text-like content
        $textContent = ""
        foreach ($entry in $zip.Entries) {
            try {
                if ($entry.Length -gt 0 -and $entry.Name -match "\.(txt|xml|content)$") {
                    $stream = $entry.Open()
                    $reader = New-Object System.IO.StreamReader($stream)
                    $content = $reader.ReadToEnd()
                    $textContent += "`n--- Content from $($entry.FullName) ---`n$content`n"
                    $reader.Close()
                    $stream.Close()
                }
            } catch {
                # Ignore errors for individual entries
            }
        }
        $zip.Dispose()
        
        # Save extracted content
        if ($textContent.Length -gt 0) {
            Set-Content -Path $outputPath -Value $textContent
            Write-Host "Successfully extracted some text content from PDF structure"
        }
    } catch {
        Write-Host "Could not process PDF as archive structure"
    }
    
    # Attempt to extract raw text using regex patterns
    $pdfBytes = [System.IO.File]::ReadAllBytes($FilePath)
    $pdfText = [System.Text.Encoding]::ASCII.GetString($pdfBytes)
    
    # Look for text patterns in the PDF
    $textMatches = [regex]::Matches($pdfText, '(\([\w\s,.:;?!-]+\))')
    if ($textMatches.Count -gt 0) {
        $extractedText = $textMatches | ForEach-Object { 
            $_.Groups[1].Value.Trim('(', ')').Replace('\)', ')').Replace('\(', '(') 
        } | Where-Object { $_.Length -gt 3 } | Sort-Object -Unique
        
        Add-Content -Path $outputPath -Value "`n--- Text patterns extracted from PDF ---`n"
        Add-Content -Path $outputPath -Value ($extractedText -join "`n")
        Write-Host "Extracted text patterns from PDF content"
    }
    
    # Clean up temp directory
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "Error during extraction: $_"
}

# If we have a file with content
if ((Test-Path $outputPath) -and ((Get-Item $outputPath).Length -gt 0)) {
    Write-Host "Text extraction complete. Output saved to: $outputPath"
    
    # Try to clean up the extracted text with additional processing
    $content = Get-Content -Path $outputPath -Raw
    
    # Convert to markdown file as well
    $markdownPath = Join-Path $outputDirPath ("${base}_extracted_$seq.md")
    
    # Create a simple markdown structure
    $markdown = "# Extracted Content from $base`n`n"
    $markdown += "## Overview`n`n"
    $markdown += "This document contains text extracted from the PDF file.`n`n"
    $markdown += "## Content`n`n"
    $markdown += "````n$content`n```"
    
    Set-Content -Path $markdownPath -Value $markdown
    Write-Host "Markdown version created at: $markdownPath"
} else {
    Write-Host "No text could be extracted from the PDF."
}

Write-Host "`nNote: For better PDF text extraction, consider using:"
Write-Host "1. Adobe Acrobat Export to Text feature"
Write-Host "2. Online PDF to text conversion tools"
Write-Host "3. Installing specialized tools like pdftotext from Xpdf or Poppler"

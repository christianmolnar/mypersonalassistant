# ConvertMarkdownToWord.ps1

<##>
# PowerShell script to convert a Markdown file to a new Microsoft Word document using Pandoc and a custom reference template.
# It always creates a new file with a sequential number to avoid overwriting or permission issues.
# Usage: .\ConvertMarkdownToWord.ps1 -FilePath <path-to-markdown-file>
<##>

param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath
)

if (-Not (Test-Path $FilePath)) {
    Write-Error "File not found: $FilePath"
    exit 1
}

# Get base name and directory
$dir = Split-Path $FilePath
$base = [System.IO.Path]::GetFileNameWithoutExtension($FilePath)

# Find the next available sequential number
$seq = 1
$outputPath = Join-Path $dir ("${base}_$seq.docx")
while (Test-Path $outputPath) {
    $seq++
    $outputPath = Join-Path $dir ("${base}_$seq.docx")
}

# Path to your reference template (update this path if you save the template elsewhere)
$referenceDoc = "C:\Repo\NicksWorkspace\CopilotWorkspaces\shared\tools\resume_reference.docx"

# Run Pandoc to convert Markdown to Word using the reference template
pandoc $FilePath -o $outputPath --reference-doc="$referenceDoc"

Write-Host "Word document generated at: $outputPath using reference template: $referenceDoc"

param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath
)

try {
    # Check if Word is installed
    try {
        $wordApp = New-Object -ComObject Word.Application -ErrorAction Stop
    }
    catch {
        Write-Error "Microsoft Word application could not be found. Please ensure it is installed to use this script."
        exit 1
    }

    $wordApp.Visible = $false # Keep Word invisible

    if (-not (Test-Path $FilePath -PathType Leaf)) {
        Write-Error "File not found: $FilePath"
        exit 1
    }

    $document = $wordApp.Documents.Open($FilePath, $false, $true) # Open read-only

    if ($null -eq $document) {
        Write-Error "Could not open document: $FilePath"
        $wordApp.Quit()
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($wordApp) | Out-Null
        exit 1
    }

    $text = $document.Content.Text
    Write-Output $text
}
catch {
    Write-Error "An error occurred: $($_.Exception.Message)"
}
finally {
    if ($document) {
        $document.Close([ref]$false) # Close without saving changes
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($document) | Out-Null
    }
    if ($wordApp) {
        $wordApp.Quit()
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($wordApp) | Out-Null
    }
    # Force garbage collection to release COM objects
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

# Setup script for Jira MCP (mcp-atlassian) — Windows (PowerShell)
# Each developer runs this once after cloning the repo.
#
# Usage:
#   .\.kilo\setup-jira-mcp.ps1 -JiraUrl "https://jira.signaldev.ir" -JiraToken "YOUR_PAT"
#
# Get your PAT from: Jira -> Profile -> Personal Access Tokens

param(
    [Parameter(Mandatory = $true)]
    [string]$JiraUrl,

    [Parameter(Mandatory = $true)]
    [string]$JiraToken
)

$ErrorActionPreference = "Stop"

$VenvDir = "$env:LOCALAPPDATA\kilo-mcp-venv"

Write-Host "==> Creating venv at $VenvDir" -ForegroundColor Cyan
uv venv $VenvDir

Write-Host "==> Installing mcp-atlassian" -ForegroundColor Cyan
uv pip install --python "$VenvDir\Scripts\python.exe" mcp-atlassian

$Exe = "$VenvDir\Scripts\mcp-atlassian.exe" -replace '\\', '/'

$ConfigDir = "$env:USERPROFILE\.config\kilo"
$ConfigFile = "$ConfigDir\kilo.json"

New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null

Write-Host "==> Writing Jira MCP config to $ConfigFile" -ForegroundColor Cyan

$wrapperPath = "$VenvDir\start-jira-mcp.cmd"
@"
@echo off
set JIRA_URL=$JiraUrl/
set JIRA_PERSONAL_TOKEN=$JiraToken
set READ_ONLY_MODE=true
"$VenvDir\Scripts\mcp-atlassian.exe"
"@ | Set-Content -LiteralPath $wrapperPath -Encoding ASCII

$wrapperPathNorm = $wrapperPath -replace '\\', '/'

if (Test-Path $ConfigFile) {
    $config = Get-Content $ConfigFile -Raw | ConvertFrom-Json
    if (-not $config.mcp) { $config | Add-Member -NotePropertyName mcp -NotePropertyValue @{} }
    $config.mcp | Add-Member -NotePropertyName jira -NotePropertyValue @{
        type = "local"
        command = @($wrapperPathNorm)
        timeout = 30000
    } -Force
    $config | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $ConfigFile -Encoding UTF8
} else {
    $config = @{
        '$schema' = "https://app.kilo.ai/config.json"
        mcp = @{
            jira = @{
                type = "local"
                command = @($wrapperPathNorm)
                timeout = 30000
            }
        }
    }
    $config | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $ConfigFile -Encoding UTF8
}

Write-Host ""
Write-Host "Done! Restart Kilo (or open a new session) to load the Jira MCP." -ForegroundColor Green
Write-Host "   Verify with: /mcps" -ForegroundColor Green

#Requires -Version 5.1
# Push this repo to https://github.com/GAO19830105/AI-
# Run from project root: powershell -ExecutionPolicy Bypass -File .\scripts\push-github.ps1

$ErrorActionPreference = 'Stop'
$Remote = 'https://github.com/GAO19830105/AI-.git'

$root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $root 'package.json'))) {
  Write-Error 'Run from repo root (package.json not found).'
  exit 1
}
Set-Location $root

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error 'git not found. Install Git for Windows and add it to PATH.'
  exit 1
}

if (-not (Test-Path '.git')) {
  git init
}

git add -A
$porcelain = git status --porcelain
if ($porcelain) {
  git commit -m 'chore: sync project source'
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
  Write-Host 'Working tree clean, skip commit.'
}

git branch -M main

git remote remove origin 2>$null
git remote add origin $Remote

$fetchOk = $true
git fetch origin 2>$null
if ($LASTEXITCODE -ne 0) { $fetchOk = $false }

if ($fetchOk) {
  git merge origin/main --allow-unrelated-histories -m 'Merge remote main (e.g. README)' --no-edit
  if ($LASTEXITCODE -ne 0) {
    Write-Host 'Merge failed; resolve conflicts then: git push -u origin main'
    exit 1
  }
}

git push -u origin main
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host 'Done: pushed to origin main.'

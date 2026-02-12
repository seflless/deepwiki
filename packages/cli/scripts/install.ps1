$ErrorActionPreference = "Stop"

$Repo = "seflless/deepwiki"
$BinaryName = "deepwiki"
$InstallDir = if ($env:DEEPWIKI_INSTALL_DIR) { $env:DEEPWIKI_INSTALL_DIR } else { "$env:LOCALAPPDATA\deepwiki" }

function Write-Info($msg) { Write-Host "[deepwiki] $msg" -ForegroundColor Green }
function Write-Err($msg) { Write-Host "[deepwiki] $msg" -ForegroundColor Red; exit 1 }

Write-Info "Installing deepwiki..."

# Detect architecture
$arch = if ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture -eq "X64") { "x64" }
        elseif ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture -eq "Arm64") { "arm64" }
        else { Write-Err "Unsupported architecture" }

$platform = "windows-$arch"
Write-Info "Detected platform: $platform"

# Get latest version
$release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest"
$version = $release.tag_name
Write-Info "Latest version: $version"

# Download
$url = "https://github.com/$Repo/releases/download/$version/$BinaryName-$platform.exe"
Write-Info "Downloading from $url..."

if (!(Test-Path $InstallDir)) { New-Item -ItemType Directory -Path $InstallDir | Out-Null }
$dest = Join-Path $InstallDir "$BinaryName.exe"

Invoke-WebRequest -Uri $url -OutFile $dest

# Add to PATH if not already there
$userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$InstallDir*") {
    [System.Environment]::SetEnvironmentVariable("Path", "$userPath;$InstallDir", "User")
    Write-Info "Added $InstallDir to PATH (restart terminal to use)"
}

Write-Info "Installed to $dest"
Write-Info "Run 'deepwiki --help' to get started"

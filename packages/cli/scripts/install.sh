#!/usr/bin/env bash
set -euo pipefail

REPO="seflless/deep-wiki"
INSTALL_DIR="${DEEP_WIKI_INSTALL_DIR:-/usr/local/bin}"
BINARY_NAME="deep-wiki"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[deep-wiki]${NC} $1"; }
warn()  { echo -e "${YELLOW}[deep-wiki]${NC} $1"; }
error() { echo -e "${RED}[deep-wiki]${NC} $1" >&2; exit 1; }

# Detect platform
detect_platform() {
  local os arch

  case "$(uname -s)" in
    Darwin) os="darwin" ;;
    Linux)  os="linux" ;;
    *)      error "Unsupported OS: $(uname -s)" ;;
  esac

  case "$(uname -m)" in
    x86_64|amd64)  arch="x64" ;;
    arm64|aarch64) arch="arm64" ;;
    *)             error "Unsupported architecture: $(uname -m)" ;;
  esac

  echo "${os}-${arch}"
}

# Get latest release tag
get_latest_version() {
  curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" \
    | grep '"tag_name"' \
    | sed -E 's/.*"([^"]+)".*/\1/'
}

main() {
  info "Installing deep-wiki..."

  local platform
  platform=$(detect_platform)
  info "Detected platform: ${platform}"

  local version
  version=$(get_latest_version)
  if [ -z "$version" ]; then
    error "Could not determine latest version"
  fi
  info "Latest version: ${version}"

  local url="https://github.com/${REPO}/releases/download/${version}/${BINARY_NAME}-${platform}"
  info "Downloading from ${url}..."

  local tmp
  tmp=$(mktemp)
  curl -fsSL "$url" -o "$tmp" || error "Download failed"
  chmod +x "$tmp"

  # Install
  if [ -w "$INSTALL_DIR" ]; then
    mv "$tmp" "${INSTALL_DIR}/${BINARY_NAME}"
  else
    info "Need sudo to install to ${INSTALL_DIR}"
    sudo mv "$tmp" "${INSTALL_DIR}/${BINARY_NAME}"
  fi

  info "Installed ${BINARY_NAME} to ${INSTALL_DIR}/${BINARY_NAME}"
  info "Run 'deep-wiki --help' to get started"
}

main

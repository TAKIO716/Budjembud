#!/usr/bin/env bash
set -euo pipefail

# ===== Pretty helpers =====
RED="\033[0;31m"; GREEN="\033[0;32m"; YELLOW="\033[1;33m"; BLUE="\033[0;34m"; NC="\033[0m"

hr() { echo -e "${BLUE}============================================================${NC}"; }
info() { echo -e "${BLUE}[i]${NC} $*"; }
ok() { echo -e "${GREEN}[OK]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }

# ===== Require sudo =====
if ! command -v sudo >/dev/null 2>&1; then
  echo -e "${RED}sudo tidak ditemukan. Install sudo dulu.${NC}"
  exit 1
fi

hr
info "Update paket & install dependency dasar..."
sudo apt update -y
sudo apt install -y ca-certificates curl gnupg lsb-release

ok "Dependency dasar beres."
hr

# ===== Install figlet =====
if ! command -v figlet >/dev/null 2>&1; then
  info "Install figlet..."
  sudo apt install -y figlet
  ok "figlet terinstall."
else
  ok "figlet sudah ada."
fi

# ===== Banner =====
echo
figlet "By Fyzz" || true
echo

# ===== Install neofetch =====
if ! command -v neofetch >/dev/null 2>&1; then
  info "Install neofetch..."
  sudo apt install -y neofetch
  ok "neofetch terinstall."
else
  ok "neofetch sudah ada."
fi

hr
info "Menjalankan neofetch..."
neofetch || true
hr

# ===== Install Node.js 24 via NodeSource =====
info "Setup repo NodeSource untuk Node.js 24..."
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -

info "Install Node.js 24..."
sudo apt install -y nodejs

hr
info "Cek versi Node & npm:"
node -v
npm -v
hr
ok "Selesai! Node.js 24 sudah terpasang."

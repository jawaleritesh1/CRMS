#!/usr/bin/env bash
# ==============================================================================
# Ralix CRM — Automated Production VPS Deployment Script
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}   🚀 Starting Ralix CRM Production VPS Deployment   ${NC}"
echo -e "${BLUE}=====================================================${NC}"

# 1. Check Root / Sudo
if [ "$EUID" -ne 0 ] && ! command -v sudo &> /dev/null; then
  echo -e "${RED}Error: This script must be run as root or with sudo.${NC}"
  exit 1
fi

SUDO=""
if [ "$EUID" -ne 0 ]; then
  SUDO="sudo"
fi

# 2. Check / Install Docker & Docker Compose
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}Docker not found. Installing Docker Engine...${NC}"
  $SUDO apt-get update -y
  $SUDO apt-get install -y ca-certificates curl gnupg lsb-release
  $SUDO mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | $SUDO gpg --dearmor -o /etc/apt/keyrings/docker.gpg || true
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | $SUDO tee /etc/apt/sources.list.d/docker.list > /dev/null || true
  $SUDO apt-get update -y || true
  $SUDO apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin || {
    echo -e "${YELLOW}Fallback to convenience installation script...${NC}"
    curl -fsSL https://get.docker.com | $SUDO sh
  }
  $SUDO systemctl enable docker
  $SUDO systemctl start docker
  echo -e "${GREEN}✓ Docker installed successfully.${NC}"
fi

# Determine compose command
if docker compose version &> /dev/null; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
  COMPOSE_CMD="docker-compose"
else
  echo -e "${RED}Error: Docker Compose plugin not found.${NC}"
  exit 1
fi

# 3. Check for .env file
if [ ! -f .env ]; then
  if [ -f .env.production.example ]; then
    echo -e "${YELLOW}No .env found. Creating .env from .env.production.example...${NC}"
    cp .env.production.example .env
    # Generate random strong passwords
    PG_PASS=$(openssl rand -hex 16)
    JWT_SECRET=$(openssl rand -hex 24)
    sed -i "s/replace_with_strong_database_password_32chars/${PG_PASS}/g" .env
    sed -i "s/replace_with_a_random_cryptographic_key_at_least_32_characters/${JWT_SECRET}/g" .env
    echo -e "${GREEN}✓ Generated secure random credentials in .env.${NC}"
  else
    echo -e "${RED}Error: Neither .env nor .env.production.example found!${NC}"
    exit 1
  fi
fi

# 4. Pull and Build Containers
echo -e "${BLUE}==> Building and launching Docker containers...${NC}"
$COMPOSE_CMD build --pull

# 5. Launch Stack
echo -e "${BLUE}==> Starting services...${NC}"
$COMPOSE_CMD up -d

# 6. Verify Health
echo -e "${BLUE}==> Waiting for services to become healthy...${NC}"
sleep 10

$COMPOSE_CMD ps

echo ""
echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN}   ✓ Ralix CRM Deployed Successfully!                ${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo -e "Access your application at:"
echo -e "👉  ${YELLOW}http://$(curl -s ifconfig.me || hostname -I | awk '{print $1}')${NC}"
echo ""
echo -e "Helpful commands:"
echo -e "  View logs:          ${BLUE}${COMPOSE_CMD} logs -f${NC}"
echo -e "  Restart stack:      ${BLUE}${COMPOSE_CMD} restart${NC}"
echo -e "  Stop stack:         ${BLUE}${COMPOSE_CMD} down${NC}"
echo -e "  Configure SSL:      ${BLUE}./setup-ssl.sh yourdomain.com your@email.com${NC}"
echo ""

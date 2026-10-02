# 🚀 Ralix CRM (v5.1.0-HARDENED) — Production VPS Deployment Guide

This guide walks you through deploying the complete Ralix CRM stack to any Linux VPS (Ubuntu 22.04 / 24.04 or Debian 11 / 12) using Docker Compose and Nginx reverse proxy.

---

## 🏗️ Architecture on VPS

```text
Incoming Traffic (Port 80 / 443)
       │
       ▼
 ┌─────────────┐
 │    Nginx    │  Reverse Proxy & SSL termination
 └──────┬──────┘
        │
   ┌────┴────────────────────────┐
   │ /api/*                      │ /* (Pages & Assets)
   ▼                             ▼
┌──────────────┐          ┌──────────────┐
│  API Server  │          │ Next.js App  │
│  (Port 5000) │          │ (Port 3000)  │
└──────┬───────┘          └──────────────┘
       │
   ┌───┴──────────┐
   ▼              ▼
┌──────────┐ ┌─────────┐
│ Postgres │ │  Redis  │
│ (v16)    │ │  (v7)   │
└──────────┘ └─────────┘
```

---

## 1. Prerequisites

- A Linux VPS (Ubuntu 22.04 LTS or Debian 12 recommended)
- Minimum: **2 GB RAM** (4 GB recommended)
- Open firewall ports:
  - `22` (SSH)
  - `80` (HTTP)
  - `443` (HTTPS)

---

## 2. Step-by-Step Deployment

### Option A: Using Git (Recommended)

1. **SSH into your VPS**:
   ```bash
   ssh root@<your-vps-ip>
   ```

2. **Clone your repository**:
   ```bash
   git clone <your-repo-url> /opt/crms
   cd /opt/crms
   ```

### Option B: Using SCP / Rsync from your local machine

From your Windows PowerShell / Terminal:
```powershell
# From d:\Freelance\CRMS:
scp -r * root@<your-vps-ip>:/opt/crms/
```
Then SSH in:
```bash
ssh root@<your-vps-ip>
cd /opt/crms
```

---

### Step 3: Run the Automated Deployment Script

Make the script executable and run:
```bash
chmod +x deploy.sh setup-ssl.sh
./deploy.sh
```

**What the script does automatically**:
1. Checks for Docker and Docker Compose (installs them automatically if missing).
2. Creates `.env` with auto-generated 32-character database and JWT cryptographic keys.
3. Builds the production multi-stage Docker images for both `server` and `client`.
4. Starts PostgreSQL 16, Redis 7, Backend Server, Next.js Client, and Nginx.
5. Runs Prisma migrations (`prisma migrate deploy`) and seeds initial capabilities and system admin.

Once finished, you can access your CRM immediately at:
👉 **`http://<your-vps-ip>`**

---

## 3. Initial Login Credentials

- **Email**: `admin@acme.com` (or `admin@ralixcrm.internal`)
- **Password**: `Password123!` (or `RalixHardened2026!`)

---

## 4. Setting up a Custom Domain & Free SSL (HTTPS)

Once your DNS `A` record points to your VPS IP:

```bash
./setup-ssl.sh yourcrmdomain.com your-email@example.com
```

This will automatically:
- Provision a Let's Encrypt certificate via Certbot.
- Update Nginx to enforce HTTP $\rightarrow$ HTTPS redirection.
- Enable HTTP/2, modern TLS 1.3 encryption, and auto-reload Nginx.

---

## 5. Daily Operations & Management Commands

All commands are run from `/opt/crms`:

| Operation | Command |
|---|---|
| **View Live Logs** | `docker compose logs -f` |
| **View API Server Logs** | `docker compose logs -f server` |
| **View Frontend Logs** | `docker compose logs -f client` |
| **Check Container Health** | `docker compose ps` |
| **Restart Application** | `docker compose restart` |
| **Stop All Services** | `docker compose down` |
| **Update Code & Redeploy** | `git pull && docker compose build && docker compose up -d` |

### Database Backup:
```bash
docker compose exec postgres pg_dump -U postgres ralix_crm > backup_$(date +%Y%m%d).sql
```

### Database Restore:
```bash
cat backup_file.sql | docker compose exec -T postgres psql -U postgres ralix_crm
```

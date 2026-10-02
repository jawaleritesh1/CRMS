#!/usr/bin/env bash
# ==============================================================================
# Ralix CRM — Let's Encrypt SSL Certificate Setup via Certbot
# ==============================================================================

set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <your-domain.com> <your-email@domain.com>"
  exit 1
fi

DOMAIN="$1"
EMAIL="$2"

echo "==> Requesting SSL certificate for $DOMAIN ($EMAIL)..."

# Ensure docker compose is running
docker compose up -d nginx

# Request certificate using certbot container
docker run -it --rm --name certbot \
  -v ralix_crm_certbot_conf:/etc/letsencrypt \
  -v ralix_crm_certbot_www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d "$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email

# Update nginx configuration with SSL template
cat <<EOF > ./nginx/default.conf
upstream server_upstream {
    server server:5000;
    keepalive 32;
}

upstream client_upstream {
    server client:3000;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 50M;

    # API endpoints
    location /api/ {
        proxy_pass http://server_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
        proxy_connect_timeout 10s;
    }

    # Next.js static asset caching
    location /_next/static/ {
        proxy_pass http://client_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        expires 365d;
        access_log off;
    }

    # Frontend client pages
    location / {
        proxy_pass http://client_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Reload nginx
docker compose exec nginx nginx -s reload

echo "==> SSL successfully configured for https://$DOMAIN !"

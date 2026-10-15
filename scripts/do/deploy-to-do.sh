#!/bin/bash
set -euo pipefail

APP_DIR="/var/www/gs.lean.unizik"
APP_NAME="gs.lean.unizik"
APP_PORT="3600"
DOMAIN="learn.unizik.edu.ng"
EMAIL="admin@unizik.edu.ng"
ARTIFACT_PATH="${ARTIFACT_PATH:-/tmp/standalone-deploy/standalone-artifact.tar.gz}"

echo "=== 1. Checking & Installing System Dependencies ==="
if ! command -v node >/dev/null 2>&1; then
    echo "Node.js not found. Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js is already installed ($(node -v))."
fi

if ! command -v nginx >/dev/null 2>&1; then
    echo "Nginx not found. Installing Nginx..."
    sudo apt install -y nginx
else
    echo "Nginx is already installed."
fi

if ! command -v pm2 >/dev/null 2>&1; then
    echo "PM2 not found. Installing PM2..."
    sudo npm install -g pm2
else
    echo "PM2 is already installed."
fi

echo "=== 2. Validating Deployment Artifact ==="
if [ ! -f "$ARTIFACT_PATH" ]; then
    echo "Deployment artifact not found at: $ARTIFACT_PATH"
    exit 1
fi

TMP_RELEASE_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_RELEASE_DIR"' EXIT
tar -xzf "$ARTIFACT_PATH" -C "$TMP_RELEASE_DIR"

if [ ! -f "$TMP_RELEASE_DIR/server.js" ]; then
    echo "Invalid artifact: missing standalone server.js after extraction."
    exit 1
fi

echo "=== 3. Updating Application Files (Standalone Runtime) ==="
sudo mkdir -p "$APP_DIR"
sudo rm -rf "$APP_DIR/.next" "$APP_DIR/public" "$APP_DIR/node_modules" "$APP_DIR/server.js"
sudo cp -a "$TMP_RELEASE_DIR/." "$APP_DIR/"

echo "Writing environment variables..."
if [ -n "${LOCAL_VARIABLES:-}" ]; then
    printf '%s\n' "$LOCAL_VARIABLES" | sudo tee "$APP_DIR/.env.production" >/dev/null
    sudo chmod 600 "$APP_DIR/.env.production"
else
    echo "Warning: LOCAL_VARIABLES is empty; keeping existing environment file if present."
fi

echo "=== 4. Configuring Nginx Reverse Proxy ==="
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
if [ ! -f "$NGINX_CONF" ]; then
    echo "Creating Nginx server block..."
    sudo bash -c "cat > $NGINX_CONF" << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    sudo ln -s "$NGINX_CONF" /etc/nginx/sites-enabled/ || true
fi
sudo nginx -t
sudo systemctl restart nginx

echo "=== 5. SSL Handling ==="
if command -v certbot >/dev/null 2>&1; then
    if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
        echo "Existing SSL certificate found. Attempting renewal check..."
        sudo certbot renew --quiet || echo "Warning: certbot renew failed; continuing deployment."
    else
        echo "No existing SSL cert for $DOMAIN. Skipping initial issuance in deploy script."
        echo "Create DNS A/AAAA records first, then run certbot manually:"
        echo "sudo certbot --nginx -d \"$DOMAIN\" --non-interactive --agree-tos -m \"$EMAIL\" --redirect"
    fi
else
    echo "Certbot not installed; skipping SSL certificate operations."
fi

echo "=== 6. Managing Application Process with PM2 ==="
export PORT="$APP_PORT"
cd "$APP_DIR"
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    echo "Restarting existing PM2 process..."
    pm2 restart "$APP_NAME" --update-env
else
    echo "Starting new PM2 process from standalone server..."
    pm2 start server.js --name "$APP_NAME" --cwd "$APP_DIR"
fi
pm2 save

echo "=== Deployment Complete! ==="
#!/bin/bash
set -e

APP_DIR="/var/www/gs.lean.unizik"
DOMAIN="learn.unizik.edu.ng"
EMAIL="admin@unizik.edu.ng"

echo "=== 1. Checking & Installing System Dependencies == "
# Check and install Node.js 20
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js is already installed ($(node -v))."
fi

# Check and install Nginx
if ! command -v nginx &> /dev/null; then
    echo "Nginx not found. Installing Nginx..."
    sudo apt install -y nginx
else
    echo "Nginx is already installed."
fi

# Check and install PM2
if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found. Installing PM2..."
    sudo npm install -g pm2
else
    echo "PM2 is already installed."
fi

echo "=== 2. Checking & Setting Up Swap Space == "
if [ ! -f /swapfile ]; then
    echo "Creating 2GB swap file..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
else
    echo "Swap space already exists."
fi

echo "=== 3. Deploying Application Artifacts == "
sudo mkdir -p "$APP_DIR"
cd "$APP_DIR"

echo "Writing environment variables..."
if [ -n "$LOCAL_VARIABLES" ]; then
    echo "$LOCAL_VARIABLES" > .env.production
    sudo chmod 600 .env.production
else
    echo "Warning: LOCAL_VARIABLES is empty."
fi

echo "=== 4. Configuring Nginx Reverse Proxy == "
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
if [ ! -f "$NGINX_CONF" ]; then
    echo "Creating Nginx server block..."
    sudo bash -c "cat > $NGINX_CONF" << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3600;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    sudo ln -s "$NGINX_CONF" /etc/nginx/sites-enabled/ || true
    sudo nginx -t
    sudo systemctl restart nginx
else
    echo "Nginx configuration already exists."
fi

echo "=== 4b. Setting Up SSL Certificate with Certbot ==="
if ! command -v certbot &> /dev/null; then
    echo "Certbot not found. Installing Certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
else
    echo "Certbot is already installed."
fi

if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "Requesting new SSL certificate from Let's Encrypt..."
    sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect
else
    echo "SSL certificate already exists. Checking for renewal..."
    sudo certbot renew --quiet
fi

echo "=== 5. Managing Application Process with PM2 == "
if pm2 list | grep -q "gs.lean.unizik"; then
    echo "Restarting existing PM2 process..."
    pm2 restart gs.lean.unizik
else
    echo "Starting new PM2 process from standalone server..."
    pm2 start server.js --name "gs.lean.unizik"
    pm2 startup || true
    pm2 save
fi

echo "=== Deployment Complete! ==="
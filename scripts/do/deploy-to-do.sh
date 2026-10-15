#!/bin/bash
set -e

APP_DIR="/var/www/gs.lean.unizik"
REPO_URL="https://github.com/qverselearninglms/learn.unizik.git"

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

echo "=== 3. Deploying Application Code == "
if [ ! -d "$APP_DIR" ]; then
    echo "Cloning repository..."
    sudo mkdir -p /var/www
    sudo git clone "$REPO_URL" "$APP_DIR"
else
    echo "Repository directory exists. Pulling latest code..."
    cd "$APP_DIR"
    git pull origin main
fi

cd "$APP_DIR"
echo "Installing project dependencies..."
npm install

echo "Building Next.js application..."
npm run build

echo "=== 4. Configuring Nginx Reverse Proxy == "
NGINX_CONF="/etc/nginx/sites-available/learn.unizik.edu.ng"
if [ ! -f "$NGINX_CONF" ]; then
    echo "Creating Nginx server block..."
    sudo bash -c "cat > $NGINX_CONF" << 'EOF'
server {
    listen 80;
    server_name learn.unizik.edu.ng;

    location / {
        proxy_pass http://localhost:3600;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
    sudo ln -s "$NGINX_CONF" /etc/nginx/sites-enabled/ || true
    sudo nginx -t
    sudo systemctl restart nginx
else
    echo "Nginx configuration already exists."
fi

echo "=== 5. Managing Application Process with PM2 == "
if pm2 list | grep -q "gs.lean.unizik"; then
    echo "Restarting existing PM2 process..."
    pm2 restart gs.lean.unizik
else
    echo "Starting new PM2 process..."
    pm2 start npm --name "gs.lean.unizik" -- start
    pm2 startup || true
    pm2 save
fi

echo "=== Deployment Complete! ==="
# Deployment Guide - Lashed by Amarah Booking App

Complete guide for deploying the booking application to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Frontend Deployment](#frontend-deployment)
3. [Backend Deployment](#backend-deployment)
4. [Database Setup](#database-setup)
5. [M-Pesa Configuration](#m-pesa-configuration)
6. [SSL/HTTPS Setup](#sslhttps-setup)
7. [Monitoring & Maintenance](#monitoring--maintenance)

## Pre-Deployment Checklist

### Backend Security
- [ ] Set `NODE_ENV=production`
- [ ] Use strong API keys and secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Implement rate limiting
- [ ] Set up logging and monitoring
- [ ] Remove debug logs
- [ ] Use environment variables for all secrets
- [ ] Implement input validation
- [ ] Set up error handling

### Frontend Security
- [ ] Remove demo buttons for production
- [ ] Disable console logging
- [ ] Update API endpoints to production
- [ ] Verify SSL certificate
- [ ] Test on all target browsers
- [ ] Optimize images and assets
- [ ] Minify CSS and JavaScript
- [ ] Set up CDN for static files

### M-Pesa Preparation
- [ ] Obtain production credentials from Safaricom
- [ ] Set up callback webhook URL
- [ ] Test STK Push in sandbox first
- [ ] Verify phone number formatting
- [ ] Set up SMS notifications
- [ ] Test full payment flow

## Frontend Deployment

### Option 1: Deploy on Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
cd lash-booking-app
netlify deploy

# Or connect to GitHub for automatic deploys
netlify connect
```

**netlify.toml configuration:**

```toml
[build]
  publish = "."
  command = ""

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### Option 2: Deploy on Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd lash-booking-app
vercel

# Set environment variables in Vercel dashboard
```

**vercel.json configuration:**

```json
{
  "public": true,
  "cleanUrls": true,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### Option 3: Deploy on AWS S3 + CloudFront

```bash
# Install AWS CLI
pip install awscli

# Create S3 bucket
aws s3 mb s3://lashed-by-amarah-booking

# Upload files
aws s3 sync . s3://lashed-by-amarah-booking/

# Create CloudFront distribution
# Set S3 bucket as origin
# Enable SSL/TLS
# Set custom domain
```

### Option 4: Deploy on Azure Static Web Apps

```bash
# Install Azure CLI
# Follow Azure documentation for setup

# Deploy with GitHub integration
# Push to repository, Azure automatically deploys
```

## Backend Deployment

### Option 1: Deploy on Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login

# Create new app
heroku create lashed-by-amarah-api

# Set environment variables
heroku config:set MPESA_CONSUMER_KEY=xxx
heroku config:set MPESA_CONSUMER_SECRET=xxx
heroku config:set DB_HOST=xxx
# ... set all other variables

# Add MySQL add-on (optional)
heroku addons:create cleardb:ignite

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Option 2: Deploy on Railway.app

```bash
# Login to Railway
railway login

# Create new project
railway init

# Link database
railway add mysql

# Deploy
railway up

# Set environment variables in dashboard
```

### Option 3: Deploy on AWS EC2

```bash
# Launch EC2 instance
# SSH into instance
ssh -i key.pem ec2-user@your-instance-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt-get install -y mysql-server

# Clone repository
git clone https://github.com/yourusername/repo.git
cd repo

# Install dependencies
npm install

# Install PM2
npm install -g pm2

# Start application
pm2 start server.js -i max

# Setup reverse proxy with Nginx
sudo apt-get install -y nginx
# Configure nginx.conf...

# Enable SSL with Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com
```

### Option 4: Deploy on DigitalOcean

```bash
# Create Droplet (Ubuntu 20.04)
# SSH into Droplet

# Setup Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Setup MySQL
sudo apt-get install -y mysql-server

# Clone and install
git clone https://github.com/yourusername/repo.git
cd repo && npm install

# Setup PM2
npm install -g pm2
pm2 start server.js
pm2 startup
pm2 save

# Setup Nginx reverse proxy
sudo apt-get install -y nginx
# Configure /etc/nginx/sites-available/default

# Setup SSL
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com
```

## Database Setup

### Create Database and Tables

```sql
-- Create database
CREATE DATABASE lash_bookings;
USE lash_bookings;

-- Create bookings table
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    service VARCHAR(50) NOT NULL,
    service_price INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(10) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    deposit_amount INT NOT NULL,
    total_amount INT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING_PAYMENT',
    mpesa_checkout_request_id VARCHAR(255),
    mpesa_receipt_number VARCHAR(255),
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_phone (phone_number),
    INDEX idx_date (appointment_date)
);

-- Create payment_transactions table
CREATE TABLE payment_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id VARCHAR(50) NOT NULL,
    amount INT NOT NULL,
    mpesa_code VARCHAR(255),
    status VARCHAR(50),
    response_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    INDEX idx_booking (booking_id)
);

-- Create customers table (optional)
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id VARCHAR(50) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    total_bookings INT DEFAULT 0,
    total_spent INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone (phone_number)
);

-- Create backups table (optional)
CREATE TABLE booking_backups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id VARCHAR(50),
    backup_data JSON,
    backup_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Set up backups
-- Example: mysqldump lash_bookings > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Database Backup Strategy

```bash
#!/bin/bash
# backup.sh - Daily database backup

BACKUP_DIR="/backups/mysql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/lash_bookings_$TIMESTAMP.sql"

# Create backup
mysqldump -u root -p$DB_PASSWORD lash_bookings > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_FILE.gz s3://your-bucket/backups/

echo "Backup completed: $BACKUP_FILE.gz"
```

## M-Pesa Configuration

### Obtain Production Credentials

1. **Register as M-Pesa Merchant**
   - Visit [Safaricom Daraja](https://developer.safaricom.co.ke/)
   - Create account
   - Register for production

2. **Get API Credentials**
   - Consumer Key
   - Consumer Secret
   - Business Short Code
   - Pass Key

3. **Configure Callback Webhook**
   - Set in Daraja Dashboard
   - Must be HTTPS
   - Must be publicly accessible
   - Example: `https://yourdomain.com/api/mpesa/callback`

### Test in Production

```bash
# Test STK Push
curl -X POST http://localhost:3000/api/mpesa/stkpush \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "254712345678",
    "amount": 500,
    "bookingId": "BK12345",
    "service": "hybrid",
    "date": "2024-06-01",
    "time": "10:00",
    "customerId": "CUST123"
  }'
```

## SSL/HTTPS Setup

### Using Let's Encrypt with Nginx

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renew
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verify renewal
sudo certbot renew --dry-run
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend
    location / {
        root /var/www/lash-booking-app;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring & Maintenance

### Setup Monitoring

```bash
# Install PM2 monitoring
pm2 install pm2-auto-pull
pm2 monitoring

# Setup error tracking (Sentry)
npm install @sentry/node
```

### Health Check Endpoint

Add to server.js (already included):

```javascript
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
```

Monitor with:

```bash
# Uptime monitoring (UptimeRobot)
# Add endpoint: https://yourdomain.com/health
# Check interval: 5 minutes
# Alert on down
```

### Logging Setup

```javascript
// logs.js
const fs = require('fs');
const path = require('path');

function log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        ...data
    };
    
    console.log(JSON.stringify(logEntry));
    
    // Write to file
    const logFile = path.join('/var/log/lash-booking', `${level}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

module.exports = { log };
```

### Automated Tasks (Cron)

```bash
# Update dependencies
0 0 * * 0 cd /path/to/app && npm update

# Backup database
0 3 * * * /path/to/backup.sh

# Clear old logs
0 4 * * 0 find /var/log/lash-booking -mtime +30 -delete

# Health check
*/5 * * * * curl -f https://yourdomain.com/health || /path/to/alert.sh
```

## Rollback Procedure

If something goes wrong:

```bash
# Stop application
pm2 stop server

# Restore from backup
git checkout previous_commit_hash
npm install
npm start

# Or restore database
mysql lash_bookings < backup_20240101_120000.sql

# Monitor logs
pm2 logs
```

## Performance Optimization

```bash
# Enable gzip compression in Nginx
gzip on;
gzip_types text/plain text/css text/javascript application/json;

# Enable caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Enable CDN (CloudFlare, Cloudfront, etc.)
# Point domain to CDN instead of server directly
```

## Support & Troubleshooting

### Common Issues

**M-Pesa callback not received**
- Verify callback URL is HTTPS
- Check firewall allows inbound traffic
- Verify URL in Daraja Dashboard

**Database connection errors**
- Check DB credentials
- Verify MySQL is running
- Check network connectivity

**High latency**
- Enable caching
- Use CDN
- Optimize database queries
- Scale horizontally

### Getting Help

- [Safaricom Daraja Support](https://developer.safaricom.co.ke/)
- [M-Pesa Documentation](https://developer.safaricom.co.ke/docs)
- [Your Infrastructure Provider Support]

---

**Deployment Date:** [Date]
**Deployed By:** [Your Name]
**Environment:** [Production/Staging]

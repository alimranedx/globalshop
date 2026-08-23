# GlobalShop — Deployment & Environment Setup Guide

This document provides complete, developer-grade instructions to configure, validate, and deploy **GlobalShop** across local development environments (Windows + Laragon / Generic), production Linux servers (Ubuntu + Nginx + PHP-FPM), and shared cPanel hosting environments (LiteSpeed / CloudLinux / Apache, e.g. `https://shopbusket.com/`).

---

## 📋 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites & System Requirements](#2-prerequisites--system-requirements)
3. [Environment Configuration Reference](#3-environment-configuration-reference)
4. [Local Development Deployment (Windows + Laragon)](#4-local-development-deployment-windows--laragon)
5. [Production Deployment Guide (Ubuntu Linux + Nginx)](#5-production-deployment-guide-ubuntu-linux--nginx)
6. [Database Setup & Seeding Reference](#6-database-setup--seeding-reference)
7. [Queue Worker & Scheduler Configuration](#7-queue-worker--scheduler-configuration)
8. [Cache & Performance Optimization](#8-cache--performance-optimization)
9. [Web Server Configuration Samples (Nginx & Apache)](#9-web-server-configuration-samples)
10. [Troubleshooting Guide](#10-troubleshooting-guide)
11. [cPanel / CloudLinux / LiteSpeed Shared Hosting Guide](#11-cpanel--cloudlinux--litespeed-shared-hosting-guide)
12. [Production Deployment Checklist](#12-production-deployment-checklist)
13. [Remaining Manual & Infrastructure Requirements](#13-remaining-manual--infrastructure-requirements)

---

## 1. Architecture Overview

GlobalShop is a multi-tenant SaaS e-commerce marketplace powered by a single **Laravel 13** backend. It serves three distinct frontend application panels built with **React 19**, **Redux Toolkit**, **Tailwind CSS v4**, and **Vite 8**:

| Panel | Root URL Path | Entry Files | Target Audience |
|---|---|---|---|
| **Public Marketplace** | `/` | `marketplace.blade.php` <br> `marketplace.jsx` | Guest shoppers, registered marketplace customers |
| **Multi-Tenant Shop Management** | `/shop/{slug}/*` | `shop.blade.php` <br> `shop.jsx` | Shop Owners, Shop Managers, POS Employees |
| **Platform Admin Console** | `/admin/*` | `admin.blade.php` <br> `admin.jsx` | Platform Super Admins, Platform Admins |

### Core Stack Requirements

* **Backend Framework:** Laravel ^13.8
* **PHP Runtime:** PHP ^8.3 (tested with PHP 8.3.16)
* **Frontend Framework:** React ^19.2, Redux Toolkit ^2.12, Tailwind CSS ^4.0, Vite ^8.0
* **Package Managers:** Composer ^2.8 (PHP), npm ^10.0 / ^11.0 (JavaScript)
* **Database Engine:** MySQL 8.0+ or MariaDB 10.4+
* **Session & Cache Driver:** Database / Redis / File
* **Queue Driver:** Database (`QUEUE_CONNECTION=database`) or Redis
* **Storage Engine:** Local Public Disk (`storage/app/public` symlinked or direct `public/storage`)
* **PDF Generator:** `barryvdh/laravel-dompdf` (^3.1)

---

## 2. Prerequisites & System Requirements

### Required PHP Extensions

The production PHP 8.3 CLI and PHP-FPM environments **MUST** have the following extensions installed and enabled:

* `bcmath` — Financial layout calculations and currency processing
* `ctype` — Character type checking
* `curl` — External API and webhook communications
* `dom` & `xml` — XML parsing and DOM document generation (PDF rendering)
* `fileinfo` — Mime-type detection for product images and uploads
* `filter` — Input data validation and filtering
* `gd` — Product image thumbnail generation and avatar processing
* `gmp` — High precision math calculations
* `intl` — Internationalization and currency formatting
* `mbstring` — Multibyte string support
* `mysqli` & `pdo_mysql` — MySQL database driver
* `pdo_sqlite` & `sqlite3` — In-memory database testing (required for PHPUnit suite)
* `openssl` — Data encryption, HTTPS, and session tokens
* `session` — HTTP session persistence
* `tokenizer` — PHP source code tokenizing (Laravel container)
* `zip` — Archive extraction and export handling

### Required System Utilities

* **Git:** Version control
* **Composer 2:** PHP dependency manager
* **Node.js (20.x or 24.x LTS):** Frontend asset compilation
* **MySQL Server 8.0+ / MariaDB 10.4+:** Relational database storage
* **Supervisor:** Production queue process management (Linux VPS/Dedicated)
* **Cron:** Task scheduler execution
* **Nginx, Apache 2.4, or LiteSpeed:** Web server with URL rewrite engine

---

## 3. Environment Configuration Reference

Create `.env` from `.env.example` using `copy .env.example .env` (Windows) or `cp .env.example .env` (Linux).

Below is the complete configuration matrix for GlobalShop:

| Variable | Required | Default / Example | Environment Scope | Description |
|---|---|---|---|---|
| `APP_NAME` | Yes | `GlobalShop` | All | Application name displayed in titles, emails, and headers. |
| `APP_ENV` | Yes | `local` / `production` | All | `local`, `staging`, or `production`. Controls error detail exposure. |
| `APP_KEY` | Yes | `base64:...` | All | 32-character AES encryption key generated via `php artisan key:generate`. |
| `APP_DEBUG` | Yes | `true` (Local) / `false` (Prod) | All | Enables debug backtraces. **MUST be `false` in production.** |
| `APP_URL` | Yes | `http://localhost` / `https://shopbusket.com` | All | Canonical URL of the application. Required for asset & route generation. |
| `DB_CONNECTION` | Yes | `mysql` | All | Database driver (`mysql` for dev/prod, `sqlite` for automated testing). |
| `DB_HOST` | Yes | `127.0.0.1` | All | Database host address. |
| `DB_PORT` | Yes | `3306` | All | Database server port. |
| `DB_DATABASE` | Yes | `globalshop` | All | Name of the database. |
| `DB_USERNAME` | Yes | `root` / `cpaneluser_dbuser` | All | Database username. |
| `DB_PASSWORD` | Yes | *(secret)* | All | Database user password. |
| `SESSION_DRIVER` | Yes | `database` | All | Session handler (`database`, `redis`, `file`). Defaults to database table. |
| `SESSION_LIFETIME` | Optional | `120` | All | Session timeout duration in minutes. |
| `QUEUE_CONNECTION` | Yes | `database` | All | Background job driver (`database`, `redis`, `sync`). |
| `CACHE_STORE` | Yes | `database` | All | Cache storage layer (`database`, `redis`, `file`). |
| `FILESYSTEM_DISK` | Yes | `public` / `local` | All | Storage driver. Use `public` for web accessible uploads. |
| `FILESYSTEM_PUBLIC_ROOT` | Optional | `/home/user/public_html/storage` | Shared Hosting | Direct filesystem path for cPanel/LiteSpeed environments. |
| `BROADCAST_CONNECTION`| Optional | `log` | All | WebSocket / Event broadcasting driver. |
| `MAIL_MAILER` | Optional | `log` / `smtp` | Local / Prod | Mail driver (`log` for dev, `smtp` for production). |
| `MAIL_HOST` | Optional | `127.0.0.1` / `smtp.mailgun.org` | Prod | SMTP server hostname. |
| `MAIL_PORT` | Optional | `2525` / `587` | Prod | SMTP server port. |
| `MAIL_USERNAME` | Optional | `null` | Prod | SMTP auth username. |
| `MAIL_PASSWORD` | Optional | `null` | Prod | SMTP auth password. |
| `MAIL_FROM_ADDRESS`| Optional | `hello@example.com` | Prod | Default sender email address. |
| `MAIL_FROM_NAME` | Optional | `${APP_NAME}` | Prod | Default sender name. |
| `REDIS_HOST` | Optional | `127.0.0.1` | Prod | Redis server IP (if using Redis for cache/queue). |
| `REDIS_PORT` | Optional | `6379` | Prod | Redis server port. |
| `VITE_APP_NAME` | Yes | `${APP_NAME}` | All | Exposes app name to Vite React frontend bundle. |

---

## 4. Local Development Deployment (Windows + Laragon)

Follow these steps to set up GlobalShop locally on Windows using Laragon (or generic PHP/MySQL setup):

### Step 1: Clone Repository & Open Directory

```powershell
cd C:\laragon\www
git clone https://github.com/alimranedx/globalshop.git
cd globalshop
git checkout dev
```

### Step 2: Configure `.env` File

```powershell
copy .env.example .env
```

Ensure the database settings in `.env` match your local MySQL:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=globalshop
DB_USERNAME=root
DB_PASSWORD=
```

### Step 3: Install PHP Dependencies

```powershell
composer install
```

### Step 4: Generate Application Key

```powershell
php artisan key:generate
```

### Step 5: Install Frontend Dependencies

```powershell
npm install
```

### Step 6: Create Local Database

Open your MySQL terminal or Laragon MySQL tool and execute:

```sql
CREATE DATABASE IF NOT EXISTS `globalshop` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 7: Run Migrations & Seed Data

```powershell
php artisan migrate
php artisan db:seed
```

### Step 8: Create Public Storage Link

```powershell
php artisan storage:link
```

### Step 9: Compile Frontend Assets

```powershell
npm run build
```

### Step 10: Launch Local Development Servers

You can launch all development services simultaneously using the built-in Composer script:

```powershell
composer run dev
```

*(This command uses `concurrently` to run `php artisan serve`, `php artisan queue:listen`, and `npm run dev` in parallel).*

### Step 11: Access Local Interfaces

* **Public Marketplace:** `http://localhost:8000/` (or `http://globalshop.test/` via Laragon VirtualHost)
* **Easy Login & Role Switcher (Local Dev Hub):** `http://localhost:8000/shop/easy-login`
* **Shop Alpha Management SPA:** `http://localhost:8000/shop/alpha/dashboard`
* **Admin Console:** `http://localhost:8000/admin/login`

---

## 5. Production Deployment Guide (Ubuntu Linux + Nginx)

This section provides a step-by-step guide to deploying GlobalShop on a fresh **Ubuntu 22.04 LTS / 24.04 LTS** VPS or dedicated server.

### Step 1: Update System & Install Base Packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip software-properties-common ca-certificates lsb-release supervisor cron
```

### Step 2: Install PHP 8.3 & Required Extensions

```bash
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.3-cli php8.3-fpm php8.3-mysql php8.3-mbstring \
  php8.3-xml php8.3-curl php8.3-gd php8.3-zip php8.3-bcmath php8.3-intl \
  php8.3-gmp php8.3-sqlite3 php8.3-redis
```

Verify PHP installation:

```bash
php -v
php -m
```

### Step 3: Install Composer 2

```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
composer --version
```

### Step 4: Install Node.js (20.x LTS) & npm

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### Step 5: Install & Secure MySQL Server

```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

### Step 6: Create Production Database and Dedicated Database User

Log in to MySQL as root:

```bash
sudo mysql -u root
```

Execute the database creation commands:

```sql
CREATE DATABASE globalshop_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'globalshop_user'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON globalshop_prod.* TO 'globalshop_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 7: Clone Repository & Set Up Directory Structure

```bash
cd /var/www
sudo git clone https://github.com/alimranedx/globalshop.git globalshop
cd /var/www/globalshop
sudo git checkout dev
```

### Step 8: Set File Ownership & Directory Permissions

The web server (`www-data`) must own the project directory and have full write permissions for `storage/` and `bootstrap/cache/`:

```bash
sudo chown -R www-data:www-data /var/www/globalshop
sudo find /var/www/globalshop -type f -exec chmod 644 {} \;
sudo find /var/www/globalshop -type d -exec chmod 755 {} \;
sudo chmod -R 775 /var/www/globalshop/storage /var/www/globalshop/bootstrap/cache
```

### Step 9: Install Composer Dependencies (Production Mode)

```bash
sudo -u www-data composer install --no-dev --optimize-autoloader
```

### Step 10: Configure Production `.env` File

Copy the environment template:

```bash
sudo -u www-data cp .env.example .env
```

Edit `.env` using your preferred editor:

```bash
sudo nano .env
```

Update key configuration parameters:

```env
APP_NAME=GlobalShop
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=globalshop_prod
DB_USERNAME=globalshop_user
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE

SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database
FILESYSTEM_DISK=public
```

### Step 11: Generate Application Encryption Key

```bash
sudo -u www-data php artisan key:generate
```

### Step 12: Install Node Dependencies & Build Production Assets

```bash
sudo -u www-data npm ci
sudo -u www-data npm run build
```

### Step 13: Execute Database Migrations

```bash
sudo -u www-data php artisan migrate --force
```

*(Optional for initial demo/staging data: `sudo -u www-data php artisan db:seed --force`).*

### Step 14: Create Storage Symlink

```bash
sudo -u www-data php artisan storage:link
```

### Step 15: Optimize Laravel Production Caches

```bash
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache
sudo -u www-data php artisan event:cache
```

---

## 6. Database Setup & Seeding Reference

GlobalShop includes dedicated seeders for initial system roles, demo shops, catalog products, and sample sales context:

| Seeder Class | Description |
|---|---|
| `DatabaseSeeder.php` | Main entry point seeder. |
| `ProductionMockDataSeeder.php` | Seeds 20 categories, 20 brands, sample products, and logo placeholders. |
| `CatalogTestSeeder.php` | Seeds 24 shop-scoped categories and 24 shop-scoped brands for Shop Alpha. |
| `CatalogExtraSeeder.php` | Seeds additional catalog test items across multiple categories. |
| `SampleProductsSeeder.php` | Seeds initial Smartwatch and Earbuds demo products with images. |

### Default Accounts & Credentials

When testing or initial setup is complete, default credentials available in the database (or created via seeders) include:

* **Platform Super Admin:** `superadmin@marketplace.com` / Password: `password`
* **Platform Admin:** `grace@marketplace.com` / Password: `password`
* **Shop Alpha Owner:** `john@alpha.com` / Password: `password`
* **Shop Alpha Manager:** `bob@alpha.com` / Password: `password`
* **Shop Alpha Sales POS:** `sam@alpha.com` / Password: `password`
* **Customer Account:** `alice@customer.com` / Password: `password`

---

## 7. Queue Worker & Scheduler Configuration

### 7.1 Queue Worker Setup (Supervisor)

GlobalShop relies on background queue processing for order notifications, analytics, and tenant background jobs (`QUEUE_CONNECTION=database`).

Create a Supervisor configuration file `/etc/supervisor/conf.d/globalshop-worker.conf`:

```ini
[program:globalshop-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/globalshop/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/globalshop/storage/logs/worker.log
stopwaitsecs=3600
```

Load and start the worker daemon:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start globalshop-worker:*
```

### 7.2 Scheduled Tasks Setup (Cron)

Laravel's task scheduler handles periodic background routines (analytics aggregation, session cleanup, ticket SLA checks).

Edit the `www-data` crontab:

```bash
sudo crontab -u www-data -e
```

Add the following line:

```cron
* * * * * cd /var/www/globalshop && php artisan schedule:run >> /dev/null 2>&1
```

---

## 8. Cache & Performance Optimization

### Production Optimization Commands

Run these commands after every deployment or configuration update:

```bash
# Clear all cached states first
php artisan optimize:clear

# Re-cache configuration, routes, views, and events
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

### Clearing Caches During Troubleshooting

If configuration or route changes do not appear immediately:

```bash
php artisan optimize:clear
```

---

## 9. Web Server Configuration Samples

### 9.1 Nginx Configuration (`/etc/nginx/sites-available/globalshop`)

> [!IMPORTANT]
> The Nginx `root` directive MUST point directly to `/var/www/globalshop/public` (the `public` subdirectory), NOT to `/var/www/globalshop`.

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/globalshop/public;
    index index.php index.html;

    charset utf-8;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    # Log Locations
    access_log /var/log/nginx/globalshop-access.log;
    error_log  /var/log/nginx/globalshop-error.log error;

    # Maximum Upload Size
    client_max_body_size 64M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    # Pass PHP scripts to PHP-FPM
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    # Deny access to hidden files (.env, .git, etc.)
    location ~ /\.ht {
        deny all;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Enable site and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/globalshop /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 9.2 SSL Certificate Setup (Certbot / Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 9.3 Apache VirtualHost Sample (`/etc/apache2/sites-available/globalshop.conf`)

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /var/www/globalshop/public

    <Directory /var/www/globalshop/public>
        Options Indexes FollowSymLinks MultiViews
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/globalshop-error.log
    CustomLog ${APACHE_LOG_DIR}/globalshop-access.log combined
</VirtualHost>
```

---

## 10. Troubleshooting Guide

### 1. Issue: `could not find driver (Connection: sqlite, Database: :memory:)` when running `php artisan test`

* **Cause:** The PHP CLI runtime does not have the `pdo_sqlite` or `sqlite3` extensions enabled in `php.ini`.
* **Solution:** Edit `php.ini` (e.g. `C:\laragon\bin\php\php-8.3\php.ini` or `/etc/php/8.3/cli/php.ini`) and uncomment / add:
  ```ini
  extension=pdo_sqlite
  extension=sqlite3
  ```

### 2. Issue: `SQLSTATE[HY000] [1049] Unknown database 'globalshop'`

* **Cause:** The MySQL database defined in `.env` has not been created on the database server.
* **Solution:** Create the database using MySQL CLI or phpMyAdmin:
  ```sql
  CREATE DATABASE globalshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```

### 3. Issue: HTTP 500 Server Error or `The stream or file ".../storage/logs/laravel.log" could not be opened in append mode: Failed to open stream: Permission denied`

* **Cause:** Web server process (`www-data` or cPanel user) lacks write permissions to `storage/` or `bootstrap/cache/`.
* **Solution:** Fix permissions on server:
  ```bash
  chmod -R 775 storage bootstrap/cache
  ```

### 4. Issue: React SPA routes return 404 on page refresh (e.g. refreshing `/shop/alpha/dashboard` or `/admin`)

* **Cause:** The web server configuration is missing fallbacks to `index.php`.
* **Solution:**
  * **Nginx:** Ensure `try_files $uri $uri/ /index.php?$query_string;` is inside the `location /` block.
  * **Apache / LiteSpeed (.htaccess):** Ensure `RewriteCond %{REQUEST_FILENAME} !-f` and `RewriteRule ^ index.php [L]` are present.

### 5. Issue: `Vite manifest not found at [.../public/build/manifest.json]`

* **Cause:** Frontend assets have not been compiled using Vite.
* **Solution:** Run `npm run build` locally, and ensure the compiled `build/` folder is uploaded to the server's public web root (`public_html/build/` or `public/build/`).

### 6. Issue: `CSRF token mismatch` or `419 Page Expired` on Form / API Requests

* **Cause:** `APP_URL` in `.env` does not match the exact scheme (`http://` vs `https://`) or domain being accessed, or `.htaccess` is stripping `X-XSRF-TOKEN` headers.
* **Solution:** Set `APP_URL=https://yourdomain.com` in `.env` and verify that `.htaccess` includes:
  ```apache
  RewriteCond %{HTTP:x-xsrf-token} .
  RewriteRule .* - [E=HTTP_X_XSRF_TOKEN:%{HTTP:X-XSRF-Token}]
  ```

### 7. Issue: Uploaded Images return HTTP 404 on cPanel / CloudLinux / LiteSpeed

* **Cause:** LiteSpeed web server with CageFS disallows following symlinks pointing outside the document root `/home/username/public_html/`.
* **Solution:** Configure `FILESYSTEM_PUBLIC_ROOT=/home/username/public_html/storage` in `.env` and create a real directory `/home/username/public_html/storage` (`0755` permissions) with `logos/`, `products/`, and `avatars/` subdirectories.

---

## 11. cPanel / CloudLinux / LiteSpeed Shared Hosting Guide

GlobalShop is fully compatible with shared cPanel hosting running CloudLinux and LiteSpeed Web Server (such as `https://shopbusket.com/`).

### 11.1 Architecture & Directory Separation

To ensure absolute security and protect configuration files (`.env`, `vendor/`, `database/`), we keep the application core **outside** `public_html` and place only web-accessible assets inside `public_html`:

```
/home/cpaneluser/
├── globalshop/                   # Application Core (outside public web root)
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── resources/
│   ├── routes/
│   ├── storage/
│   ├── vendor/
│   ├── .env                      # Production environment file
│   └── artisan
│
└── public_html/                  # Web Document Root
    ├── .htaccess                 # PHP 8.3 LiteSpeed handler & HTTPS rewrites
    ├── index.php                 # Front controller loading ../globalshop/bootstrap/app.php
    ├── favicon.ico
    ├── robots.txt
    ├── build/                    # Compiled Vite assets (assets/, manifest.json)
    └── storage/                  # Direct public storage directory (0755 permissions)
        ├── avatars/
        ├── logos/
        └── products/
```

---

### 11.2 Step-by-Step cPanel Deployment Process

#### Step 1: Prepare Files Locally on Your Machine
1. Open your local terminal in the project directory:
   ```bash
   composer install --no-dev --optimize-autoloader
   npm install
   npm run build
   ```
2. Prepare two ZIP archives for upload:
   * **`core_app.zip`**: Contains `app/`, `bootstrap/`, `config/`, `database/`, `resources/`, `routes/`, `storage/`, `vendor/`, `artisan`, `.env.example`. *(Exclude `node_modules/` and `public/`)*.
   * **`public_html.zip`**: Contains the entire contents of the `public/` directory (`build/`, `favicon.ico`, `robots.txt`, `index.php`, `.htaccess`).

---

#### Step 2: Configure PHP 8.3 & Extensions in cPanel
1. In cPanel, navigate to **Select PHP Version** (or **MultiPHP Manager**).
2. Set PHP version to **8.3**.
3. Under the **Extensions** tab, ensure the following are enabled:
   * `pdo_mysql`, `mysqli`, `bcmath`, `curl`, `fileinfo`, `gd`, `intl`, `mbstring`, `xml`/`dom`, `zip`, `openssl`.

---

#### Step 3: Create MySQL Database & User in cPanel
1. Open **MySQL Databases** in cPanel.
2. **Create New Database:** e.g., `cpaneluser_globalshop`.
3. **Create New User:** e.g., `cpaneluser_dbuser` with a secure password.
4. **Add User to Database:** Assign `cpaneluser_dbuser` to `cpaneluser_globalshop` and check **ALL PRIVILEGES**.

---

#### Step 4: Upload & Extract Files via cPanel File Manager
1. Open **cPanel File Manager**.
2. In `/home/cpaneluser/`:
   * Create a folder named `globalshop`.
   * Upload `core_app.zip` into `globalshop/` and click **Extract**.
3. In `/home/cpaneluser/public_html/`:
   * Upload `public_html.zip` and click **Extract**.
   * Create a directory named `storage` with permissions `0755`.
   * Inside `storage/`, create subfolders: `avatars/`, `logos/`, and `products/`.

---

#### Step 5: Configure Front Controller (`public_html/index.php`)
Open and edit `/home/cpaneluser/public_html/index.php`:

```php
<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../globalshop/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../globalshop/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
(require_once __DIR__.'/../globalshop/bootstrap/app.php')
    ->handleRequest(Request::capture());
```

---

#### Step 6: Configure `.htaccess` (`public_html/.htaccess`)
Open and edit `/home/cpaneluser/public_html/.htaccess`:

```apache
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
<IfModule mime_module>
  AddHandler application/x-httpd-alt-php83___lsphp .php .php8 .phtml
</IfModule>
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END

Options +FollowSymLinks -MultiViews -Indexes

<IfModule mod_rewrite.c>
    RewriteEngine On

    # Force HTTPS Redirect
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Handle X-XSRF-Token Header
    RewriteCond %{HTTP:x-xsrf-token} .
    RewriteRule .* - [E=HTTP_X_XSRF_TOKEN:%{HTTP:X-XSRF-Token}]

    # Redirect Trailing Slashes If Not A Folder...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller (SPA Fallback)
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
```

---

#### Step 7: Configure Environment File (`globalshop/.env`)
In `/home/cpaneluser/globalshop/`, copy `.env.example` to `.env` and set:

```env
APP_NAME=GlobalShop
APP_ENV=production
APP_KEY=base64:YOUR_GENERATED_APP_KEY_HERE
APP_DEBUG=false
APP_URL=https://shopbusket.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cpaneluser_globalshop
DB_USERNAME=cpaneluser_dbuser
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE

SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database

FILESYSTEM_DISK=public
FILESYSTEM_PUBLIC_ROOT=/home/cpaneluser/public_html/storage
```

---

#### Step 8: Execute Migrations & Cache Initialization

##### Method A: Using cPanel Terminal / SSH (Recommended)
Open **Terminal** in cPanel and execute:

```bash
cd /home/cpaneluser/globalshop
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force
php artisan optimize
```

##### Method B: Without Terminal / SSH (File Manager & phpMyAdmin)
1. Generate an `APP_KEY` locally on your development machine (`php artisan key:generate --show`) and paste it into `.env`.
2. On your local machine, export the database schema and seed data to a `.sql` file using phpMyAdmin or CLI:
   ```bash
   mysqldump -u root globalshop > database_backup.sql
   ```
3. Open **phpMyAdmin** in cPanel, select `cpaneluser_globalshop`, and click **Import** to upload `database_backup.sql`.

---

#### Step 9: Configure Task Scheduler (cPanel Cron Jobs)
1. In cPanel, navigate to **Cron Jobs**.
2. Under **Add New Cron Job**, select **Once Per Minute** (`* * * * *`).
3. Enter the command:
   ```bash
   * * * * * cd /home/cpaneluser/globalshop && php artisan schedule:run >> /dev/null 2>&1
   ```
4. Click **Add New Cron Job**.

---

## 12. Production Deployment Checklist

Before announcing production launch, verify each item:

- [x] PHP 8.3 installed with required extensions (`bcmath`, `curl`, `gd`, `intl`, `mbstring`, `pdo_mysql`, `pdo_sqlite`, `zip`)
- [x] MySQL database created with `utf8mb4` collation
- [x] Repository cloned / uploaded to production server directory (`/var/www/globalshop` or `/home/cpaneluser/globalshop`)
- [x] Correct Git branch (`dev` / `main`) checked out
- [x] `.env` file configured with `APP_ENV=production` and `APP_DEBUG=false`
- [x] Production database credentials configured and tested
- [x] `php artisan key:generate` executed
- [x] `composer install --no-dev --optimize-autoloader` completed cleanly
- [x] `npm ci` and `npm run build` executed successfully
- [x] `php artisan migrate --force` executed (all migration batches completed)
- [x] Public storage directory configured (`public/storage` or `FILESYSTEM_PUBLIC_ROOT`)
- [x] Directory permissions set to `775` for `storage` & `bootstrap/cache`
- [x] Production caches built (`config:cache`, `route:cache`, `view:cache`)
- [x] All 74 automated tests passed (`php artisan test`)
- [x] Image upload & public serving verified over HTTPS
- [x] Marketplace (`/`), Shop Management (`/shop/*`), and Admin (`/admin/*`) SPAs tested in browser

---

## 13. Remaining Manual & Infrastructure Requirements

The following tasks require external infrastructure setup by the system administrator or devops engineer:

1. **DNS Domain Configuration:** Point A and AAAA DNS records for `yourdomain.com` / `shopbusket.com` to the server's public IP address.
2. **Production SSL Provisioning:** Issue HTTPS certificates (AutoSSL / Let's Encrypt / Certbot) for domain names.
3. **Mail Service Provider Setup:** Configure production SMTP credentials in `.env` (`MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`).
4. **Third-Party AWS S3 Credentials (Optional):** If using S3 for persistent cloud asset storage instead of local disk storage, configure `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`, and `AWS_BUCKET` in `.env`.

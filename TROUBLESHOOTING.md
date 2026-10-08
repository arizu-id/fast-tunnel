# 🛠️ Troubleshooting & Frequently Asked Questions (FAQ)

This guide provides solutions to common issues when installing, configuring, and operating **Fast Tunnel**.

---

## 📑 Quick Navigation

- [1. Installation & Environment Issues](#1-installation--environment-issues)
  - [Installer shows 404 Not Found](#installer-shows-404-not-found)
  - [Missing PHP Extensions](#missing-php-extensions)
  - [Database Connection Error in Step 2](#database-connection-error-in-step-2)
- [2. SSH Web Terminal Issues](#2-ssh-web-terminal-issues)
  - [Terminal hangs or shows no output (SSE Buffering)](#terminal-hangs-or-shows-no-output-sse-buffering)
  - [SSH Connection Refused or Authentication Failed](#ssh-connection-refused-or-authentication-failed)
  - [Terminal output is misaligned or broken](#terminal-output-is-misaligned-or-broken)
- [3. FTP & File Manager Issues](#3-ftp--file-manager-issues)
  - [File Upload fails with "413 Payload Too Large"](#file-upload-fails-with-413-payload-too-large)
  - [FTP Directory listing is blank (Passive Mode)](#ftp-directory-listing-is-blank-passive-mode)
- [4. MySQL Database Manager Issues](#4-mysql-database-manager-issues)
  - [Remote MySQL connection denied](#remote-mysql-connection-denied)
  - [MySQL 8.0 `caching_sha2_password` issue](#mysql-80-caching_sha2_password-issue)
- [5. Permission & Directory Issues](#5-permission--directory-issues)

---

## 1. Installation & Environment Issues

### Installer shows 404 Not Found
**Cause**: URL rewriting is not enabled on your web server.
- **For Apache**: Ensure `mod_rewrite` is enabled and `AllowOverride All` is set in your Apache VirtualHost configuration:
  ```bash
  sudo a2enmod rewrite
  sudo systemctl restart apache2
  ```
- **For Nginx**: Ensure your configuration passes requests through `index.php` using the [nginx.sample.conf](nginx.sample.conf) template.

### Missing PHP Extensions
Fast Tunnel requires `pdo_mysql`, `openssl`, `curl`, and `zip`.
- **Ubuntu/Debian**:
  ```bash
  sudo apt-get update
  sudo apt-get install php-mysql php-curl php-zip php-mbstring php-xml
  sudo systemctl restart apache2 # or php-fpm
  ```
- **RHEL/CentOS/Rocky Linux**:
  ```bash
  sudo dnf install php-mysqlnd php-curl php-zip php-mbstring php-xml
  sudo systemctl restart httpd # or php-fpm
  ```

### Database Connection Error in Step 2
- Verify that your MySQL server is running and accessible on host/port specified (`127.0.0.1` vs `localhost`).
- Verify that the database user has `ALL PRIVILEGES` on the specified database name:
  ```sql
  GRANT ALL PRIVILEGES ON fast_tunnel.* TO 'fasttunnel'@'localhost' IDENTIFIED BY 'your_password';
  FLUSH PRIVILEGES;
  ```

---

## 2. SSH Web Terminal Issues

### Terminal hangs or shows no output (SSE Buffering)
**Cause**: The web server or reverse proxy is buffering Server-Sent Events (SSE).

- **Nginx Solution**: Add the following directives inside your PHP location block:
  ```nginx
  fastcgi_buffering off;
  proxy_buffering off;
  ```
- **Cloudflare / CDN Solution**: If you are using Cloudflare, disable buffering or bypass caching for the `/api.php` route.

### SSH Connection Refused or Authentication Failed
- Ensure the remote SSH server is reachable and port 22 (or custom port) is open in the firewall.
- If using SSH Key authentication, ensure the private key is in OpenSSH or PEM format and has no corrupted line breaks.

### Terminal output is misaligned or broken
- Ensure your browser window has adequate resolution.
- Fast Tunnel automatically sends resize events (`cols` and `rows`). If you are running `tmux` or `screen`, detach and reattach to synchronize window dimensions.

---

## 3. FTP & File Manager Issues

### File Upload fails with "413 Payload Too Large"
**Cause**: PHP or web server maximum post size limit reached.
- In `php.ini`, increase the limits:
  ```ini
  upload_max_filesize = 100M
  post_max_size = 100M
  memory_limit = 256M
  ```
- In Nginx, add:
  ```nginx
  client_max_body_size 100M;
  ```

### FTP Directory listing is blank (Passive Mode)
- Ensure the FTP server supports passive mode (`PASV`) and has the required passive port ranges open in its firewall (e.g. ports 40000-50000).

---

## 4. MySQL Database Manager Issues

### Remote MySQL connection denied
- Many MySQL installations default to binding only to `127.0.0.1`. In `/etc/mysql/mysql.conf.d/mysqld.cnf`, change `bind-address` to `0.0.0.0` or your Fast Tunnel server's IP address.
- Grant remote access to the MySQL user:
  ```sql
  GRANT ALL PRIVILEGES ON *.* TO 'username'@'fast_tunnel_server_ip' IDENTIFIED BY 'password';
  FLUSH PRIVILEGES;
  ```

### MySQL 8.0 `caching_sha2_password` issue
If running older PHP versions (< 7.4.4) against MySQL 8.0, update the user to use `mysql_native_password`:
```sql
ALTER USER 'username'@'%' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;
```

---

## 5. Permission & Directory Issues

Ensure that the web server user (`www-data`, `apache`, or `nginx`) has write permissions to runtime folders:
```bash
chmod -R 775 temp_ssh/
chmod -R 775 plugins/
chown -R www-data:www-data temp_ssh/ plugins/
```

---

## ❓ Need More Help?

- 💬 Join [GitHub Discussions](https://github.com/arizu-id/fast-tunnel/discussions) to ask the community.
- 🐛 Open a [Bug Report](https://github.com/arizu-id/fast-tunnel/issues) if you have discovered an issue in the software.

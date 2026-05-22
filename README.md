# Fast Tunnel

A self-hosted, browser-based web client for managing FTP file transfers, MySQL databases, and SSH terminal sessions from a single responsive dashboard — no desktop software required.

![PHP](https://img.shields.io/badge/PHP-7.4%2B-777BB4?style=flat-square&logo=php&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?style=flat-square&logo=bootstrap&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-10b981?style=flat-square)

---

## Overview

Fast Tunnel consolidates tools that typically require separate desktop installations — FileZilla, phpMyAdmin, PuTTY — into a single PHP application that runs on your own server and is accessible from any browser.

Built for developers, system administrators, and hosting providers who need portable server access without local software dependencies.

## Features

**FTP File Manager**
- Browse, upload, download, rename, delete files and folders
- Drag-and-drop file upload
- Right-click context menu
- Built-in code editor powered by Monaco Editor (same engine as VS Code)

**MySQL Database Client**
- Browse tables and column structures
- Run custom SQL queries with inline editor
- Add, edit, and drop columns
- Update and delete rows through an interactive data grid

**SSH Web Terminal**
- Fully interactive PTY terminal via xterm.js
- Real-time streaming with Server-Sent Events (SSE)
- Adaptive polling to reduce CPU usage when idle

**Session Management**
- Save multiple FTP, MySQL, and SSH connections
- Export sessions to encrypted JSON for backup or cross-device portability
- Optional password protection on export/import

**Security**
- AES-256-GCM encryption for all stored credentials — never written to disk in plaintext
- CSRF token required on every API request
- SQL identifier whitelist to prevent injection via table/column name inputs
- Login rate limiting per IP address
- Directory lockdown via `.htaccess` on temporary session files

**Guided Web Installer**
- Multi-step installation wizard
- Creates database and tables automatically — no manual SQL import

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | PHP 7.4+, PDO, phpseclib3 |
| Frontend | Vanilla JS (ES Modules), jQuery, Bootstrap 5 |
| Terminal | xterm.js + Server-Sent Events |
| Editor | Monaco Editor |
| Security | AES-256-GCM, CSRF tokens |

## Requirements

- PHP 7.4 or higher (PHP 8.x recommended)
- MySQL 5.7+ or MariaDB 10.3+
- PHP extensions: `pdo_mysql`, `openssl`, `curl`
- Apache or Nginx with write permission on the application root

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/arizu-id/fast-tunnel.git
   cd fast-tunnel
   ```

2. Install PHP dependencies:
   ```bash
   composer install
   ```

3. Place the project folder inside your web server root (e.g. `htdocs/` or `www/`).

4. Open your browser and navigate to:
   ```
   http://localhost/fast-tunnel/install/
   ```

5. Follow the installation wizard:
   - Step 1: System requirements check
   - Step 2: Database configuration
   - Step 3: Create admin account

6. Log in and start adding connections.

> After installation, delete or restrict access to the `install/` directory.

## Configuration

The installer generates `config.php` automatically. Do not commit this file — it contains your database credentials and encryption key.

```
config.php       ← auto-generated, gitignored
installed.lock   ← created after successful install, gitignored
```

To reset the installation, delete both files and revisit `/install/`.

## Plugin System

Fast Tunnel includes a modular plugin architecture. Drop a plugin folder into `plugins/` and it loads automatically.

**Included (free):**
- `ping_monitor` — checks reachability and latency of saved server hosts

**Premium plugins** (sold separately) are available for additional functionality such as multi-language support, visual themes, and proxied connections.

To install a plugin:
```
plugins/
└── your_plugin/
    ├── plugin.js
    ├── plugin.css
    └── plugin.php   (optional backend)
```

## Security Notes

- `config.php` and `temp_ssh/` are gitignored by default — never commit them
- All session passwords are encrypted with AES-256-GCM before storage
- Credentials are decrypted only at the moment a connection is established
- Rotate your `ENCRYPTION_KEY` in `config.php` if you suspect it has been exposed:
  ```bash
  php -r "echo bin2hex(random_bytes(32));"
  ```

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: your feature description"`
4. Push to your fork: `git push origin feature/your-feature`
5. Open a Pull Request

Please do not commit `config.php`, `installed.lock`, or any files inside `temp_ssh/`.

## License

This project is licensed under the [MIT License](LICENSE).

You are free to use, modify, and distribute this software for personal or commercial projects. See the [LICENSE](LICENSE) file for full terms.

---

Made by [Arizu Studio](https://arizu.id)

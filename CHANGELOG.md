# Changelog

All notable changes to the **Fast Tunnel** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Security
- Table names are quoted in `MysqlClient::getTableData/getTableColumns` (they were interpolated unescaped).
- Removed the unused, guessable `CSRF_SECRET` (`md5(__DIR__)`) from `config.sample.php`.
- Plugin ZIP uploads are capped at 1000 files / 50 MB uncompressed.
- `DROP DATABASE` requires typing the database name (server-side `confirm_name` check as well).
- The SSH daemon deletes its session file (encrypted password) and keystroke buffer as soon as the shell ends.

### Changed
- MySQL connections are persistent (`FT_MYSQL_PERSISTENT=false` to disable); errors are logged to the server log and unexpected failures return a JSON 500 instead of a blank page.
- Deleting a folder in the file manager is now recursive (the confirmation says so).
- One request feeds both the DB sidebar and the Structure tab; JS/CSS cache-busting uses file modification times and revalidates with ETags.
- `ssh_connect` verifies the new credentials *before* stopping the running terminal.

### Fixed
- FTP: directory listings from servers without MLSD (e.g. vsftpd) produced corrupted names (`"09 09:28 folder"`); listing a missing directory now errors instead of returning an empty list.
- SSH terminal: the daemon never noticed when the remote shell exited (`exit`) and kept running for up to an hour.
- Installer: `db_name_enc TEXT DEFAULT ''` failed on MySQL < 8.0.13 / strict MariaDB (`1101 BLOB, TEXT ... can't have a default value`); it is now `DEFAULT NULL`.
- MySQL client: delete rows, drop table, truncate, drop column(s) and edit row/column buttons had no JavaScript handlers and did nothing. They are now wired up, along with the Structure tab (`selectDatabase`).
- Added the missing **Drop Database** action (`mysql_drop_database`; system schemas are protected).
- Table/column identifiers may now contain characters such as `-` (only backticks and control characters are rejected).

### Added
- **Two-factor authentication** (TOTP) with QR setup, replay protection, encrypted secret and recovery codes.
- **Audit log** (table `audit_log`, viewer in the *More* menu).
- **SFTP** sessions (`SftpClient`, password login; "/" is the login directory).
- **File manager**: upload queue with progress/cancel/retry and folder drops, Ctrl/Shift multi-select with bulk delete/move/ZIP, folder ZIP download, recursive folder delete, name search.
- **MySQL**: CSV/SQL export, `.sql`/`.csv` import (CSV in one transaction), create database/table, Format SQL, `Ctrl+Enter`, query history, sortable grid, composite primary keys.
- Schema `Migrations` runner so existing installs upgrade automatically (SFTP enum, audit table, 2FA columns).
- Test suites (PHP unit, API integration against real MySQL/MariaDB/FTP/SFTP/SSH, Playwright) and GitHub Actions CI.
- Per-element loading animation (`modules/loading.js`) for FTP create/rename/move/delete/upload, MySQL actions, session CRUD/import/export/connect and plugin delete. Confirm/prompt modals keep their button spinning until the request finishes.

### Planned
- Multi-user Role-Based Access Control (Admin vs Operator roles).
- SSH key authentication; AWS S3 storage adapter.
- Web-based RDP and VNC remote desktop client modules.

---

## [1.0.1] - 2025-02-15

### 🔒 Security
- **Plugin Installer Hardening**: Resolved CWE-434 arbitrary file upload & Zip-Slip path traversal vulnerability in plugin upload mechanism (Reported via VulDB #990501).
- **Execution Lockdown**: Added strict web server `.htaccess` and Nginx rewrite rules blocking direct execution of `.php` scripts in `plugins/`, `backend/`, `temp_ssh/`, and `scratch/`.
- **Extension Allowlist**: Enforced strict archive extraction filtering (excluding executable `.php`, `.phar`, `.phtml`, `.env`, `.htaccess`, `.sh`, `.bat`, `.exe` files from plugin packages).

### ✨ Added
- **Monaco Code Editor Shortcut**: Added `Ctrl+S` / `Cmd+S` keyboard shortcut to save active file buffers instantly.
- **PTY Daemon SSE Resilience**: Improved Server-Sent Events (SSE) reconnection logic for SSH terminals with adaptive idle polling.
- **SQL Console Pagination**: Added limit offsets and pagination controls for large database table queries.

### 🐛 Fixed
- Fixed session export decryption failures when special characters are included in master passwords.
- Fixed MySQL connection timeout handling when connecting to remote databases across high-latency networks.

---

## [1.0.0] - 2025-01-10

### 🚀 Initial Release
- **All-in-One Self-Hosted Workspace**: Seamless unified web interface consolidating FTP, MySQL, and SSH clients.
- **Interactive SSH Web Terminal**: Real-time terminal powered by `xterm.js` and `phpseclib3` PTY daemon with ANSI color palette support.
- **Full-featured FTP File Manager**: Monaco Code Editor integration, drag-and-drop file upload, context menu, and recursive directory tree.
- **Visual MySQL Database Client**: Query runner, table structure inspector, pagination, inline row edit and bulk delete.
- **AES-256-GCM Session Vault**: Client and server side encryption for storing multiple connection profiles.
- **Extensible Plugin Engine**: Modular plugin loader supporting frontend assets and backend PHP hooks.
- **Guided 3-Step Web Installer**: Easy setup wizard with automated dependency checking and encryption key generation.

---

[Unreleased]: https://github.com/arizu-id/fast-tunnel/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/arizu-id/fast-tunnel/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/arizu-id/fast-tunnel/releases/tag/v1.0.0

# 🗺️ Fast Tunnel Roadmap & Future Vision

This roadmap outlines the planned features, enhancements, and milestones for **Fast Tunnel**. Priorities are determined by community feedback, security demands, and development viability.

---

## 🎯 Release Milestones

### 🟢 Version 1.0 (Current Stable - Released)
- [x] Consolidate FTP, MySQL, and SSH clients into a unified single-page dashboard.
- [x] Interactive SSH Web Terminal (`xterm.js` + `phpseclib3` PTY + Server-Sent Events).
- [x] Monaco Code Editor integration with `Ctrl+S` saving.
- [x] Zero-plaintext AES-256-GCM credential vault.
- [x] Modular plugin engine with ZIP package manager.
- [x] Guided 3-step web installer.
- [x] Security patch for CWE-434 / Zip-Slip (v1.0.1).

---

### 🟡 Version 1.1 (Next Release - In Progress)
- [ ] **Docker Hub Automated Image**: Official 1-click Docker container (`docker run -p 8080:80 arizu/fast-tunnel`).
- [ ] **SQLite Embedded Database Mode**: Option to run Fast Tunnel without needing an external MySQL instance for local app storage.
- [ ] **Two-Factor Authentication (2FA)**: Time-based One-Time Passwords (TOTP / Google Authenticator) for admin login.
- [ ] **SFTP Protocol Adapter**: Direct SFTP support using SSH keys alongside traditional FTP/FTPS.
- [ ] **Dark / Light / OLED Theme Switcher**: Native theme toggle built directly into the core navigation bar.

---

### 🔵 Version 1.2 (Planned)
- [ ] **Multi-Tab Terminal Sessions**: Open and manage multiple simultaneous SSH terminals side-by-side.
- [ ] **Database Import & Export**: One-click SQL dump export (`.sql`, `.sql.gz`) and SQL file upload runner.
- [ ] **File Archive Tools**: Compress to ZIP/TAR and decompress remote server archives directly in the web file manager.
- [ ] **Audit Logging & Activity History**: Detailed audit trail for logins, connection attempts, and file operations.
- [ ] **Internationalization (i18n)**: Out-of-the-box support for English, Indonesian, Spanish, Japanese, and German.

---

### 🟣 Version 2.0 (Long-Term Vision)
- [ ] **Multi-User Role-Based Access Control (RBAC)**: Admin, Operator, and Read-Only roles with granular session permissions.
- [ ] **Web-based RDP / VNC Remote Desktop**: Direct graphical remote desktop viewer in the browser via WebSockets.
- [ ] **Cloud Storage Drivers**: Mount AWS S3, Google Cloud Storage, and WebDAV providers into the file manager.
- [ ] **Webhook & Notification Alerts**: Discord, Slack, and Telegram notifications for server status alerts and ping monitors.
- [ ] **Cluster Management**: Group servers by tags, environments (Production, Staging, Dev), and cloud providers.

---

## 💡 Have an Idea?

Have a feature request that isn't on this roadmap? Let us know!
- Open a [Feature Request on GitHub](https://github.com/arizu-id/fast-tunnel/issues/new?template=feature_request.yml)
- Start a discussion in [GitHub Discussions](https://github.com/arizu-id/fast-tunnel/discussions)

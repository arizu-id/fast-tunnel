Item Name:    Fast Tunnel - Multi-Protocol Web Client (FTP, MySQL & SSH)
Item Version: 1.0.0
Author:       Arizu Studio
Author URL:   https://arizu.id
Support:      arizu.team@gmail.com

---
REQUIREMENTS
---
- PHP 7.4 or higher (PHP 8.x recommended)
- Apache with mod_rewrite enabled
- XAMPP / LAMP / LEMP stack
- OpenSSL PHP extension (for AES-256-GCM credential encryption)
- Composer (for phpseclib3 SSH library)

---
INSTALLATION
---
1. Upload the entire project folder to your web server root (e.g. htdocs/ or www/).
2. Open your browser and navigate to: http://your-server/install/
3. Enter your Envato purchase code when prompted.
4. The installer will verify your license via RSA-signed response and create the admin account.
5. After installation completes, the install/ directory is automatically locked.
6. Log in with the credentials you set during installation.

---
GETTING STARTED
---
- FTP:   Click "Add New Connection" → select FTP → enter host, port, user, password.
- MySQL: Click "Add New Connection" → select MySQL → enter host, port, user, password, database.
- SSH:   Click "Add New Connection" → select SSH → enter host, port, user, password.

All credentials are encrypted with AES-256-GCM before being stored in your session.

---
SECURITY NOTES
---
- Credentials are never stored in plaintext. All passwords are encrypted with AES-256-GCM.
- License verification uses RSA 2048-bit asymmetric cryptography to prevent bypass.
- Direct access to temp_ssh/ and tempcodecanyon/ is blocked via .htaccess.
- CSRF protection is active on all API endpoints.

---
DOCUMENTATION
---
Full documentation is available offline at: documentation/dokumentasi.html

---
CHANGELOG
---
v1.0.0 (2026-05-22)
- Initial release
- FTP file manager with drag-and-drop upload, rename, delete, and context menu
- MySQL client with table browser, SQL editor, row editor, and column manager
- SSH terminal with real-time PTY streaming via xterm.js
- AES-256-GCM credential encryption for all session passwords
- RSA-signed license verification system
- Plugin system for extending functionality (plugins sold separately)
- Ping Checker plugin included free
- Multi-language support (i18n)
- Dark/light theme toggle
- Session import/export with optional password protection

---
SUPPORT
---
For support requests, please email: arizu.team@gmail.com
Please include your Envato purchase code and a description of the issue.

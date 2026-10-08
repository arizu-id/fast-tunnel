# Contributing to Fast Tunnel

First off, thank you for considering contributing to **Fast Tunnel**! 🎉 Projects like this thrive because of people like you who build, fix, and improve open-source tools for developers and system administrators around the world.

Please take a moment to review this document in order to make the contribution process easy and effective for everyone involved.

---

## 📑 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [How Can I Contribute?](#-how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Contributing Code / Pull Requests](#contributing-code--pull-requests)
  - [Building Plugins](#building-plugins)
- [Development Setup](#-development-setup)
- [Coding Standards & Conventions](#-coding-standards--conventions)
- [Git Workflow & Commit Guidelines](#-git-workflow--commit-guidelines)
- [Security Disclosures](#-security-disclosures)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by the [Fast Tunnel Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to **`ariefzufar@arizu.id`**.

---

## 🚀 How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please check existing [GitHub Issues](https://github.com/arizu-id/fast-tunnel/issues) to avoid duplicates.

When filing an issue, please use the **Bug Report** template and include:
1. **Clear description**: What went wrong?
2. **Steps to reproduce**: Minimal steps to replicate the bug.
3. **Environment**: Web server (Apache/Nginx/Docker), PHP version, browser version, and OS.
4. **Relevant logs**: Browser console errors or PHP error logs.

> ⚠️ **Security Warning**: NEVER post passwords, active session tokens, private keys, or actual database credentials in public issue reports!

### Suggesting Enhancements

Feature requests are very welcome! Please use the **Feature Request** template to explain:
- The problem you are trying to solve or workflow you want to streamline.
- Your proposed solution or how you envision the feature working.
- Any alternative solutions or workarounds you have considered.

### Contributing Code / Pull Requests

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/fast-tunnel.git
   cd fast-tunnel
   ```
3. **Create a new branch** with a descriptive name:
   ```bash
   git checkout -b feature/awesome-terminal-theme
   # or
   git checkout -b fix/mysql-table-export-charset
   ```
4. **Make your changes** and write clean, commented code.
5. **Lint and validate** your PHP code:
   ```bash
   composer lint
   ```
6. **Commit your changes** following the Conventional Commits format (see below).
7. **Push to your fork** and submit a **Pull Request** to the `main` branch.

---

## 🛠️ Development Setup

You can run Fast Tunnel locally using either Docker or PHP's built-in web server.

### Option A: Docker (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/arizu-id/fast-tunnel.git
cd fast-tunnel

# 2. Start stack (Fast Tunnel + MySQL)
docker-compose up -d --build

# 3. Open your browser
# Fast Tunnel: http://localhost:8080/install/
# MySQL Port: localhost:3307
```

### Option B: Local PHP & Apache / PHP-FPM

```bash
# 1. Install dependencies via Composer
composer install

# 2. Start PHP development server (for rapid UI/API testing)
php -S localhost:8000

# 3. Open browser
# Navigate to: http://localhost:8000/install/
```

---

## 📏 Coding Standards & Conventions

To maintain a clean and maintainable codebase:

### Backend (PHP)
- Adhere to **[PSR-12](https://www.php-fig.org/psr/psr-12/)** coding standards.
- Use strict typing where applicable (`declare(strict_types=1);`).
- Keep database operations parameterized using **PDO prepared statements** (`?` or named placeholders) to eliminate SQL injection risks.
- Ensure all sensitive data (passwords, host info) is encrypted with `AES-256-GCM` using the helper functions in `backend/api_helpers.php`.
- Always validate CSRF tokens on state-modifying requests (`POST`, `PUT`, `DELETE`).

### Frontend (HTML/CSS/JavaScript)
- Clean, semantic HTML5.
- Modular vanilla JavaScript (ES6+) or lightweight libraries.
- Avoid unnecessary external weight; keep bundle sizes lean.
- Escape all dynamic user input when rendering to DOM to protect against Cross-Site Scripting (XSS).

---

## 💬 Git Workflow & Commit Guidelines

We recommend the **[Conventional Commits](https://www.conventionalcommits.org/)** specification:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

### Types:
- `feat`: A new feature for the user
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `sec`: Security improvements or vulnerability patches
- `chore`: Changes to the build process or auxiliary tools

### Examples:
```bash
git commit -m "feat(ssh): add support for ANSI true color 24-bit palette"
git commit -m "fix(ftp): resolve path normalization on Windows IIS servers"
git commit -m "sec(plugins): harden zip extraction validation against path traversal"
```

---

## 🔒 Security Disclosures

If you discover a security vulnerability, **please do not disclose it publicly**. Send a confidential email to **`ariefzufar@arizu.id`**. See our [Security Policy](SECURITY.md) for more information and details about our Hall of Fame.

---

Thank you for helping make Fast Tunnel the best self-hosted server management dashboard! 🚀

# Security Policy

At **Fast Tunnel**, security is our utmost priority. As a tool designed to manage remote servers, SSH credentials, FTP filesystems, and databases, protecting user environments and sensitive credentials from unauthorized access is central to our engineering decisions.

---

## 🛡️ Supported Versions

We provide security updates and patches for the following versions:

| Version | Supported          | Release Status | Notes |
| ------- | ------------------ | -------------- | ----- |
| **1.0.x** | :white_check_mark: | Active         | Latest stable release (v1.0.1+) |
| < 1.0.0 | :x:                | Deprecated     | Legacy development builds |

---

## 🔒 Security Architecture Highlights

Fast Tunnel is built with multiple defense-in-depth safeguards:

1. **Zero-Plaintext Credential Storage**:
   - Stored session credentials (passwords, private SSH keys, database credentials) are encrypted with **AES-256-GCM** authenticated cipher before persistence.
   - Each deployment generates a cryptographically unique 256-bit encryption key (`ENCRYPTION_KEY`) during initial setup.

2. **Session & CSRF Protection**:
   - All state-changing actions (`POST`, `PUT`, `DELETE`) require a valid `X-CSRF-Token` header bound to the authenticated PHP session.

3. **Brute Force Protection**:
   - Authentication endpoints enforce sliding-window IP rate limiting (5 failed attempts per 15 minutes).

4. **Malicious File & Web Shell Lockdown**:
   - Web server rules (`.htaccess` and `nginx.sample.conf`) block direct execution of `.php` scripts in storage, scratch, and plugin subdirectories (`plugins/`, `backend/`, `temp_ssh/`, `scratch/`).
   - Plugin ZIP extractions validate target paths using canonical `realpath` checks and strict file extension allowlists to defend against Zip-Slip and arbitrary file upload attacks (CWE-434).

---

## 🚨 Reporting a Vulnerability

If you believe you have found a security vulnerability in Fast Tunnel, please report it to us as described below. **Do not create public GitHub issues for security vulnerabilities.**

### 📧 How to Report:
- Send an email to **`ariefzufar@arizu.id`** with the subject **`[Fast Tunnel Security Report] - <Brief Title>`**.
- If desired, you may encrypt your communication or request our public PGP key.

### 📋 What to Include:
1. **Description**: Clear description of the vulnerability and its potential impact.
2. **Steps to Reproduce / Proof of Concept (PoC)**: Detailed step-by-step instructions or scripts to replicate the issue safely.
3. **Affected Versions**: Fast Tunnel version and environment setup where the issue was reproduced.
4. **Suggested Remediation**: Any recommended fixes or code patches (optional but appreciated).

---

## ⏱️ Response Timeline

When a report is received:
1. **Initial Acknowledgment**: Within **24 to 48 hours**.
2. **Assessment & Confirmation**: Within **3 to 5 business days**.
3. **Patch Development & Release**: A fix will be developed, tested, and released as an expedited patch version.
4. **Public Disclosure**: Coordinated public disclosure after the patch has been published and users have had time to update.

---

## 🎖️ Security Hall of Fame

We believe in recognizing the hard work and diligence of researchers who responsibly disclose security vulnerabilities to us.

| Researcher / Reporter | Identification / CVE | Vulnerability Summary | Status |
|---|---|---|---|
| **VulDB & Research Community** | Submission #990501 | CWE-434 Unrestricted File Upload & Zip-Slip validation bypass in plugin upload engine | 🟢 Patched (v1.0.1) |

If you responsibly report a confirmed vulnerability, you will be permanently credited in this Hall of Fame and the project's [`README.md`](README.md).

---

Thank you for contributing to the security and safety of the open-source community! 🛡️

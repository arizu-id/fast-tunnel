# Fast Tunnel Architecture & Design Internals

This document details the architectural principles, data flow, cryptographic model, and component layout of **Fast Tunnel**.

---

## 🏛️ High-Level System Architecture

Fast Tunnel operates as a **Single-Page Application (SPA)** frontend talking to a unified **PHP API Gateway** (`api.php`). It bridges web browsers to traditional system protocols (FTP, SSH/PTY, MySQL) securely through modern web technologies.

```mermaid
flowchart TB
    subgraph Client ["Client Tier (Browser)"]
        UI["SPA Web Dashboard\n(Bootstrap 5 + Custom Modern UI)"]
        XTERM["xterm.js Terminal\n(SSE Stream Consumer)"]
        MONACO["Monaco Code Editor\n(VS Code Core)"]
        GRID["Database Data Grid\n& SQL Console"]
    end

    subgraph Gateway ["API & Security Gateway"]
        APIGW["api.php Central Router"]
        AUTH["Auth & Rate Limiter\n(CSRF & Session Verification)"]
        CRYPTO["AES-256-GCM\nEncryption Engine"]
    end

    subgraph Adapters ["Backend Protocol Adapters"]
        FTP_ADAPTER["FtpClient.php\n(Streams & Sockets)"]
        MYSQL_ADAPTER["MysqlClient.php\n(PDO Prepared Queries)"]
        SSH_ADAPTER["SshClient.php &\nSshStream.php (Daemon)"]
        PLUGIN_MGR["Plugin Engine\n(Auto Loader & Hooks)"]
    end

    subgraph Targets ["Remote Targets & Storage"]
        LOCAL_DB[("Local App DB\nEncrypted Sessions")]
        REMOTE_SSH["Remote SSH Server\n(PTY Shell)"]
        REMOTE_FTP["Remote FTP Server\n(Filesystem)"]
        REMOTE_DB[("Remote MySQL\nDatabase")]
    end

    UI -->|AJAX Fetch + CSRF Token| APIGW
    XTERM -->|Server-Sent Events (SSE)| APIGW
    MONACO -->|File Save / Load API| APIGW
    GRID -->|SQL Query API| APIGW

    APIGW --> AUTH
    AUTH --> CRYPTO
    APIGW --> FTP_ADAPTER
    APIGW --> MYSQL_ADAPTER
    APIGW --> SSH_ADAPTER
    APIGW --> PLUGIN_MGR

    CRYPTO <--> LOCAL_DB
    SSH_ADAPTER <-->|IPC Pipes & phpseclib3| REMOTE_SSH
    FTP_ADAPTER <-->|FTP Protocol| REMOTE_FTP
    MYSQL_ADAPTER <-->|PDO Driver| REMOTE_DB
```

---

## 🔐 Cryptography & Session Vault Model

### 1. Zero-Plaintext at Rest
All remote host credentials (hostnames, usernames, passwords, private SSH keys, database names) are stored in the local application database strictly in an encrypted state:
- **Cipher**: `AES-256-GCM` (Galois/Counter Mode).
- **Authentication**: GCM ensures ciphertext confidentiality and tamper-proof data authenticity via an authentication tag.
- **Key Generation**: 256-bit cryptographic entropy generated via `random_bytes(32)` during installation and saved in `config.php` (`ENCRYPTION_KEY`).
- **In-Memory Decryption**: Credentials are only decrypted in PHP memory for the duration of the executing request or background process.

### 2. Export / Import Portable Backups
When exporting session profiles:
- Data is encrypted with a user-supplied passphrase using `PBKDF2` (Password-Based Key Derivation Function 2) with 100,000 iterations + SHA-256 salt before generating the downloadable JSON envelope.

---

## 💻 SSH Web Terminal & PTY Streaming Internals

Running interactive CLI commands (like `htop`, `vim`, `nano`, `bash`) over HTTP poses a unique challenge because HTTP is stateless, whereas terminal sessions require persistent PTY allocation and bi-directional real-time communication.

Fast Tunnel solves this through a **Decoupled Background PTY Daemon + Server-Sent Events (SSE)** model:

```
[Browser xterm.js]
       │
       ├─► POST api.php?action=ssh_input  ──► [Writes to temp_ssh/{id}.in]
       │                                                    │
       │                                                    ▼
       │                                     [SshStream.php Daemon]
       │                                        (phpseclib3 PTY)
       │                                                    │
       │                                                    ▼
       ├─◄ GET api.php?action=ssh_stream ◄─── [Reads from temp_ssh/{id}.out]
       │   (SSE Text Stream, Event: data)                   ▲
       │                                                    │
       ▼                                                    │
[User interacts with terminal]                    [Remote SSH Server]
```

1. **Session Spawn**: `api_ssh.php` spawns a background PHP daemon (`SshStream.php`) connected to the remote SSH server with PTY mode enabled via `phpseclib3`.
2. **IPC Channel**: Dedicated isolated FIFO/file pipes in `temp_ssh/` handle input (`{id}.in`) and output (`{id}.out`).
3. **SSE Feed**: The browser connects to `api.php?action=ssh_stream` via `EventSource`. The server streams output chunks in real time without continuous HTTP polling overhead.
4. **Window Resizing**: Dynamic `cols` and `rows` resize events are transmitted over the API and applied to the remote PTY on window change.

---

## 📁 FTP & File Manager Engine

The FTP component (`backend/FtpClient.php`) provides full filesystem operations:
- **Chunked File Streaming**: Large file uploads and downloads are handled in chunks to bypass PHP memory limit constraints.
- **Monaco Code Editor**: Direct integration with Monaco Editor for high-performance syntax highlighting, multi-cursor editing, and indentation matching.
- **Context-Aware Safety**: Prevents directory traversal outside permitted FTP roots and cleans paths safely.

---

## 🗄️ MySQL Client Engine

The MySQL component (`backend/MysqlClient.php` & `backend/api_mysql.php`) delivers phpMyAdmin-style capabilities with zero overhead:
- **Dynamic Connection Binding**: Creates dynamic PDO connections using decrypted session credentials.
- **Visual Table & Column Schema Inspector**: Inspects indexes, foreign keys, data types, and primary keys.
- **Safe Execution & Parameterization**: Paginated SELECT queries with customizable limit offsets and inline record updating.

---

## 🧩 Plugin Engine Architecture

The plugin architecture allows third parties to extend Fast Tunnel without modifying core code:

```
plugins/
└── <plugin_slug>/
    ├── info.json       # Metadata & config
    ├── plugin.js       # Frontend hooks & custom UI components
    ├── plugin.css      # Custom styles
    └── plugin.php      # Backend hooks & API endpoints
```

- **Auto-Discovery**: `api_plugins.php` discovers active plugins and automatically registers their frontend assets in `views/layout.php`.
- **Sandbox Security**: Execution of direct `.php` files inside `plugins/` over HTTP is strictly prohibited by `.htaccess` and Nginx. Backend hooks are only invoked internally by the verified `api.php` controller.

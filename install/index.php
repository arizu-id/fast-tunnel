<?php
/**
 * Fast Tunnel — Installation Wizard
 * Self-contained multi-step installer with modern dark UI.
 */

// If already installed, block access
$rootDir = dirname(__DIR__);
if (file_exists($rootDir . '/installed.lock') && file_exists($rootDir . '/config.php')) {
    echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Fast Tunnel</title></head><body style="background:#0a0a0c;color:#e4e4e7;font-family:Inter,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center"><div><h2>⚠️ Already Installed</h2><p style="color:#a1a1aa">Fast Tunnel is already installed. For security, please delete the <code style="background:#27272a;padding:2px 8px;border-radius:4px">install/</code> folder.</p><a href="/" style="color:#10b981;margin-top:20px;display:inline-block">← Go to Fast Tunnel</a></div></body></html>';
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Fast Tunnel — Installation</title>
<link href="/assets/vendor/fonts/inter.css" rel="stylesheet">
<link href="/assets/vendor/bootstrap-icons/bootstrap-icons.min.css" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--accent:#10b981;--accent-dim:rgba(16,185,129,0.08);--surface-0:#0a0a0c;--surface-1:#18181b;--surface-2:#1e1e22;--surface-3:#27272a;--border:#3f3f46;--text:#e4e4e7;--text-muted:#a1a1aa;--text-dim:#71717a;--red:#ef4444;--green:#10b981;--amber:#f59e0b}
body{background:var(--surface-0);color:var(--text);font-family:'Inter',system-ui,-apple-system,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.installer{width:100%;max-width:580px}
.installer-card{background:var(--surface-1);border:1px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.5)}
.installer-header{padding:28px 32px 20px;border-bottom:1px solid var(--border);background:var(--surface-2)}
.installer-header h1{font-size:1.3rem;font-weight:700;background:linear-gradient(135deg,#10b981,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.installer-header p{color:var(--text-muted);font-size:0.82rem;margin-top:4px}
.installer-body{padding:28px 32px}
.installer-footer{padding:16px 32px;border-top:1px solid var(--border);background:var(--surface-2);display:flex;justify-content:space-between;align-items:center}
/* Steps indicator */
.steps{display:flex;gap:6px;margin-bottom:24px}
.step-dot{width:100%;height:4px;border-radius:4px;background:var(--surface-3);transition:background 0.3s}
.step-dot.active{background:var(--accent)}
.step-dot.done{background:var(--green)}
/* Form */
.form-group{margin-bottom:16px}
.form-group label{display:block;font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:6px}
.form-group input{width:100%;padding:10px 14px;background:var(--surface-0);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:0.85rem;font-family:inherit;outline:none;transition:border-color 0.2s}
.form-group input:focus{border-color:var(--accent)}
.form-group input::placeholder{color:var(--text-dim)}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
/* Buttons */
.btn{padding:10px 24px;border:none;border-radius:8px;font-size:0.82rem;font-weight:600;font-family:inherit;cursor:pointer;transition:all 0.2s;display:inline-flex;align-items:center;gap:6px}
.btn-primary{background:var(--accent);color:#fff}
.btn-primary:hover{filter:brightness(1.1)}
.btn-primary:disabled{opacity:0.5;cursor:not-allowed}
.btn-secondary{background:var(--surface-3);color:var(--text-muted);border:1px solid var(--border)}
.btn-secondary:hover{background:var(--surface-2)}
.btn-danger{background:var(--red);color:#fff}
/* Check list */
.check-list{list-style:none;padding:0}
.check-item{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:8px;margin-bottom:6px;background:var(--surface-2);font-size:0.82rem;border:1px solid transparent}
.check-item.pass{border-color:rgba(16,185,129,0.15)}
.check-item.fail{border-color:rgba(239,68,68,0.15);background:rgba(239,68,68,0.04)}
.check-item.warning{border-color:rgba(245,158,11,0.15);background:rgba(245,158,11,0.04)}
.check-name{font-weight:500}
.check-value{font-size:0.75rem;font-family:'SF Mono',Consolas,monospace}
.check-value .pass-icon{color:var(--green)}
.check-value .fail-icon{color:var(--red)}
/* Alert */
.alert{padding:12px 16px;border-radius:8px;font-size:0.82rem;margin-bottom:16px;display:none}
.alert-error{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#fca5a5}
.alert-success{background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);color:#6ee7b7}
.alert-warning{background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);color:#fcd34d}
/* Spinner */
.spinner{width:16px;height:16px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin 0.6s linear infinite;display:inline-block}
@keyframes spin{to{transform:rotate(360deg)}}
/* Completion */
.completion{text-align:center;padding:20px 0}
.completion .icon{font-size:3.5rem;color:var(--green);margin-bottom:12px}
.completion h2{font-size:1.2rem;margin-bottom:8px}
.completion p{color:var(--text-muted);font-size:0.85rem;line-height:1.6}
.warning-box{background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:14px 18px;margin:16px 0;text-align:left}
.warning-box strong{color:var(--amber)}
.warning-box p{color:var(--text-muted);font-size:0.78rem;margin-top:4px}
/* Transition */
.step-panel{display:none}
.step-panel.active{display:block;animation:fadeIn 0.3s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
</style>
</head>
<body>
<div class="installer">
    <div class="installer-card">
        <div class="installer-header">
            <h1><i class="bi bi-lightning-charge-fill"></i> Fast Tunnel — Installer</h1>
            <p>Follow the steps below to install Fast Tunnel on your server.</p>
        </div>
        <div class="installer-body">
            <div class="steps">
                <div class="step-dot active" id="dot0"></div>
                <div class="step-dot" id="dot1"></div>
                <div class="step-dot" id="dot2"></div>
                <div class="step-dot" id="dot3"></div>
                <div class="step-dot" id="dot4"></div>
            </div>

            <!-- Step 0: System Check -->
            <div class="step-panel active" id="step0">
                <h3 style="font-size:0.95rem;margin-bottom:4px"><i class="bi bi-gear me-1"></i> System Requirements</h3>
                <p style="color:var(--text-muted);font-size:0.78rem;margin-bottom:16px">Checking your server environment...</p>
                <ul class="check-list" id="checkList">
                    <li class="check-item"><span class="check-name"><span class="spinner"></span> Running checks...</span></li>
                </ul>
                <div class="alert alert-error" id="checkError"></div>
            </div>

            <!-- Step 1: License -->
            <div class="step-panel" id="step1">
                <h3 style="font-size:0.95rem;margin-bottom:4px"><i class="bi bi-key me-1"></i> License Verification</h3>
                <p style="color:var(--text-muted);font-size:0.78rem;margin-bottom:16px">Enter your CodeCanyon purchase code to verify your license.</p>
                <div class="alert alert-error" id="licenseError"></div>
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" id="licenseEmail" placeholder="your@email.com" required>
                </div>
                <div class="form-group">
                    <label>Purchase Code</label>
                    <input type="text" id="licenseCode" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required>
                </div>
                <p style="font-size:0.72rem;color:var(--text-dim)"><i class="bi bi-info-circle me-1"></i> Find your purchase code in your <a href="https://codecanyon.net/downloads" target="_blank" style="color:var(--accent)">CodeCanyon Downloads</a> page.</p>
            </div>

            <!-- Step 2: Database -->
            <div class="step-panel" id="step2">
                <h3 style="font-size:0.95rem;margin-bottom:4px"><i class="bi bi-database me-1"></i> Database Configuration</h3>
                <p style="color:var(--text-muted);font-size:0.78rem;margin-bottom:16px">Enter your MySQL database credentials.</p>
                <div class="alert alert-error" id="dbError"></div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Database Host</label>
                        <input type="text" id="dbHost" value="localhost" required>
                    </div>
                    <div class="form-group">
                        <label>Database Port</label>
                        <input type="number" id="dbPort" value="3306" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Database Name</label>
                    <input type="text" id="dbName" placeholder="fast_tunnel" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Database Username</label>
                        <input type="text" id="dbUser" placeholder="root" required>
                    </div>
                    <div class="form-group">
                        <label>Database Password</label>
                        <input type="password" id="dbPass" placeholder="(leave blank if none)">
                    </div>
                </div>
            </div>

            <!-- Step 3: Admin -->
            <div class="step-panel" id="step3">
                <h3 style="font-size:0.95rem;margin-bottom:4px"><i class="bi bi-person-badge me-1"></i> Admin Account</h3>
                <p style="color:var(--text-muted);font-size:0.78rem;margin-bottom:16px">Create the administrator account for Fast Tunnel.</p>
                <div class="alert alert-error" id="adminError"></div>
                <div class="form-group">
                    <label>Admin Username</label>
                    <input type="text" id="adminUser" value="admin" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Admin Password</label>
                        <input type="password" id="adminPass" placeholder="Enter password" required>
                    </div>
                    <div class="form-group">
                        <label>Confirm Password</label>
                        <input type="password" id="adminPassConfirm" placeholder="Confirm password" required>
                    </div>
                </div>
            </div>

            <!-- Step 4: Complete -->
            <div class="step-panel" id="step4">
                <div class="completion">
                    <div class="icon"><i class="bi bi-check-circle-fill"></i></div>
                    <h2>Installation Complete!</h2>
                    <p>Fast Tunnel has been installed successfully.<br>You can now log in with your admin credentials.</p>
                </div>
                <div class="warning-box">
                    <strong><i class="bi bi-exclamation-triangle me-1"></i> Security Warning</strong>
                    <p>For security, please <strong>delete the <code>install/</code> folder</strong> from your server immediately. Leaving it accessible is a security risk.</p>
                </div>
            </div>
        </div>
        <div class="installer-footer">
            <button class="btn btn-secondary" id="btnPrev" style="display:none" onclick="prevStep()">
                <i class="bi bi-arrow-left"></i> Back
            </button>
            <div></div>
            <button class="btn btn-primary" id="btnNext" onclick="nextStep()">
                <span id="btnNextText">Checking...</span>
                <i class="bi bi-arrow-right" id="btnNextIcon"></i>
            </button>
        </div>
    </div>
    <p style="text-align:center;color:var(--text-dim);font-size:0.7rem;margin-top:16px">Fast Tunnel v1.0 · Arizu Studio</p>
</div>

<script>
let currentStep = 0;
let systemCheckPassed = false;
let licenseVerified = false;
let licenseData = {};

// ── Step Navigation ──
function showStep(n) {
    currentStep = n;
    document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('step' + n).classList.add('active');
    document.querySelectorAll('.step-dot').forEach((d, i) => {
        d.className = 'step-dot' + (i < n ? ' done' : i === n ? ' active' : '');
    });
    document.getElementById('btnPrev').style.display = n > 0 && n < 4 ? '' : 'none';
    const btn = document.getElementById('btnNext');
    if (n === 4) {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Go to Fast Tunnel';
        btn.onclick = () => window.location.href = '/';
    } else {
        const label = n === 3 ? 'Install' : (n === 0 && !systemCheckPassed) ? 'Checking...' : 'Continue';
        btn.innerHTML = '<span id="btnNextText">' + label + '</span><i class="bi bi-arrow-right" id="btnNextIcon"></i>';
        btn.disabled = (n === 0) && !systemCheckPassed;
        btn.onclick = nextStep;
    }
}

function nextStep() {
    if (currentStep === 0 && systemCheckPassed) { showStep(1); }
    else if (currentStep === 1) { verifyLicense(); }
    else if (currentStep === 2) { testDb(); }
    else if (currentStep === 3) { runSetup(); }
}

function prevStep() {
    if (currentStep > 0) showStep(currentStep - 1);
}

// ── Step 0: System Check ──
async function runChecks() {
    try {
        const resp = await fetch('/install/check.php');
        const data = await resp.json();
        const list = document.getElementById('checkList');
        list.innerHTML = '';
        data.checks.forEach(c => {
            const cls = c.pass ? 'pass' : (c.optional ? 'warning' : 'fail');
            let icon = '';
            if (c.pass) {
                icon = '<span class="pass-icon"><i class="bi bi-check-circle-fill"></i></span>';
            } else if (c.optional) {
                icon = '<span class="warning-icon" style="color:var(--amber)"><i class="bi bi-exclamation-circle-fill"></i></span>';
            } else {
                icon = '<span class="fail-icon"><i class="bi bi-x-circle-fill"></i></span>';
            }
            const label = c.name + (c.optional ? ' <span style="font-size:0.7rem;color:var(--text-dim);font-weight:normal">(Optional)</span>' : '');
            list.innerHTML += `<li class="check-item ${cls}">
                <span class="check-name">${label}</span>
                <span class="check-value">${c.current} ${icon}</span>
            </li>`;
        });
        systemCheckPassed = data.all_pass;
        document.getElementById('btnNext').disabled = !systemCheckPassed;
        document.getElementById('btnNextText').textContent = systemCheckPassed ? 'Continue' : 'Requirements Not Met';
        if (!systemCheckPassed) {
            const err = document.getElementById('checkError');
            err.style.display = 'block';
            err.textContent = 'Please fix the failed requirements before continuing.';
        }
    } catch (e) {
        document.getElementById('checkList').innerHTML = '<li class="check-item fail"><span class="check-name">Error running checks</span><span class="check-value"><span class="fail-icon"><i class="bi bi-x-circle-fill"></i></span></span></li>';
    }
}

// ── Step 1: License Verification ──
async function verifyLicense() {
    const email = document.getElementById('licenseEmail').value.trim();
    const code = document.getElementById('licenseCode').value.trim();
    const errEl = document.getElementById('licenseError');
    errEl.style.display = 'none';

    if (!email || !code) {
        errEl.textContent = 'Please enter both email and purchase code.';
        errEl.style.display = 'block';
        return;
    }

    const btn = document.getElementById('btnNext');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Verifying...';

    try {
        const resp = await fetch('/install/verify.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, purchase_code: code }),
        });
        const data = await resp.json();
        if (data.success) {
            licenseVerified = true;
            licenseData = { email, code, license: data.license };
            showStep(2);
        } else {
            errEl.textContent = data.message || 'Verification failed.';
            errEl.style.display = 'block';
        }
    } catch (e) {
        errEl.textContent = 'Connection error. Please try again.';
        errEl.style.display = 'block';
    }

    btn.disabled = false;
    btn.innerHTML = '<span id="btnNextText">Continue</span><i class="bi bi-arrow-right" id="btnNextIcon"></i>';
}

// ── Step 2: Test DB Connection ──
async function testDb() {
    const errEl = document.getElementById('dbError');
    errEl.style.display = 'none';

    const btn = document.getElementById('btnNext');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Testing...';

    try {
        const resp = await fetch('/install/db_test.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                db_host: document.getElementById('dbHost').value,
                db_port: document.getElementById('dbPort').value,
                db_user: document.getElementById('dbUser').value,
                db_pass: document.getElementById('dbPass').value,
                db_name: document.getElementById('dbName').value,
            }),
        });
        const data = await resp.json();
        if (data.success) {
            showStep(3);
        } else {
            errEl.textContent = data.message || 'Database connection failed.';
            errEl.style.display = 'block';
        }
    } catch (e) {
        errEl.textContent = 'Could not reach the test endpoint. Please try again.';
        errEl.style.display = 'block';
    }

    btn.disabled = false;
    btn.innerHTML = '<span id="btnNextText">Continue</span><i class="bi bi-arrow-right" id="btnNextIcon"></i>';
}

// ── Step 3: Run Setup ──
async function runSetup() {
    const adminPass = document.getElementById('adminPass').value;
    const adminPassConfirm = document.getElementById('adminPassConfirm').value;
    const errEl = document.getElementById('adminError');
    errEl.style.display = 'none';

    if (adminPass !== adminPassConfirm) {
        errEl.textContent = 'Passwords do not match.';
        errEl.style.display = 'block';
        return;
    }
    if (adminPass.length < 4) {
        errEl.textContent = 'Password must be at least 4 characters.';
        errEl.style.display = 'block';
        return;
    }

    const btn = document.getElementById('btnNext');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Installing...';

    try {
        const resp = await fetch('/install/setup.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                db_host: document.getElementById('dbHost').value,
                db_port: document.getElementById('dbPort').value,
                db_user: document.getElementById('dbUser').value,
                db_pass: document.getElementById('dbPass').value,
                db_name: document.getElementById('dbName').value,
                admin_user: document.getElementById('adminUser').value,
                admin_pass: adminPass,
                license_key: licenseData.code || '',
                license_email: licenseData.email || '',
            }),
        });
        const data = await resp.json();
        if (data.success) {
            showStep(4);
        } else {
            errEl.textContent = data.message || 'Installation failed.';
            errEl.style.display = 'block';
            btn.disabled = false;
            btn.innerHTML = '<span id="btnNextText">Install</span><i class="bi bi-arrow-right" id="btnNextIcon"></i>';
        }
    } catch (e) {
        errEl.textContent = 'Connection error. Please try again.';
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = '<span id="btnNextText">Install</span><i class="bi bi-arrow-right" id="btnNextIcon"></i>';
    }
}

// Start
runChecks();
</script>
</body>
</html>

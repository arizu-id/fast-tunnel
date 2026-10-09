<?php
require_once __DIR__.'/config.php';
require_once __DIR__.'/backend/Auth.php';
Auth::boot();
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    Auth::logout();
    header('Location: /login');
    exit;
}
if (Auth::check()) {
    header('Location: /');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Fast Tunnel — Login</title>
<link rel="stylesheet" href="/assets/css/style.css">
<link rel="stylesheet" href="/assets/vendor/bootstrap-icons/bootstrap-icons.min.css">
<link href="/assets/vendor/fonts/inter.css" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0c;font-family:'Inter',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;color:#e4e4e7}
.login-wrapper{width:100%;max-width:400px;padding:20px}
.login-card{background:rgba(24,24,27,0.85);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:40px 32px;backdrop-filter:blur(20px);box-shadow:0 25px 60px rgba(0,0,0,0.5)}
.login-logo{text-align:center;margin-bottom:28px}
.login-logo h1{font-size:1.6rem;font-weight:700;background:linear-gradient(135deg,#10b981,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-0.5px}
.login-logo p{color:#71717a;font-size:0.8rem;margin-top:4px}
.form-group{margin-bottom:16px}
.form-group label{display:block;font-size:0.75rem;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;font-weight:600}
.form-group input{width:100%;padding:10px 14px;background:#0f0f12;border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#e4e4e7;font-size:0.88rem;outline:none;transition:border-color 0.2s}
.form-group input:focus{border-color:#10b981}
.form-group input::placeholder{color:#52525b}
.btn-login{width:100%;padding:12px;background:linear-gradient(135deg,#10b981,#059669);border:none;border-radius:10px;color:#fff;font-size:0.9rem;font-weight:600;cursor:pointer;transition:all 0.2s;margin-top:8px;letter-spacing:0.3px}
.btn-login:hover{opacity:0.9;transform:translateY(-1px);box-shadow:0 8px 25px rgba(16,185,129,0.3)}
.btn-login:disabled{opacity:0.5;cursor:not-allowed;transform:none;box-shadow:none}
.login-error{display:none;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:10px 14px;font-size:0.8rem;color:#f87171;margin-bottom:16px}
.login-footer{text-align:center;margin-top:20px;font-size:0.72rem;color:#3f3f46}
</style>
</head>
<body>
<div class="login-wrapper">
<div class="login-card">
<div class="login-logo">
<h1><i class="bi bi-lightning-charge-fill"></i> Fast Tunnel</h1>
<p data-i18n="secure_server_mgmt">Secure Server Management</p>
</div>
<div class="login-error" id="loginError"></div>
<form id="loginForm" autocomplete="off">
<div class="form-group">
<label for="loginUser" data-i18n="username">Username</label>
<input type="text" id="loginUser" name="username" placeholder="Enter username" autocomplete="username" required>
</div>
<div class="form-group">
<label for="loginPass" data-i18n="password">Password</label>
<input type="password" id="loginPass" name="password" placeholder="Enter password" autocomplete="current-password" required>
</div>
 <div class="form-group" id="totpGroup" style="display:none">
<label for="loginTotp">Authentication code</label>
<input type="text" id="loginTotp" name="totp" placeholder="6-digit code or recovery code" autocomplete="one-time-code" inputmode="numeric" autocapitalize="off" spellcheck="false">
</div>
<button type="submit" class="btn-login" id="btnLogin" data-i18n="sign_in">Sign In</button>
</form>
<div class="login-footer">Fast Tunnel · Arizu Studio</div>
</div>
</div>
<script>
document.getElementById('loginForm').addEventListener('submit',function(e){
e.preventDefault();
const btn=document.getElementById('btnLogin');
const errBox=document.getElementById('loginError');
btn.disabled=true;
btn.textContent='Signing in...';
errBox.style.display='none';
fetch('/api/auth_login',{
method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify({
username:document.getElementById('loginUser').value,
password:document.getElementById('loginPass').value,
totp:document.getElementById('totpGroup').style.display==='none'?undefined:document.getElementById('loginTotp').value
})
})
.then(r=>r.json())
.then(res=>{
if(res.success){
window.location.href='/';
}else if(res.need_totp){
document.getElementById('totpGroup').style.display='block';
document.getElementById('loginTotp').focus();
errBox.textContent=res.error;
errBox.style.display='block';
btn.disabled=false;
btn.textContent='Verify & Sign In';
}else{
errBox.textContent=res.error||'Login failed';
errBox.style.display='block';
btn.disabled=false;
btn.textContent='Sign In';
}
})
.catch(()=>{
errBox.textContent='Connection error';
errBox.style.display='block';
btn.disabled=false;
btn.textContent='Sign In';
});
});
</script>
</body>
</html>

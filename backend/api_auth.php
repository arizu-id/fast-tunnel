<?php
switch($action){
case'auth_login':
$username=trim($data['username']??'');
$password=$data['password']??'';
if($username===''||$password===''){
throw new Exception('Username and password required');
}
$result=Auth::login($username,$password,isset($data['totp'])?(string)$data['totp']:null);
if($result==='totp_required'){
echo json_encode(['success'=>false,'need_totp'=>true,'error'=>'Enter the 6-digit code from your authenticator app']);
break;
}
if($result!=='ok'){
Audit::log('auth_login_failed',$username,$result==='totp_invalid'?'wrong 2FA code':'','');
throw new Exception($result==='totp_invalid'?'Invalid two-factor code':'Invalid credentials or too many attempts');
}
Audit::log('auth_login',$username);
echo json_encode(['success'=>true,'csrf_token'=>Auth::csrfToken()]);
break;
case'auth_logout':
Auth::logout();
echo json_encode(['success'=>true]);
break;
case'auth_check':
echo json_encode(['success'=>true,'authenticated'=>Auth::check(),'csrf_token'=>Auth::csrfToken()]);
break;
case'auth_profile':
echo json_encode(['success'=>true,'username'=>Auth::username()]);
break;
case'auth_update_credentials':
$newUsername=trim($data['username']??'');
$newPassword=$data['password']??'';
Auth::updateCredentials(Auth::userId(),$newUsername,$newPassword);
echo json_encode(['success'=>true,'username'=>Auth::username()]);
break;
case'auth_totp_status':
echo json_encode(['success'=>true,'enabled'=>Auth::totpEnabled(Auth::userId())]);
break;
case'auth_totp_setup':
if(Auth::totpEnabled(Auth::userId()))throw new Exception('Two-factor authentication is already enabled');
$secret=Totp::generateSecret();
$_SESSION['totp_pending']=$secret;
echo json_encode(['success'=>true,'secret'=>$secret,'uri'=>Totp::otpauthUri(Auth::username(),$secret)]);
break;
case'auth_totp_enable':
$secret=$_SESSION['totp_pending']??'';
if($secret==='')throw new Exception('Start the setup first');
if(Totp::verify($secret,(string)($data['code']??''))===null)throw new Exception('That code is not valid. Check the time on your phone and try again');
$codes=Auth::enableTotp(Auth::userId(),$secret);
unset($_SESSION['totp_pending']);
Audit::log('totp_enable',Auth::username());
echo json_encode(['success'=>true,'recovery_codes'=>$codes]);
break;
case'auth_totp_disable':
if(!Auth::confirmIdentity(Auth::userId(),(string)($data['password']??''),(string)($data['code']??'')))throw new Exception('Password or code is incorrect');
Auth::disableTotp(Auth::userId());
Audit::log('totp_disable',Auth::username());
echo json_encode(['success'=>true]);
break;
case'auth_audit_list':
echo json_encode(['success'=>true,'entries'=>Audit::recent((int)($data['limit']??100),(int)($data['offset']??0))]);
break;
default:
throw new Exception("Invalid auth action: $action");
}

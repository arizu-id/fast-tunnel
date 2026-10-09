<?php
switch($action){
case'auth_login':
$username=trim($data['username']??'');
$password=$data['password']??'';
if($username===''||$password===''){
throw new Exception('Username and password required');
}
if(!Auth::login($username,$password)){
Audit::log('auth_login_failed',$username,'',$username);
throw new Exception('Invalid credentials or too many attempts');
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
case'auth_audit_list':
echo json_encode(['success'=>true,'entries'=>Audit::recent((int)($data['limit']??100),(int)($data['offset']??0))]);
break;
default:
throw new Exception("Invalid auth action: $action");
}

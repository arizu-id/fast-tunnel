<?php
class Auth{
private static ?PDO $db=null;
public static function db():PDO{
if(self::$db===null)self::$db=getAppDb();
return self::$db;
}
public static function boot():void{
if(session_status()===PHP_SESSION_NONE){
ini_set('session.cookie_httponly','1');
ini_set('session.cookie_samesite','Strict');
ini_set('session.use_strict_mode','1');
session_start();
}
}
/**
 * Returns 'ok', 'invalid' (bad credentials / rate limited), 'totp_required' or 'totp_invalid'.
 * A correct password without a 2FA code does not count as a failed attempt.
 */
public static function login(string $username,string $password,?string $totpCode=null):string{
$ip=$_SERVER['REMOTE_ADDR']??'0.0.0.0';
if(self::isRateLimited($ip))return'invalid';
Migrations::ensure();
try{
$stmt=self::db()->prepare("SELECT id,password_hash,totp_enabled,totp_secret,totp_last_step,totp_recovery FROM users WHERE username=? LIMIT 1");
$stmt->execute([$username]);
}catch(\PDOException $e){
// schema not upgraded yet (e.g. no ALTER privilege): fall back so people can still sign in
$stmt=self::db()->prepare("SELECT id,password_hash FROM users WHERE username=? LIMIT 1");
$stmt->execute([$username]);
}
$user=$stmt->fetch();
if(!$user||!password_verify($password,$user['password_hash'])){
self::recordAttempt($ip);
return'invalid';
}
if(!empty($user['totp_enabled'])){
if($totpCode===null||trim($totpCode)==='')return'totp_required';
if(!self::consumeSecondFactor($user,$totpCode)){
self::recordAttempt($ip);
return'totp_invalid';
}
}
self::clearAttempts($ip);
session_regenerate_id(true);
$_SESSION['user_id']=(int)$user['id'];
$_SESSION['username']=$username;
$_SESSION['ip']=$ip;
$_SESSION['ua']=md5($_SERVER['HTTP_USER_AGENT']??'');
$_SESSION['csrf_token']=bin2hex(random_bytes(32));
return'ok';
}
/** Accept a TOTP code (once per time step) or a one-time recovery code. */
private static function consumeSecondFactor(array $user,string $code):bool{
$secret=self::decrypt($user['totp_secret']);
$step=Totp::verify($secret,$code,1,(int)$user['totp_last_step']);
if($step!==null){
self::db()->prepare("UPDATE users SET totp_last_step=? WHERE id=?")->execute([$step,$user['id']]);
return true;
}
$hashes=json_decode((string)$user['totp_recovery'],true)?:[];
$h=Totp::hashRecoveryCode($code);
$i=array_search($h,$hashes,true);
if($i===false)return false;
unset($hashes[$i]);
self::db()->prepare("UPDATE users SET totp_recovery=? WHERE id=?")->execute([json_encode(array_values($hashes)),$user['id']]);
return true;
}
public static function totpEnabled(int $userId):bool{
$stmt=self::db()->prepare("SELECT totp_enabled FROM users WHERE id=?");
$stmt->execute([$userId]);
return (bool)$stmt->fetchColumn();
}
/** Turn 2FA on after the user proved they can generate codes. Returns the plain recovery codes (shown once). */
public static function enableTotp(int $userId,string $secret):array{
$codes=Totp::generateRecoveryCodes();
$stmt=self::db()->prepare("UPDATE users SET totp_secret=?,totp_enabled=1,totp_last_step=?,totp_recovery=? WHERE id=?");
$stmt->execute([self::encrypt($secret),Totp::currentStep(),json_encode(array_map([Totp::class,'hashRecoveryCode'],$codes)),$userId]);
return $codes;
}
public static function disableTotp(int $userId):void{
self::db()->prepare("UPDATE users SET totp_secret=NULL,totp_enabled=0,totp_last_step=0,totp_recovery=NULL WHERE id=?")->execute([$userId]);
}
/** Verify password + current 2FA code/recovery code of the logged-in user (for sensitive changes). */
public static function confirmIdentity(int $userId,string $password,string $code):bool{
$stmt=self::db()->prepare("SELECT id,password_hash,totp_enabled,totp_secret,totp_last_step,totp_recovery FROM users WHERE id=?");
$stmt->execute([$userId]);
$user=$stmt->fetch();
if(!$user||!password_verify($password,$user['password_hash']))return false;
return empty($user['totp_enabled'])||self::consumeSecondFactor($user,$code);
}
public static function logout():void{
$_SESSION=[];
if(ini_get('session.use_cookies')){
$p=session_get_cookie_params();
setcookie(session_name(),'',time()-42000,$p['path'],$p['domain'],$p['secure'],$p['httponly']);
}
session_destroy();
}
public static function check():bool{
if(!isset($_SESSION['user_id']))return false;
$ip=$_SERVER['REMOTE_ADDR']??'0.0.0.0';
if(isset($_SESSION['ip'])&&$_SESSION['ip']!==$ip)return false;
$ua=md5($_SERVER['HTTP_USER_AGENT']??'');
if(isset($_SESSION['ua'])&&$_SESSION['ua']!==$ua)return false;
return true;
}
    public static function userId():int{
        return (int)($_SESSION['user_id']??0);
    }
    public static function username():string{
        return $_SESSION['username']??'';
    }
    public static function updateCredentials(int $userId, string $newUsername, ?string $newPassword):void{
        $newUsername = trim($newUsername);
        if($newUsername === '') {
            throw new Exception('Username cannot be empty');
        }
        $stmt = self::db()->prepare("SELECT id FROM users WHERE username=? AND id!=? LIMIT 1");
        $stmt->execute([$newUsername, $userId]);
        if($stmt->fetch()) {
            throw new Exception('Username already taken');
        }
        if($newPassword !== null && $newPassword !== '') {
            if(strlen($newPassword) < 5) {
                throw new Exception('Password must be at least 5 characters long');
            }
            $hash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost'=>12]);
            $stmt = self::db()->prepare("UPDATE users SET username=?, password_hash=? WHERE id=?");
            $stmt->execute([$newUsername, $hash, $userId]);
        } else {
            $stmt = self::db()->prepare("UPDATE users SET username=? WHERE id=?");
            $stmt->execute([$newUsername, $userId]);
        }
        if(self::userId() === $userId) {
            $_SESSION['username'] = $newUsername;
        }
    }
public static function requireAuth():void{
self::boot();
if(!self::check()){
header('Location: /login');
exit;
}
}
public static function requireApiAuth():void{
if(!self::check()){
http_response_code(401);
echo json_encode(['success'=>false,'error'=>'Unauthorized']);
exit;
}
}
public static function csrfToken():string{
return $_SESSION['csrf_token']??'';
}
public static function validateCsrf():void{
$token=$_SERVER['HTTP_X_CSRF_TOKEN']??'';
if(!$token||!hash_equals(self::csrfToken(),$token)){
http_response_code(403);
echo json_encode(['success'=>false,'error'=>'Invalid CSRF token']);
exit;
}
}
private static function isRateLimited(string $ip):bool{
$stmt=self::db()->prepare("SELECT COUNT(*) FROM login_attempts WHERE ip_address=? AND attempted_at>DATE_SUB(NOW(),INTERVAL 15 MINUTE)");
$stmt->execute([$ip]);
return(int)$stmt->fetchColumn()>=5;
}
private static function recordAttempt(string $ip):void{
$stmt=self::db()->prepare("INSERT INTO login_attempts(ip_address)VALUES(?)");
$stmt->execute([$ip]);
}
private static function clearAttempts(string $ip):void{
$stmt=self::db()->prepare("DELETE FROM login_attempts WHERE ip_address=?");
$stmt->execute([$ip]);
}
public static function encrypt(string $plain):string{
$key=hex2bin(ENCRYPTION_KEY);
$iv=random_bytes(12);
$cipher=openssl_encrypt($plain,'aes-256-gcm',$key,OPENSSL_RAW_DATA,$iv,$tag,'',$tagLen=16);
return base64_encode($iv.$tag.$cipher);
}
public static function decrypt(string $encoded):string{
$key=hex2bin(ENCRYPTION_KEY);
$raw=base64_decode($encoded);
$iv=substr($raw,0,12);
$tag=substr($raw,12,16);
$cipher=substr($raw,28);
$plain=openssl_decrypt($cipher,'aes-256-gcm',$key,OPENSSL_RAW_DATA,$iv,$tag);
if($plain===false)throw new Exception('Decryption failed');
return $plain;
}
}

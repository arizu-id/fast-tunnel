<?php
/**
 * Append-only audit trail of sensitive actions (logins, destructive DB/FTP operations,
 * plugin changes). Failures to write never break the request.
 */
class Audit{
private const DDL="CREATE TABLE IF NOT EXISTS audit_log(
id BIGINT AUTO_INCREMENT PRIMARY KEY,
user_id INT NULL,
username VARCHAR(50) NULL,
ip_address VARCHAR(45) NOT NULL,
action VARCHAR(64) NOT NULL,
target VARCHAR(255) NULL,
detail TEXT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
INDEX idx_created(created_at)
) ENGINE=InnoDB";
public static function ensure():void{
if(!empty($_SESSION['audit_ready']))return;
Auth::db()->exec(self::DDL);
$_SESSION['audit_ready']=true;
}
public static function log(string $action,string $target='',string $detail='',?string $username=null):void{
try{
self::ensure();
$stmt=Auth::db()->prepare("INSERT INTO audit_log(user_id,username,ip_address,action,target,detail)VALUES(?,?,?,?,?,?)");
$stmt->execute([
Auth::userId()?:null,
$username??(Auth::username()?:null),
$_SERVER['REMOTE_ADDR']??'0.0.0.0',
substr($action,0,64),
$target!==''?substr($target,0,255):null,
$detail!==''?substr($detail,0,2000):null
]);
}catch(\Throwable $e){
error_log('[fast-tunnel] audit log failed: '.$e->getMessage());
}
}
public static function recent(int $limit=100,int $offset=0):array{
self::ensure();
$limit=min(500,max(1,$limit));
$offset=max(0,$offset);
$stmt=Auth::db()->query("SELECT id,username,ip_address,action,target,detail,created_at FROM audit_log ORDER BY id DESC LIMIT $limit OFFSET $offset");
return $stmt->fetchAll();
}
}

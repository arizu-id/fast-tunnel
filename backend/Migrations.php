<?php
/**
 * Idempotent schema upgrades for installs created by an older version.
 * Fresh installs get the final schema from install/setup.php; this only fills the gaps.
 * Runs at most once per login session (cached in $_SESSION) and never breaks a request on failure.
 */
class Migrations{
public const VERSION=4;
public static function ensure():void{
if(($_SESSION['schema_ver']??0)>=self::VERSION)return;
try{
self::run(Auth::db());
$_SESSION['schema_ver']=self::VERSION;
}catch(\Throwable $e){
error_log('[fast-tunnel] migration failed: '.$e->getMessage());
}
}
public static function run(PDO $db):void{
$db->exec("CREATE TABLE IF NOT EXISTS app_meta(k VARCHAR(50) PRIMARY KEY, v VARCHAR(255) NOT NULL) ENGINE=InnoDB");
$cur=(int)$db->query("SELECT v FROM app_meta WHERE k='schema_version'")->fetchColumn();
if($cur>=self::VERSION)return;
// 1: audit log
$db->exec("CREATE TABLE IF NOT EXISTS audit_log(
id BIGINT AUTO_INCREMENT PRIMARY KEY,
user_id INT NULL,
username VARCHAR(50) NULL,
ip_address VARCHAR(45) NOT NULL,
action VARCHAR(64) NOT NULL,
target VARCHAR(255) NULL,
detail TEXT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
INDEX idx_created(created_at)
) ENGINE=InnoDB");
// 2: SFTP sessions
$db->exec("ALTER TABLE saved_sessions MODIFY protocol ENUM('ftp','sftp','ssh','mysql') NOT NULL");
// 3: two-factor authentication
if(!$db->query("SHOW COLUMNS FROM users LIKE 'totp_secret'")->fetch()){
$db->exec("ALTER TABLE users ADD COLUMN totp_secret VARCHAR(255) NULL, ADD COLUMN totp_enabled TINYINT(1) NOT NULL DEFAULT 0");
}
// 4: replay protection + recovery codes for 2FA
if(!$db->query("SHOW COLUMNS FROM users LIKE 'totp_last_step'")->fetch()){
$db->exec("ALTER TABLE users ADD COLUMN totp_last_step BIGINT NOT NULL DEFAULT 0, ADD COLUMN totp_recovery TEXT NULL");
}
$db->prepare("REPLACE INTO app_meta(k,v)VALUES('schema_version',?)")->execute([(string)self::VERSION]);
}
}

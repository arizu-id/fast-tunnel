<?php
error_reporting(E_ALL);
ini_set('display_errors','1');
require_once __DIR__.'/config.php';
try{
$dsn='mysql:host='.DB_HOST.';port='.DB_PORT.';charset=utf8mb4';
$pdo=new PDO($dsn,DB_USER,DB_PASS,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$pdo->exec('CREATE DATABASE IF NOT EXISTS `'.DB_NAME.'` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
$pdo->exec('USE `'.DB_NAME.'`');
$pdo->exec("CREATE TABLE IF NOT EXISTS users(
id INT AUTO_INCREMENT PRIMARY KEY,
username VARCHAR(50) UNIQUE NOT NULL,
password_hash VARCHAR(255) NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)ENGINE=InnoDB");
$pdo->exec("CREATE TABLE IF NOT EXISTS saved_sessions(
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT NOT NULL,
session_uid VARCHAR(64) UNIQUE NOT NULL,
protocol ENUM('ftp','ssh','mysql') NOT NULL,
name VARCHAR(100) NOT NULL,
host_enc TEXT NOT NULL,
port INT NOT NULL DEFAULT 21,
user_enc TEXT NOT NULL,
pass_enc TEXT NOT NULL,
db_name_enc TEXT DEFAULT '',
extra_enc TEXT DEFAULT NULL,
sort_order INT DEFAULT 0,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
)ENGINE=InnoDB");
$pdo->exec("CREATE TABLE IF NOT EXISTS login_attempts(
id INT AUTO_INCREMENT PRIMARY KEY,
ip_address VARCHAR(45) NOT NULL,
attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
INDEX idx_ip_time(ip_address,attempted_at)
)ENGINE=InnoDB");
$stmt=$pdo->prepare("SELECT COUNT(*) FROM users WHERE username=?");
$stmt->execute(['admin']);
if((int)$stmt->fetchColumn()===0){
$hash=password_hash('admin',PASSWORD_BCRYPT,['cost'=>12]);
$ins=$pdo->prepare("INSERT INTO users(username,password_hash)VALUES(?,?)");
$ins->execute(['admin',$hash]);
echo "Default user 'admin' created (password: admin)\n";
}else{
echo "User 'admin' already exists\n";
}
echo "Database '".DB_NAME."' installed successfully.\n";
echo "Tables: users, saved_sessions, login_attempts\n";
}catch(Exception $e){
echo "Installation failed: ".$e->getMessage()."\n";
exit(1);
}

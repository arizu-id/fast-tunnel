<?php
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED & ~E_NOTICE & ~E_WARNING);
ini_set('display_errors', '0');
if(session_status()===PHP_SESSION_NONE){
session_start();
}
require_once __DIR__.'/vendor/autoload.php';
require_once __DIR__.'/backend/FtpClient.php';
require_once __DIR__.'/backend/MysqlClient.php';
require_once __DIR__.'/backend/SshClient.php';
require_once __DIR__.'/backend/api_helpers.php';
loadPluginBackends();
$method=$_SERVER['REQUEST_METHOD'];
$action=$_GET['action']??'';
$data=[];
if($method==='POST'){
$data=json_decode(file_get_contents('php://input'),true)??[];
}
header('Content-Type: application/json');
try{
if(strpos($action,'mysql_')===0){
require_once __DIR__.'/backend/api_mysql.php';
}elseif(strpos($action,'ssh_')===0){
require_once __DIR__.'/backend/api_ssh.php';
}elseif($action==='get_plugins'||$action==='delete_plugin'||$action==='install_plugin'){
require_once __DIR__.'/backend/api_plugins.php';
}else{
require_once __DIR__.'/backend/api_ftp.php';
}
}catch(Exception$e){
http_response_code(400);
echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
}

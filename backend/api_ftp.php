<?php
if($method==='GET'){
switch($action){
case'download_file':
$ftp=getConnectedFtp();
$file=$_GET['file']??'';
if(!$file){
header('Content-Type: application/json');
echo json_encode(['success'=>false,'error'=>'No file specified']);
exit;
}
$content=$ftp->readFile($file);
$filename=basename($file);
if(ob_get_level())ob_end_clean();
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="'.rawurlencode($filename).'"');
header('Content-Length: '.strlen($content));
header('Cache-Control: no-store');
header('Pragma: no-cache');
echo $content;
exit;
default:
header('Content-Type: application/json');
throw new Exception("Invalid action: $action");
}
}
if($method==='POST'){
switch($action){
case'connect':
$host=$data['host']??'';
$port=(int)($data['port']??21);
$user=$data['user']??'';
$password=$data['password']??'';
$ftpConfig=[
'host'=>$host,
'port'=>$port,
'user'=>$user,
'password'=>$password,
'use_proxy'=>false,
'proxy_host'=>'',
'proxy_port'=>0,
'proxy_type'=>'',
'proxy_user'=>'',
'proxy_password'=>''
];
$ftpConfig=applyFtpConfigHooks($ftpConfig,$data);
$ftp=new \App\FtpClient(
$ftpConfig['host'],
$ftpConfig['port'],
$ftpConfig['user'],
$ftpConfig['password'],
$ftpConfig['use_proxy'],
$ftpConfig['proxy_host'],
$ftpConfig['proxy_port'],
$ftpConfig['proxy_type'],
$ftpConfig['proxy_user'],
$ftpConfig['proxy_password']
);
$ftp->connect();
$_SESSION['ftp_auth']=[
'host'=>$ftpConfig['host'],
'port'=>$ftpConfig['port'],
'user'=>$ftpConfig['user'],
'password_enc'=>Auth::encrypt($ftpConfig['password']),
'use_proxy'=>$ftpConfig['use_proxy'],
'proxy_host'=>$ftpConfig['proxy_host'],
'proxy_port'=>$ftpConfig['proxy_port'],
'proxy_type'=>$ftpConfig['proxy_type'],
'proxy_user'=>$ftpConfig['proxy_user'],
'proxy_password_enc'=>Auth::encrypt($ftpConfig['proxy_password']??'')
];
$dir=$data['dir']??'.';
$files=$ftp->listDirectory($dir);
echo json_encode(['success'=>true,'files'=>$files,'pwd'=>$dir]);
break;
case'list':
$ftp=getConnectedFtp();
$dir=$data['dir']??'.';
$files=$ftp->listDirectory($dir);
echo json_encode(['success'=>true,'files'=>$files,'pwd'=>$dir]);
break;
case'read_file':
$ftp=getConnectedFtp();
$file=$data['file']??'';
$content=$ftp->readFile($file);
echo json_encode(['success'=>true,'content'=>$content]);
break;
case'write_file':
$ftp=getConnectedFtp();
$file=$data['file']??'';
$content=$data['content']??'';
$ftp->writeFile($file,$content);
echo json_encode(['success'=>true]);
break;
case'create_dir':
$ftp=getConnectedFtp();
$dir=$data['dir']??'';
$ftp->createDirectory($dir);
echo json_encode(['success'=>true]);
break;
case'rename':
$ftp=getConnectedFtp();
$old=$data['old']??'';
$new=$data['new']??'';
$ftp->rename($old,$new);
echo json_encode(['success'=>true]);
break;
case'delete':
$ftp=getConnectedFtp();
$path=$data['path']??'';
$isDir=$data['isDir']??false;
if($isDir){
$ftp->deleteDirectory($path);
}else{
$ftp->deleteFile($path);
}
echo json_encode(['success'=>true]);
break;
case 'upload':
$ftp=getConnectedFtp();
$dir=$_POST['dir']??'.';
if(!isset($_FILES['files'])){
throw new Exception("No files uploaded");
}
$files=$_FILES['files'];
if(!is_array($files['name'])){
$files=[
'name'=>[$files['name']],
'type'=>[$files['type']],
'tmp_name'=>[$files['tmp_name']],
'error'=>[$files['error']],
'size'=>[$files['size']]
];
}
for($i=0;$i<count($files['name']);$i++){
if($files['error'][$i]!==UPLOAD_ERR_OK){
throw new Exception("Upload error for file ".$files['name'][$i].": ".$files['error'][$i]);
}
$name=$files['name'][$i];
$tmpName=$files['tmp_name'][$i];
$remoteFile=rtrim($dir,'/').'/'.$name;
$content=file_get_contents($tmpName);
$ftp->writeFile($remoteFile,$content);
}
echo json_encode(['success'=>true]);
break;
default:
throw new Exception("Invalid action POST: $action");
}
}

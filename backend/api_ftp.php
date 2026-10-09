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
$user=$data['user']??'';
$password=$data['password']??'';
if(($data['protocol']??'ftp')==='sftp'){
$port=(int)($data['port']??22)?:22;
$sftp=new \App\SftpClient($host,$port,$user,$password);
$sftp->connect();
$_SESSION['ftp_auth']=['protocol'=>'sftp','host'=>$host,'port'=>$port,'user'=>$user,'password_enc'=>Auth::encrypt($password)];
$dir=$data['dir']??'/';
echo json_encode(['success'=>true,'files'=>$sftp->listDirectory($dir),'pwd'=>$dir]);
break;
}
$port=(int)($data['port']??21);
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
'protocol'=>'ftp',
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
$ftp->deleteTree($path);
}else{
$ftp->deleteFile($path);
}
echo json_encode(['success'=>true]);
break;
case'delete_many':
$ftp=getConnectedFtp();
$items=$data['items']??[];
if(!is_array($items)||empty($items))throw new Exception("No items specified");
$deleted=0;
$errors=[];
foreach($items as$it){
$path=(string)($it['path']??'');
if($path===''||$path==='/'){$errors[]=['path'=>$path,'error'=>'Refusing to delete the root'];continue;}
try{
if(!empty($it['isDir'])){$ftp->deleteTree($path);}else{$ftp->deleteFile($path);}
$deleted++;
}catch(\Throwable$e){$errors[]=['path'=>$path,'error'=>$e->getMessage()];}
}
echo json_encode(['success'=>$deleted>0||empty($errors),'deleted'=>$deleted,'errors'=>$errors,'error'=>$deleted===0&&$errors?$errors[0]['error']:null]);
break;
case'move_many':
$ftp=getConnectedFtp();
$sources=$data['sources']??[];
$dest=(string)($data['dest']??'/');
if(!is_array($sources)||empty($sources))throw new Exception("No items specified");
$moved=0;
$errors=[];
foreach($sources as$src){
$src=(string)$src;
$name=basename(rtrim($src,'/'));
$target=rtrim($dest,'/').'/'.$name;
if($src===$target)continue;
if($dest===$src||strpos($dest.'/',rtrim($src,'/').'/')===0){$errors[]=['path'=>$src,'error'=>'Cannot move a folder into itself'];continue;}
try{$ftp->rename($src,$target);$moved++;}
catch(\Throwable$e){$errors[]=['path'=>$src,'error'=>$e->getMessage()];}
}
echo json_encode(['success'=>$moved>0||empty($errors),'moved'=>$moved,'errors'=>$errors,'error'=>$moved===0&&$errors?$errors[0]['error']:null]);
break;
case'search':
$ftp=getConnectedFtp();
$res=$ftp->search((string)($data['dir']??'/'),(string)($data['query']??''),min(500,max(1,(int)($data['limit']??200))));
echo json_encode(['success'=>true]+$res);
break;
case'download_zip':
$ftp=getConnectedFtp();
$items=$data['items']??[];
if(!is_array($items)||empty($items))throw new Exception("No items specified");
set_time_limit(0);
$zipPath=tempnam(sys_get_temp_dir(),'ftzip');
$count=$ftp->zipTo($items,$zipPath);
$first=basename(rtrim((string)($items[0]['path']??''),'/'));
$zipName=preg_replace('/[^A-Za-z0-9_.-]/','_',count($items)===1&&$first!==''?$first:'download').'.zip';
while(ob_get_level())ob_end_clean();
header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="'.$zipName.'"');
header('Content-Length: '.filesize($zipPath));
header('Cache-Control: no-store');
readfile($zipPath);
@unlink($zipPath);
Audit::log('ftp_download_zip',(string)($items[0]['path']??''),count($items).' item(s), '.$count.' file(s)');
exit;
case 'upload':
$ftp=getConnectedFtp();
$dir=$_POST['dir']??'.';
$rel=trim(str_replace('\\','/',$_POST['rel_dir']??''),'/');
if($rel!==''){
foreach(explode('/',$rel)as$seg){if($seg==='..'||$seg==='.'||$seg==='')throw new Exception("Invalid upload path");}
$dir=rtrim($dir,'/').'/'.$rel;
$ftp->ensureDirectory($dir);
}
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
$why=[UPLOAD_ERR_INI_SIZE=>'exceeds upload_max_filesize',UPLOAD_ERR_FORM_SIZE=>'exceeds the form size limit',UPLOAD_ERR_PARTIAL=>'was only partially uploaded',UPLOAD_ERR_NO_FILE=>'no file was uploaded'][$files['error'][$i]]??('error code '.$files['error'][$i]);
throw new Exception("Upload failed for ".$files['name'][$i].": ".$why);
}
$name=basename(str_replace('\\','/',$files['name'][$i]));
$remoteFile=rtrim($dir,'/').'/'.$name;
$ftp->uploadFile($files['tmp_name'][$i],$remoteFile);
}
echo json_encode(['success'=>true]);
break;
default:
throw new Exception("Invalid action POST: $action");
}
}

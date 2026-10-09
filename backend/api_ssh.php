<?php
if($method==='GET'){
switch($action){
case'ssh_stream_output':
set_time_limit(0);
ini_set('max_execution_time',0);
if(ob_get_level())ob_end_clean();
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('X-Accel-Buffering: no');
header('Connection: keep-alive');
$outputFile=$_SESSION['ssh_stream']['output_file']??null;
$killFile=$_SESSION['ssh_stream']['kill_file']??null;
$pidFile=$_SESSION['ssh_stream']['pid_file']??null;
session_write_close();
if(!$outputFile||!file_exists($outputFile)){
echo "data: ".json_encode(['error'=>'No active SSH session'])."\n\n";
flush();
exit;
}
$waited=0;
while(!file_exists($pidFile)&&$waited<80){
usleep(100000);
$waited++;
clearstatcache(true,$pidFile);
}
if(!file_exists($pidFile)){
echo "data: ".json_encode(['error'=>'SSH process failed to start'])."\n\n";
flush();
exit;
}
$pos=0;
$lastKeepalive=time();
$sleepTime=10000;
while(file_exists($pidFile)&&!file_exists($killFile??'')){
$hasOutput=false;
clearstatcache(true,$outputFile);
$size=@filesize($outputFile);
if($size&&$size>$pos){
$fh=fopen($outputFile,'rb');
if($fh){
fseek($fh,$pos);
$chunk=fread($fh,$size-$pos);
fclose($fh);
$pos=$size;
if($chunk!==false&&$chunk!==''){
echo "data: ".json_encode(['output'=>$chunk])."\n\n";
flush();
$hasOutput=true;
}
}
}
if(time()-$lastKeepalive>=5){
echo ": keepalive\n\n";
flush();
$lastKeepalive=time();
}
if(connection_aborted()){
break;
}
if($hasOutput){$sleepTime=10000;}else{$sleepTime=min(100000,$sleepTime+10000);}
usleep($sleepTime);
}
clearstatcache(true,$outputFile);
$size=@filesize($outputFile);
if($size&&$size>$pos){
$fh=fopen($outputFile,'rb');
if($fh){
fseek($fh,$pos);
$chunk=fread($fh,$size-$pos);
fclose($fh);
if($chunk!==false&&$chunk!==''){
echo "data: ".json_encode(['output'=>$chunk])."\n\n";
flush();
}
}
}
echo "data: ".json_encode(['closed'=>true])."\n\n";
flush();
@unlink($outputFile);
exit;
default:
header('Content-Type: application/json');
throw new Exception("Invalid action: $action");
}
}
if($method==='POST'){
switch($action){
case'ssh_connect':
$host=$data['host']??'';
$port=(int)($data['port']??22);
$user=$data['user']??'';
$password=$data['password']??'';
$cols=(int)($data['cols']??80);
$rows=(int)($data['rows']??24);
$oldStream=$_SESSION['ssh_stream']??null;
if($oldStream){
@file_put_contents($oldStream['kill_file'],'1');
usleep(300000);
@unlink($oldStream['kill_file']);
@unlink($oldStream['output_file']);
@unlink($oldStream['input_file']);
@unlink($oldStream['session_file']);
@unlink($oldStream['pid_file']);
@unlink($oldStream['resize_file']??'');
}
$tmpDir=__DIR__.'/../temp_ssh';
if(!is_dir($tmpDir)){@mkdir($tmpDir,0777,true);}
reapSshTempFiles($tmpDir);
$testSsh=new \App\SshClient($host,$port);
$testSsh->connect($user,$password);
$sid=uniqid('ssh_',true);
$sessionFile=$tmpDir.'/'.$sid.'.json';
$inputFile=$tmpDir.'/'.$sid.'_input.bin';
$outputFile=$tmpDir.'/'.$sid.'_output.bin';
$killFile=$tmpDir.'/'.$sid.'_kill';
$pidFile=$tmpDir.'/'.$sid.'_pid';
$resizeFile=$tmpDir.'/'.$sid.'_resize';
file_put_contents($sessionFile,json_encode([
'host'=>$host,
'port'=>$port,
'user'=>$user,
'password_enc'=>Auth::encrypt($password),
'input_file'=>$inputFile,
'output_file'=>$outputFile,
'kill_file'=>$killFile,
'pid_file'=>$pidFile,
'resize_file'=>$resizeFile,
'session_file'=>$sessionFile,
'cols'=>$cols,
'rows'=>$rows,
]));
file_put_contents($inputFile,'');
file_put_contents($outputFile,'');
$phpBin=getPhpExecutablePath();
$streamScript=__DIR__.'/SshStream.php';
if(PHP_OS_FAMILY==='Windows'){
$cmd="start \"\" /B \"$phpBin\" \"$streamScript\" \"$sessionFile\"";
pclose(popen($cmd,'r'));
}else{
exec("$phpBin '$streamScript' '$sessionFile' > /dev/null 2>&1 &");
}
$_SESSION['ssh_auth']=[
'host'=>$host,'port'=>$port,
'user'=>$user,'password_enc'=>Auth::encrypt($password)
];
$_SESSION['ssh_stream']=[
'input_file'=>$inputFile,
'output_file'=>$outputFile,
'kill_file'=>$killFile,
'pid_file'=>$pidFile,
'resize_file'=>$resizeFile,
'session_file'=>$sessionFile,
];
$startWait=0;
while(!file_exists($pidFile)&&$startWait<30){
usleep(100000);
$startWait++;
clearstatcache(true,$pidFile);
}
echo json_encode(['success'=>true,'pty_ready'=>file_exists($pidFile)]);
break;
case'ssh_send_input':
$input=$data['input']??'';
$stream=$_SESSION['ssh_stream']??null;
if(!$stream)throw new Exception('No active SSH stream');
file_put_contents($stream['input_file'],$input,FILE_APPEND|LOCK_EX);
echo json_encode(['success'=>true]);
break;
case'ssh_resize':
$stream=$_SESSION['ssh_stream']??null;
if($stream&&isset($stream['resize_file'])){
$c=(int)($data['cols']??80);
$r=(int)($data['rows']??24);
file_put_contents($stream['resize_file'],json_encode(['cols'=>$c,'rows'=>$r]));
}
echo json_encode(['success'=>true]);
break;
case'ssh_disconnect':
$stream=$_SESSION['ssh_stream']??null;
if($stream){
file_put_contents($stream['kill_file'],'1');
usleep(300000);
@unlink($stream['kill_file']);
@unlink($stream['output_file']);
@unlink($stream['input_file']);
@unlink($stream['session_file']);
@unlink($stream['pid_file']);
@unlink($stream['resize_file']??'');
unset($_SESSION['ssh_stream']);
}
unset($_SESSION['ssh_auth']);
echo json_encode(['success'=>true]);
break;
case'ssh_get_server_info':
$auth=$_SESSION['ssh_auth']??null;
if(!$auth)throw new Exception('Not connected');
$ssh=new \App\SshClient($auth['host'],$auth['port']);
$ssh->connect($auth['user'],Auth::decrypt($auth['password_enc']));
$info=[];
$cmds=[
'os'=>"uname -s 2>/dev/null || echo Unknown",
'kernel'=>"uname -r 2>/dev/null || echo Unknown",
'arch'=>"uname -m 2>/dev/null || echo Unknown",
'distro'=>"cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d '\"' || echo Unknown",
'cpu'=>"lscpu 2>/dev/null | grep 'Model name' | sed 's/Model name://;s/^ *//' || grep -m1 'model name' /proc/cpuinfo 2>/dev/null | cut -d: -f2 | sed 's/^ *//' || echo Unknown",
'cores'=>"nproc 2>/dev/null || echo ?",
'ram'=>"free -h 2>/dev/null | awk '/^Mem/{print \$2}' || echo Unknown",
'ram_used'=>"free -h 2>/dev/null | awk '/^Mem/{print \$3}' || echo Unknown",
'uptime'=>"uptime -p 2>/dev/null || uptime | sed 's/.*up //;s/, [0-9]* user.*//' || echo Unknown",
'hostname'=>"hostname 2>/dev/null || echo Unknown",
'load'=>"cat /proc/loadavg 2>/dev/null | awk '{print \$1}' || echo ?",
'disk'=>"df -h / 2>/dev/null | awk 'NR==2{print \$2\"||\"\$3\"||\"\$5}' || echo Unknown",
];
foreach($cmds as$key=>$cmd){
$res=$ssh->execute($cmd);
$info[$key]=trim($res['output']??'Unknown');
}
$ipRes=$ssh->execute("curl -s ipwho.is 2>/dev/null || wget -qO- ipwho.is 2>/dev/null || echo '{}'");
$ipJson=json_decode(trim($ipRes['output']??'{}'),true);
$info['ipinfo']=$ipJson&&isset($ipJson['ip'])?$ipJson:null;
echo json_encode(['success'=>true,'info'=>$info]);
break;
default:
throw new Exception("Invalid action POST: $action");
}
}

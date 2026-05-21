<?php
class SessionStore{
public static function list(int $userId):array{
$db=getAppDb();
$stmt=$db->prepare("SELECT * FROM saved_sessions WHERE user_id=? ORDER BY sort_order,created_at DESC");
$stmt->execute([$userId]);
$rows=$stmt->fetchAll();
$out=[];
foreach($rows as $r){
$out[]=[
'id'=>$r['session_uid'],
'protocol'=>$r['protocol'],
'name'=>$r['name'],
'host'=>Auth::decrypt($r['host_enc']),
'port'=>(int)$r['port'],
'user'=>Auth::decrypt($r['user_enc']),
'password'=>base64_encode(Auth::decrypt($r['pass_enc'])),
'db_name'=>$r['db_name_enc']?Auth::decrypt($r['db_name_enc']):'',
'extra'=>$r['extra_enc']?json_decode(Auth::decrypt($r['extra_enc']),true):null,
];
}
return $out;
}
public static function create(int $userId,array $d):string{
$db=getAppDb();
$uid=bin2hex(random_bytes(16));
$proto=$d['protocol']??'ftp';
$name=$d['name']??($d['user'].'@'.$d['host'].' ('.strtoupper($proto).')');
$host=Auth::encrypt($d['host']??'');
$user=Auth::encrypt($d['user']??'');
$pass=Auth::encrypt($d['password']??'');
$dbName=!empty($d['db_name'])?Auth::encrypt($d['db_name']):'';
$extra=null;
if(!empty($d['extra'])&&is_array($d['extra'])){
$extra=Auth::encrypt(json_encode($d['extra']));
}
$port=(int)($d['port']??21);
$stmt=$db->prepare("INSERT INTO saved_sessions(user_id,session_uid,protocol,name,host_enc,port,user_enc,pass_enc,db_name_enc,extra_enc)VALUES(?,?,?,?,?,?,?,?,?,?)");
$stmt->execute([$userId,$uid,$proto,$name,$host,$port,$user,$pass,$dbName,$extra]);
return $uid;
}
public static function update(string $uid,int $userId,array $d):bool{
$db=getAppDb();
$sets=[];
$params=[];
if(isset($d['name'])){$sets[]='name=?';$params[]=$d['name'];}
if(isset($d['host'])){$sets[]='host_enc=?';$params[]=Auth::encrypt($d['host']);}
if(isset($d['port'])){$sets[]='port=?';$params[]=(int)$d['port'];}
if(isset($d['user'])){$sets[]='user_enc=?';$params[]=Auth::encrypt($d['user']);}
if(isset($d['password'])&&$d['password']!==''){$sets[]='pass_enc=?';$params[]=Auth::encrypt($d['password']);}
if(array_key_exists('db_name',$d)){$sets[]='db_name_enc=?';$params[]=!empty($d['db_name'])?Auth::encrypt($d['db_name']):'';}
if(empty($sets))return false;
$params[]=$uid;
$params[]=$userId;
$stmt=$db->prepare("UPDATE saved_sessions SET ".implode(',',$sets)." WHERE session_uid=? AND user_id=?");
$stmt->execute($params);
return $stmt->rowCount()>0;
}
public static function delete(string $uid,int $userId):bool{
$db=getAppDb();
$stmt=$db->prepare("DELETE FROM saved_sessions WHERE session_uid=? AND user_id=?");
$stmt->execute([$uid,$userId]);
return $stmt->rowCount()>0;
}
public static function exportAll(int $userId):array{
return self::list($userId);
}
public static function importSessions(int $userId,array $sessions):int{
$existing=self::list($userId);
$existingMap=[];
foreach($existing as $e){
$existingMap[$e['host'].':'.$e['port'].':'.$e['user'].':'.$e['protocol']]=true;
}
$added=0;
foreach($sessions as $s){
if(!isset($s['host'],$s['user'],$s['password']))continue;
$proto=$s['protocol']??'ftp';
$key=$s['host'].':'.($s['port']??21).':'.$s['user'].':'.$proto;
if(isset($existingMap[$key]))continue;
$pw=$s['password'];
if(preg_match('/^[A-Za-z0-9+\/=]+$/',$pw)&&strlen($pw)>1){
$decoded=base64_decode($pw,true);
if($decoded!==false)$pw=$decoded;
}
self::create($userId,[
'protocol'=>$proto,
'name'=>$s['name']??($s['user'].'@'.$s['host']),
'host'=>$s['host'],
'port'=>$s['port']??21,
'user'=>$s['user'],
'password'=>$pw,
'db_name'=>$s['db_name']??'',
'extra'=>$s['extra']??null,
]);
$added++;
}
return $added;
}
}

<?php
if($method==='POST'){
switch($action){
case'get_plugins':
$appInfo=[];
if(file_exists(__DIR__.'/../app.json')){
$appInfo=json_decode(file_get_contents(__DIR__.'/../app.json'),true)?:[];
}
$plugins=[];
$pluginDir=__DIR__.'/../plugins';
if(is_dir($pluginDir)){
$dirs=glob($pluginDir.'/*',GLOB_ONLYDIR)?:[];
foreach($dirs as$dir){
$slug=basename($dir);
$infoFile=$dir.'/info.json';
if(file_exists($infoFile)){
$info=json_decode(file_get_contents($infoFile),true)?:[];
}else{
$info=[
'name'=>$slug,
'slug'=>$slug,
'version'=>'0.0.0',
'description'=>'No info.json found.',
'author'=>'Unknown'
];
}
$info['slug']=$slug;
$plugins[]=$info;
}
}
echo json_encode([
'success'=>true,
'app'=>$appInfo,
'plugins'=>$plugins
]);
break;
case'delete_plugin':
$slug=$data['slug']?? '';
if(!$slug||preg_match('/[^a-zA-Z0-9_\-]/',$slug)){
throw new Exception("Invalid plugin slug");
}
$dir=__DIR__.'/../plugins/'.$slug;
if(!is_dir($dir)){
throw new Exception("Plugin not found");
}
rmdir_recursive($dir);
echo json_encode(['success'=>true]);
break;
case'install_plugin':
if(!isset($_FILES['plugin_file'])){
throw new Exception("No plugin file uploaded.");
}
$file=$_FILES['plugin_file'];
if($file['error']!==UPLOAD_ERR_OK){
throw new Exception("Upload error code: ".$file['error']);
}
$ext=pathinfo($file['name'],PATHINFO_EXTENSION);
if(strtolower($ext)!=='zip'){
throw new Exception("Only ZIP files are supported.");
}
if(!class_exists('ZipArchive')){
throw new Exception("PHP ZipArchive extension is not enabled. Please enable it in php.ini.");
}
$zip=new ZipArchive();
if($zip->open($file['tmp_name'])!==TRUE){
throw new Exception("Failed to open ZIP file.");
}
$tempDirName='temp_'.uniqid();
$tempPath=__DIR__.'/../plugins/'.$tempDirName;
if(!mkdir($tempPath,0755,true)){
throw new Exception("Failed to create temporary folder.");
}
$zip->extractTo($tempPath);
$zip->close();
if(!function_exists('findInfoJson')){
function findInfoJson($dir){
$files=scandir($dir);
foreach($files as$file){
if($file==='.'||$file==='..')continue;
$path=$dir.'/'.$file;
if(is_dir($path)){
$res=findInfoJson($path);
if($res)return $res;
}else if($file==='info.json'){
return $path;
}
}
return null;
}
}
$infoJsonPath=findInfoJson($tempPath);
if(!$infoJsonPath){
rmdir_recursive($tempPath);
throw new Exception("Invalid plugin: info.json not found in the ZIP archive.");
}
$infoData=json_decode(file_get_contents($infoJsonPath),true);
$slug=$infoData['slug']??'';
if(!$slug||preg_match('/[^a-zA-Z0-9_\-]/',$slug)){
$slug=pathinfo($file['name'],PATHINFO_FILENAME);
$slug=preg_replace('/[^a-zA-Z0-9_\-]/','_',$slug);
}
$targetPath=__DIR__.'/../plugins/'.$slug;
if(is_dir($targetPath)){
rmdir_recursive($targetPath);
}
$pluginSourceDir=dirname($infoJsonPath);
if(!rename($pluginSourceDir,$targetPath)){
copy_recursive($pluginSourceDir,$targetPath);
}
rmdir_recursive($tempPath);
echo json_encode(['success'=>true,'slug'=>$slug]);
break;
default:
throw new Exception("Invalid action POST: $action");
}
}

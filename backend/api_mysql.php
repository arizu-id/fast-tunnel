<?php
if($method==='POST'){
switch($action){
case'mysql_connect':
$host=$data['host']??'';
$port=(int)($data['port']??3306);
$user=$data['user']??'';
$password=$data['password']??'';
$db_name=$data['db_name']??'';
$mysql=new \App\MysqlClient($host,$port,$user,$password,$db_name);
$databases=$mysql->listDatabases();
$_SESSION['mysql_auth']=[
'host'=>$host,
'port'=>$port,
'user'=>$user,
'password_enc'=>Auth::encrypt($password),
'db_name'=>$db_name
];
$tables=[];
if($db_name!==''){$tables=$mysql->listTables();}
echo json_encode([
'success'=>true,
'databases'=>$databases,
'tables'=>$tables,
'db_name'=>$db_name
]);
break;
case'mysql_list_tables':
$db_name=$data['db_name']??'';
$mysql=getConnectedMysql($db_name);
$tables=$mysql->listTables();
echo json_encode(['success'=>true,'tables'=>$tables]);
break;
case'mysql_table_data':
$db_name=$data['db_name']??'';
$table=$data['table']??'';
$page=(int)($data['page']??1);
$limit=(int)($data['limit']??50);
if(!$table){throw new Exception("Table name is required");}
$mysql=getConnectedMysql($db_name);
$res=$mysql->getTableData($table,$page,$limit,$data['order_by']??null,$data['order_dir']??'ASC');
echo json_encode(array_merge(['success'=>true],$res));
break;
case'mysql_run_query':
$db_name=$data['db_name']??'';
$sql=$data['sql']??'';
if(!$sql){throw new Exception("SQL query is required");}
$mysql=getConnectedMysql($db_name);
$res=$mysql->executeQuery($sql);
echo json_encode(array_merge(['success'=>true],$res));
break;
case'mysql_db_structure':
$db_name=$data['db_name']??'';
$mysql=getConnectedMysql($db_name);
$tables=$mysql->getDatabaseStructure();
echo json_encode(['success'=>true,'tables'=>$tables]);
break;
case'mysql_table_structure':
$db_name=$data['db_name']??'';
$table=$data['table']??'';
if(!$table)throw new Exception("Table name is required");
$mysql=getConnectedMysql($db_name);
$columns=$mysql->getTableColumns($table);
echo json_encode(['success'=>true,'columns'=>$columns,'table'=>$table]);
break;
case'mysql_save_column':
$db_name=$data['db_name']??'';
$table=$data['table']??'';
$origName=$data['original_name']??'';
$name=$data['name']??'';
$type=$data['type']??'';
$length=$data['length']??'';
$nullable=isset($data['nullable'])?(bool)$data['nullable']:true;
$defaultType=$data['default_type']??'NONE';
$defaultValue=$data['default_value']??'';
$ai=isset($data['ai'])?(bool)$data['ai']:false;
$index=$data['index']??'NONE';
if(!$table)throw new Exception("Table name is required");
if(!$name)throw new Exception("Column name is required");
if(!$type)throw new Exception("Column type is required");
$mysql=getConnectedMysql($db_name);
$safeTable=sanitizeIdentifier($table);
$safeName=sanitizeIdentifier($name);
$colDef=buildColumnDefinition($data);
if($origName!==''){$safeOrig=sanitizeIdentifier($origName);$sql="ALTER TABLE $safeTable CHANGE COLUMN $safeOrig $colDef";}
else{$sql="ALTER TABLE $safeTable ADD COLUMN $colDef";}
$mysql->executeQuery($sql);
if($index!=='NONE'){
try{
if($index==='PRIMARY'){$mysql->executeQuery("ALTER TABLE $safeTable ADD PRIMARY KEY ($safeName)");}
elseif($index==='UNIQUE'){$mysql->executeQuery("ALTER TABLE $safeTable ADD UNIQUE ($safeName)");}
elseif($index==='INDEX'){$mysql->executeQuery("ALTER TABLE $safeTable ADD INDEX ($safeName)");}
}catch(\Throwable$indexErr){}
}
echo json_encode(['success'=>true]);
break;
case'mysql_drop_columns':
$db_name=$data['db_name']??'';
$table=$data['table']??'';
$columns=$data['columns']??[];
if(!$table)throw new Exception("Table name is required");
if(empty($columns))throw new Exception("No columns specified for dropping");
$mysql=getConnectedMysql($db_name);
$safeTable=sanitizeIdentifier($table);
$dropClauses=[];
foreach($columns as$col){$dropClauses[]="DROP COLUMN ".sanitizeIdentifier($col);}
$sql="ALTER TABLE $safeTable ".implode(', ',$dropClauses);
$mysql->executeQuery($sql);
echo json_encode(['success'=>true]);
break;
case'mysql_truncate_table':
$db_name=$data['db_name']??'';
$table=$data['table']??'';
if(!$table)throw new Exception("Table name is required");
$mysql=getConnectedMysql($db_name);
$mysql->executeQuery("TRUNCATE TABLE ".sanitizeIdentifier($table));
echo json_encode(['success'=>true]);
break;
case'mysql_drop_table':
$db_name=$data['db_name']??'';
$table=$data['table']??'';
if(!$table)throw new Exception("Table name is required");
$mysql=getConnectedMysql($db_name);
$mysql->executeQuery("DROP TABLE ".sanitizeIdentifier($table));
echo json_encode(['success'=>true]);
break;
case'mysql_drop_database':
$db_name=$data['db_name']??'';
$safeDb=sanitizeDatabaseName($db_name);
if(($data['confirm_name']??null)!==$db_name){throw new Exception("Confirmation name does not match the database name");}
$mysql=getConnectedMysqlServer();
$mysql->executeQuery("DROP DATABASE $safeDb");
if(($_SESSION['mysql_auth']['db_name']??'')===$db_name){$_SESSION['mysql_auth']['db_name']='';}
echo json_encode(['success'=>true,'databases'=>$mysql->listDatabases()]);
break;
case'mysql_create_database':
$db_name=trim($data['db_name']??'');
$safeDb=sanitizeDatabaseName($db_name);
$charset=$data['charset']??'utf8mb4';
if(!preg_match('/^[a-z0-9_]+$/i',$charset)){throw new Exception("Invalid character set");}
$mysql=getConnectedMysqlServer();
$mysql->executeQuery("CREATE DATABASE $safeDb CHARACTER SET $charset");
echo json_encode(['success'=>true,'databases'=>$mysql->listDatabases()]);
break;
case'mysql_create_table':
$db_name=$data['db_name']??'';
$table=trim($data['table']??'');
$columns=$data['columns']??[];
if($table==='')throw new Exception("Table name is required");
if(!is_array($columns)||empty($columns))throw new Exception("At least one column is required");
$mysql=getConnectedMysql($db_name);
$defs=[];
$pk=[];
$seen=[];
foreach($columns as$c){
$name=trim($c['name']??'');
if($name==='')throw new Exception("Every column needs a name");
if(isset($seen[strtolower($name)]))throw new Exception("Duplicate column name: ".htmlspecialchars($name));
$seen[strtolower($name)]=true;
$defs[]=buildColumnDefinition($c);
if(!empty($c['pk'])||!empty($c['ai']))$pk[]=sanitizeIdentifier($name);
}
if($pk)$defs[]='PRIMARY KEY ('.implode(', ',array_unique($pk)).')';
$mysql->executeQuery('CREATE TABLE '.sanitizeIdentifier($table).' ('.implode(', ',$defs).') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
echo json_encode(['success'=>true]);
break;
case'mysql_export':
$db_name=$data['db_name']??'';
$table=$data['table']??'';
$format=($data['format']??'sql')==='csv'?'csv':'sql';
$withData=!isset($data['with_data'])||(bool)$data['with_data'];
if($format==='csv'&&$table==='')throw new Exception("CSV export needs a table");
$mysql=getConnectedMysql($db_name);
$label=$db_name!==''?$db_name:($_SESSION['mysql_auth']['db_name']??'database');
$tables=$table!==''?[$table]:$mysql->listTables();
if($table!=='')$mysql->getTableColumns($table);
set_time_limit(0);
$fname=preg_replace('/[^A-Za-z0-9_.-]/','_',($table!==''?$label.'_'.$table:$label).'_'.date('Ymd_His')).'.'.$format;
while(ob_get_level())ob_end_clean();
header('Content-Type: '.($format==='csv'?'text/csv':'application/sql').'; charset=utf-8');
header('Content-Disposition: attachment; filename="'.$fname.'"');
header('Cache-Control: no-store');
if($format==='csv'){
$out=fopen('php://output','w');
fwrite($out,"\xEF\xBB\xBF");
fputcsv($out,array_column($mysql->getTableColumns($table),'Field'));
$mysql->forEachRow('SELECT * FROM '.sanitizeIdentifier($table),function($row)use($out){fputcsv($out,array_map(fn($v)=>$v===null?'':$v,$row));});
fclose($out);
}else{
$emit=function($chunk){echo $chunk;};
$emit("-- Fast Tunnel SQL dump\n-- Database: $label\n-- Generated: ".date('Y-m-d H:i:s')."\n\nSET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=0;\nSET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';\n\n");
foreach($tables as$t){\App\SqlTools::dumpTable($mysql,$t,$emit,$withData);}
$emit("SET FOREIGN_KEY_CHECKS=1;\n");
}
Audit::log('mysql_export',$table!==''?"$label.$table":$label,$format);
exit;
case'mysql_import':
$db_name=$_POST['db_name']??'';
$table=$_POST['table']??'';
$format=($_POST['format']??'sql')==='csv'?'csv':'sql';
if(!isset($_FILES['import_file'])||$_FILES['import_file']['error']!==UPLOAD_ERR_OK){throw new Exception("No file uploaded or upload failed (check upload_max_filesize)");}
$file=$_FILES['import_file'];
if($file['size']>64*1024*1024)throw new Exception("File too large (max 64 MB)");
set_time_limit(0);
$mysql=getConnectedMysql($db_name);
if($format==='sql'){
$statements=\App\SqlTools::splitStatements((string)file_get_contents($file['tmp_name']));
if(!$statements)throw new Exception("No SQL statements found in the file");
$done=0;
foreach($statements as$i=>$st){
try{$mysql->executeQuery($st);$done++;}
catch(\Throwable$e){throw new Exception("Statement ".($i+1)." of ".count($statements)." failed after $done succeeded: ".$e->getMessage());}
}
Audit::log('mysql_import',$db_name,"sql, $done statement(s)");
echo json_encode(['success'=>true,'statements'=>$done]);
break;
}
if($table==='')throw new Exception("Target table is required for CSV import");
$safeTable=sanitizeIdentifier($table);
$known=array_column($mysql->getTableColumns($table),'Field');
$fh=fopen($file['tmp_name'],'r');
$header=fgetcsv($fh);
if(!$header||$header===[null])throw new Exception("CSV file is empty");
if(isset($header[0]))$header[0]=preg_replace('/^\xEF\xBB\xBF/','',$header[0]);
foreach($header as$h){if(!in_array($h,$known,true))throw new Exception("Unknown column in CSV header: ".htmlspecialchars((string)$h));}
$colSql=implode(', ',array_map('sanitizeIdentifier',$header));
$nCols=count($header);
$emptyAsNull=!empty($_POST['empty_as_null']);
$total=0;
$flushRows=function(array$rows)use($mysql,$safeTable,$colSql,$nCols){
if(!$rows)return;
$ph='('.implode(',',array_fill(0,$nCols,'?')).')';
$mysql->executePrepare("INSERT INTO $safeTable ($colSql) VALUES ".implode(',',array_fill(0,count($rows),$ph)),array_merge(...$rows));
};
$mysql->transaction(function()use($fh,$nCols,$emptyAsNull,&$total,$flushRows){
$batch=[];
$line=1;
while(($r=fgetcsv($fh))!==false){
$line++;
if($r===[null])continue;
if(count($r)!==$nCols)throw new Exception("Line $line has ".count($r)." fields, expected $nCols");
$batch[]=array_map(fn($v)=>($emptyAsNull&&$v==='')?null:$v,$r);
$total++;
if(count($batch)>=200){$flushRows($batch);$batch=[];}
}
$flushRows($batch);
});
fclose($fh);
Audit::log('mysql_import',"$db_name.$table","csv, $total row(s)");
echo json_encode(['success'=>true,'rows'=>$total]);
break;
case'mysql_update_row':
$db_name=$data['db_name']??'';
$table=$data['table']??'';
$rowData=$data['row_data']??[];
$pk=pkFromRequest($data);
if(!$table||empty($pk)||empty($rowData)){throw new Exception("table, primary key and row_data are required");}
$mysql=getConnectedMysql($db_name);
$safeTable=sanitizeIdentifier($table);
$setClauses=[];
$params=[];
foreach($rowData as$col=>$val){
$setClauses[]=sanitizeIdentifier($col)." = ?";
$params[]=$val==='__NULL__'?null:$val;
}
$where=[];
foreach($pk as$col=>$val){$where[]=sanitizeIdentifier($col)." = ?";$params[]=$val;}
$sql="UPDATE $safeTable SET ".implode(', ',$setClauses)." WHERE ".implode(' AND ',$where)." LIMIT 1";
$affected=$mysql->executePrepare($sql,$params);
echo json_encode(['success'=>true,'affected'=>$affected]);
break;
case'mysql_delete_rows':
$db_name=$data['db_name']??'';
$table=$data['table']??'';
$pkRows=pkRowsFromRequest($data);
if(!$table||empty($pkRows)){throw new Exception("table and primary key values are required");}
$mysql=getConnectedMysql($db_name);
$safeTable=sanitizeIdentifier($table);
$affected=0;
foreach(array_chunk($pkRows,200)as$chunk){
$params=[];
$ors=[];
foreach($chunk as$row){
$ands=[];
foreach($row as$col=>$val){$ands[]=sanitizeIdentifier($col)." = ?";$params[]=$val;}
$ors[]='('.implode(' AND ',$ands).')';
}
$affected+=(int)$mysql->executePrepare("DELETE FROM $safeTable WHERE ".implode(' OR ',$ors),$params);
}
echo json_encode(['success'=>true,'affected'=>$affected]);
break;
default:
throw new Exception("Invalid action POST: $action");
}
}

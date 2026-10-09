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
$res=$mysql->getTableData($table,$page,$limit);
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
$safeType=sanitizeColumnType($type);
$colDef="$safeName $safeType";
$len=sanitizeColumnLength($length);
$typesWithLength=['VARCHAR','CHAR','INT','TINYINT','SMALLINT','BIGINT','DECIMAL','FLOAT','DOUBLE'];
if($len!==''&&in_array($safeType,$typesWithLength)){$colDef.="($len)";}
if(!$nullable){$colDef.=" NOT NULL";}else{$colDef.=" NULL";}
if($defaultType==='NULL'){$colDef.=" DEFAULT NULL";}
elseif($defaultType==='CURRENT_TIMESTAMP'){$colDef.=" DEFAULT CURRENT_TIMESTAMP";}
elseif($defaultType==='USER_DEFINED'){$colDef.=" DEFAULT '".addslashes($defaultValue)."'";}
if($ai){$colDef.=" AUTO_INCREMENT";}
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
if(!isset($_SESSION['mysql_auth'])){throw new Exception("Not connected to MySQL.");}
$auth=$_SESSION['mysql_auth'];
$mysql=new \App\MysqlClient($auth['host'],$auth['port'],$auth['user'],Auth::decrypt($auth['password_enc']),'');
$mysql->executeQuery("DROP DATABASE $safeDb");
if(($auth['db_name']??'')===$db_name){$_SESSION['mysql_auth']['db_name']='';}
echo json_encode(['success'=>true,'databases'=>$mysql->listDatabases()]);
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

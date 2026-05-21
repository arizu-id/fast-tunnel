<?php
$userId=Auth::userId();
switch($action){
case'sessions_list':
$sessions=SessionStore::list($userId);
echo json_encode(['success'=>true,'sessions'=>$sessions]);
break;
case'sessions_create':
$uid=SessionStore::create($userId,$data);
echo json_encode(['success'=>true,'id'=>$uid]);
break;
case'sessions_update':
$uid=$data['id']??'';
if(!$uid)throw new Exception('Session ID required');
SessionStore::update($uid,$userId,$data);
echo json_encode(['success'=>true]);
break;
case'sessions_delete':
$uid=$data['id']??'';
if(!$uid)throw new Exception('Session ID required');
SessionStore::delete($uid,$userId);
echo json_encode(['success'=>true]);
break;
case'sessions_export':
$sessions=SessionStore::exportAll($userId);
echo json_encode(['success'=>true,'sessions'=>$sessions]);
break;
case'sessions_import':
$incoming=$data['sessions']??[];
if(!is_array($incoming)||empty($incoming)){
throw new Exception('No sessions provided');
}
$added=SessionStore::importSessions($userId,$incoming);
echo json_encode(['success'=>true,'added'=>$added]);
break;
default:
throw new Exception("Invalid session action: $action");
}

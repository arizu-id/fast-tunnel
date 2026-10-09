<?php
/**
 * RFC 6238 time-based one-time passwords (SHA-1, 6 digits, 30 s) — compatible with
 * Google Authenticator, Authy, 1Password, etc. — plus one-time recovery codes.
 */
class Totp{
private const B32='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
public static function generateSecret(int $bytes=20):string{
return self::base32Encode(random_bytes($bytes));
}
public static function base32Encode(string $bin):string{
$bits='';
foreach(str_split($bin)as$c)$bits.=str_pad(decbin(ord($c)),8,'0',STR_PAD_LEFT);
$out='';
foreach(str_split($bits,5)as$chunk)$out.=self::B32[bindec(str_pad($chunk,5,'0'))];
return $out;
}
public static function base32Decode(string $b32):string{
$b32=strtoupper(preg_replace('/[\s=-]/','',$b32));
$bits='';
foreach(str_split($b32)as$c){
$v=strpos(self::B32,$c);
if($v===false)throw new InvalidArgumentException('Invalid base32 secret');
$bits.=str_pad(decbin($v),5,'0',STR_PAD_LEFT);
}
$out='';
foreach(str_split($bits,8)as$byte){if(strlen($byte)===8)$out.=chr(bindec($byte));}
return $out;
}
public static function code(string $secret,int $step,int $digits=6):string{
$hash=hash_hmac('sha1',pack('J',$step),self::base32Decode($secret),true);
$o=ord($hash[19])&0xf;
$val=((ord($hash[$o])&0x7f)<<24)|((ord($hash[$o+1])&0xff)<<16)|((ord($hash[$o+2])&0xff)<<8)|(ord($hash[$o+3])&0xff);
return str_pad((string)($val%(10**$digits)),$digits,'0',STR_PAD_LEFT);
}
public static function currentStep(?int $time=null):int{
return intdiv($time??time(),30);
}
/**
 * Returns the matched time step (so the caller can reject replays) or null.
 * Accepts $window steps either side to tolerate clock drift; only steps > $afterStep are valid.
 */
public static function verify(string $secret,string $input,int $window=1,int $afterStep=0,?int $time=null):?int{
$input=preg_replace('/\s+/','',$input);
if(!preg_match('/^\d{6}$/',$input))return null;
$now=self::currentStep($time);
$match=null;
for($i=-$window;$i<=$window;$i++){
$step=$now+$i;
if($step<=$afterStep)continue;
if(hash_equals(self::code($secret,$step),$input))$match=$step;
}
return $match;
}
public static function otpauthUri(string $account,string $secret,string $issuer='Fast Tunnel'):string{
return 'otpauth://totp/'.rawurlencode($issuer).':'.rawurlencode($account).'?secret='.$secret.'&issuer='.rawurlencode($issuer).'&algorithm=SHA1&digits=6&period=30';
}
/** Ten-character one-time recovery codes like "k3f9a-8xq2m". */
public static function generateRecoveryCodes(int $count=8):array{
$alphabet='abcdefghjkmnpqrstuvwxyz23456789';
$codes=[];
for($i=0;$i<$count;$i++){
$c='';
for($j=0;$j<10;$j++)$c.=$alphabet[random_int(0,strlen($alphabet)-1)];
$codes[]=substr($c,0,5).'-'.substr($c,5);
}
return $codes;
}
public static function hashRecoveryCode(string $code):string{
return hash('sha256',strtolower(preg_replace('/[\s-]/','',$code)));
}
}

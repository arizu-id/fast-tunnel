#!/usr/bin/env bash
# Starts a throw-away SFTP (sshd :2222) and FTP (vsftpd :2121) server with user ftuser/ftpass123,
# used by tests/integration/run.php. Needs root (apt, useradd). Safe to run repeatedly.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
if ! command -v sshd >/dev/null || ! command -v vsftpd >/dev/null; then
  apt-get update -y >/dev/null
  apt-get install -y openssh-server vsftpd >/dev/null
fi
id ftuser >/dev/null 2>&1 || useradd -m -s /bin/bash ftuser
echo 'ftuser:ftpass123' | chpasswd
mkdir -p /run/sshd /var/run/vsftpd/empty
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
cat > /etc/vsftpd_ft.conf <<'CONF'
listen=YES
listen_port=2121
anonymous_enable=NO
local_enable=YES
write_enable=YES
local_umask=022
chroot_local_user=YES
allow_writeable_chroot=YES
pasv_enable=YES
pasv_min_port=30000
pasv_max_port=30010
pasv_address=127.0.0.1
secure_chroot_dir=/var/run/vsftpd/empty
pam_service_name=vsftpd
seccomp_sandbox=NO
CONF
pgrep -f "sshd -p 2222" >/dev/null || /usr/sbin/sshd -p 2222
pgrep -f "vsftpd /etc/vsftpd_ft.conf" >/dev/null || (vsftpd /etc/vsftpd_ft.conf &) 
for i in $(seq 1 30); do (echo > /dev/tcp/127.0.0.1/2222) 2>/dev/null && (echo > /dev/tcp/127.0.0.1/2121) 2>/dev/null && exit 0; sleep 1; done
echo "servers did not start" >&2; exit 1

.PHONY: help install up down restart logs lint test test-integration test-e2e test-all clean
help:
	@echo "Fast Tunnel Commands: make install | make up | make down | make restart | make logs | make lint | make test | make test-integration | make test-e2e | make test-all | make clean"
install:
	composer install --optimize-autoloader
up:
	docker-compose up -d --build
down:
	docker-compose down
restart:
	docker-compose restart
logs:
	docker-compose logs -f app
lint:
	find . -name "*.php" ! -path "./vendor/*" ! -path "./node_modules/*" -exec php -l {} \; | grep -v "^No syntax errors" || true
	for f in assets/js/*.js assets/js/modules/*.js plugins/*/plugin.js tests/e2e/*.mjs; do node --check $$f || exit 1; done
test:
	php tests/php/run.php
# needs a MySQL/MariaDB (FT_DB_*) and, for the file tests, `sudo bash tests/integration/setup-servers.sh`
test-integration:
	FT_SFTP_PORT=$${FT_SFTP_PORT:-2222} FT_FTP_PORT=$${FT_FTP_PORT:-2121} FT_FILE_USER=$${FT_FILE_USER:-ftuser} FT_FILE_PASS=$${FT_FILE_PASS:-ftpass123} php tests/integration/run.php
test-e2e:
	node tests/e2e/db.e2e.mjs && node tests/e2e/files.e2e.mjs && node tests/e2e/fullstack.e2e.mjs
test-all: lint test test-integration test-e2e
clean:
	rm -rf temp_ssh/* scratch/* *.log

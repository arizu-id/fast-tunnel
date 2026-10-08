.PHONY: help install up down restart logs lint clean
help:
	@echo "Fast Tunnel Commands: make install | make up | make down | make restart | make logs | make lint | make clean"
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
	find . -name "*.php" ! -path "./vendor/*" -exec php -l {} \;
clean:
	rm -rf temp_ssh/* scratch/* *.log

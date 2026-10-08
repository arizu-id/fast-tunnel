FROM php:8.2-apache
WORKDIR /var/www/html
RUN apt-get update && apt-get install -y libzip-dev zip unzip git curl libpng-dev libonig-dev libxml2-dev && docker-php-ext-install pdo pdo_mysql zip && docker-php-ext-enable pdo pdo_mysql zip && a2enmod rewrite headers && apt-get clean && rm -rf /var/lib/apt/lists/*
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
COPY . /var/www/html/
RUN chown -R www-data:www-data /var/www/html && chmod -R 755 /var/www/html && mkdir -p /var/www/html/temp_ssh /var/www/html/plugins && chmod -R 775 /var/www/html/temp_ssh /var/www/html/plugins
RUN composer install --no-dev --optimize-autoloader --no-interaction
EXPOSE 80
CMD ["apache2-foreground"]

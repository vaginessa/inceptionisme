#sudo cp upload.php php/upload.php
sudo docker run --rm -p 80:80 -v /var/www/dream-php:/data/www/default -v /var/www/dream-pictures:/upload -v /var/www/dream-upload-logs:/data/logs million12/nginx-php &

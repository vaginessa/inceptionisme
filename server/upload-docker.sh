#sudo cp upload.php php/upload.php
docker run --rm -p 8181:80 -v /home/thluks/PROJECTS/InceptionisME/server/php:/data/www/default -v /home/thluks/PROJECTS/InceptionisME/server/pictures:/upload -v /home/thluks/PROJECTS/InceptionisME/server/upload-logs:/data/logs million12/nginx-php

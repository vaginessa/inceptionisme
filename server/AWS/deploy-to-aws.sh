
scp -i "/home/thluks/PROJECTS/InceptionisME/server/AWS/deepdream-keypair.pem" /home/thluks/PROJECTS/InceptionisME/server/php/upload.php ec2-user@54.148.203.37:/home/ec2-user/upload.php

scp -i "/home/thluks/PROJECTS/InceptionisME/server/AWS/deepdream-keypair.pem" ec2-user@54.148.203.37 --commands "sudo mv /home/ec2-user/upload.php /var/www/dream-php/upload.php"


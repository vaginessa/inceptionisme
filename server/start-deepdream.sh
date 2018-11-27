#docker run -d --name deepdream -p 443:8888 -e "PASSWORD=password" -v /home/thluks/PROJECTS/InceptionisME/server/pictures:/src -v /home/thluks/PROJECTS/InceptionisME/server/output:/dst -v /home/thluks/PROJECTS/InceptionisME/server/scripts:/scripts ryankennedyio/deepdream

docker run --rm --name deepdream -p 443:8888 -e "PASSWORD=password" -v /home/thluks/PROJECTS/InceptionisME/server/pictures:/src -v /home/thluks/PROJECTS/InceptionisME/server/php:/dst -v /home/thluks/PROJECTS/InceptionisME/server/scripts:/scripts ryankennedyio/deepdream python /scripts/deepdream.py

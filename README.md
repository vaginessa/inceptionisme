A deep dream app for Android and iOS. Using Cordova and Docker.

It constsist of:
- The Cordova app (UI)
- A deepdream Docker container (image processing)
- A PHP Docker container (upload/download)

The app uploads the images to the PHP container. 
The PHP container and the deepdream container are using common mounted folders.
The deepdream container will check periodically for new images in the folders and process them.
The PHP container will wait for the image to process and move it to target folder.
The app will poll the PHP container until the image is finished and then load and display it to the user.

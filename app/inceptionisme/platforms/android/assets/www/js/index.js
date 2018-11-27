
var app = {
    deviceId: null,
    appTitle: "Deep Dream Photo Filter",
    galleryFolderName: "DeepDream",
    publicWebsiteAddress: "deepdream.bitwhirl.com",
    devMode: false,

    //mode: "paid",
    freeImageCount: 5,
    freeImageCountFull: 99,
    freeImageReplenishInterval: 2, // hours
    maxImageSize: 800,
    maxHiresImageSize: 2400,
    maxLocalDreamsNum: 10,
    dreamCheckInterval: null,

    hiresDreamCost: 10,

    adColony_appId: "app59c9d8944d824a0880",
    adColony_fullScreenAdZoneId: "vz9500a2f3b2ba41b3ba",
    adColony_rewardedVideoAdZoneId: "vz427f2040129d47be8d",
    rewardedVideoReady: false,

    admobid: {},
    currDreamingPhoto: null,
    localDreams: [],
    currentlyProcessing: false,

    secondsPerImage: 240,
    countDownInterval: 0,

    // TEST
    //serverIp: "10.0.2.2", // workstation local on emu
    //serverIp: "10.0.0.4:8181", // workstation in wlan. also works from emu! :D but changes sometimes.

    // LIVE GKE
    //serverIp: "104.154.92.172:80", // one specific node
    //serverIp: "104.197.114.146:80", // GKE

    // LIVE AWS GPU
    //serverIp: "54.149.248.118:80", // AWS GPU
    //serverIp: "deepdream-loadbalancer-638313880.us-west-2.elb.amazonaws.com:80", // AWS LoadBalancer

    // Baltic Servers
    //serverIp: "188.214.129.130:80",

    // Linode
    //serverIp: "178.79.163.213:8089",
    serverIp: "deepdream.bitwhirl.com:80",

    // Application Constructor
    initialize: function() {
        this.bindEvents();

        if (!shared.isFree) {
            app.freeImageCount = app.freeImageCountFull;

            if (window.localStorage.getItem("dreamTokens") == null) {
                //app.maxImageSize = 1600;
                window.localStorage.setItem("dreamTokens", app.freeImageCount);
            }
        }

    },

    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    onDeviceReady: function() {
        if (device.platform == "iOS") {
            app.appTitle = "InceptionisME";
            app.galleryFolderName = "InceptionisME";
            app.publicWebsiteAddress = "inceptionisme.bitwhirl.com";
            document.title = app.appTitle;
            document.getElementById("titleText").innerHTML = app.appTitle;
            //document.getElementById("website-link").href = "http://"+app.publicWebsiteAddress;
            document.getElementById("website-link").innerHTML = app.publicWebsiteAddress;

            document.getElementById("iosSpacer").style.display = "block";
            document.getElementById("store-button").style.display = "none";
            //document.getElementById("iap-stuff").style.display = "none";
            document.getElementById("iap-stuff").style.margin = "5px 0 0 5px";
            //window.localStorage.setItem("dreamTokens", app.freeImageCountFull);
        }
        else {
            document.getElementById("titleText").innerHTML = "Deep Dream";
            document.getElementById("website-link").innerHTML = "deepdream.bitwhirl.com";
        }

        if (window.plugins != null && window.plugins.orientationLock != null) {
            window.plugins.orientationLock.lock("portrait");
            window.plugins.uniqueDeviceID.get(function(uuid) { app.deviceId = uuid; }, function() {});
        }

        app.receivedEvent('deviceready');

        shared.updateDreamTokens();
        if (window.localStorage.getItem("currStyle") == null) {
            window.localStorage.setItem("currStyle", "normal_");
            window.localStorage.setItem("currStyleName", "Puppyslug Strangeness");
        }
        document.getElementById("currStyle").innerHTML = window.localStorage.getItem("currStyleName");

        document.getElementById("uploadButton").addEventListener('click', app.getImage);
        document.getElementById("deeperButton").addEventListener('click', app.repeatDream);
        document.getElementById("abortButton").addEventListener('click', app.abortDream);
        //document.getElementById("balticAd").addEventListener('click', app.showBalticAd);
        document.getElementById("styleButton").addEventListener('click', function() {
            window.location.href = "styles.html"
            //$.mobile.navigate("styles.html"); // this is an ajax load, doesn't load subsequent js...
        } );
        document.getElementById("reward-button").addEventListener('click', function() {
            if (app.rewardedVideoReady) {
                window.adcolony.showRewardedVideoAd();
            }
            else {
                navigator.notification.alert(
                    "Ad not ready yet. Wait a few seconds...",
                    null,
                    app.appTitle);
            }
        } );

        document.getElementById("website-link").addEventListener('click', function() {
            //cordova.InAppBrowser.open("http://"+app.publicWebsiteAddress, "_blank", "location=no,zoom=yes,hardwareback=yes");
            window.open("http://"+app.publicWebsiteAddress, "_system");
        } );

        if (window.localStorage.getItem("currMode") == null) {
            window.localStorage.setItem("currMode", "basic");
        }
        // High Res and Zoom init
        $(function() {
            if (window.localStorage.getItem("currMode") == "hires") {
                window.localStorage.setItem("currMode", "basic");
                /*
                if (device.platform != "iOS") {
                    navigator.notification.alert(
                        "In High Res mode every image will cost "+app.hiresDreamCost+" Dream Tokens!",
                        null,
                        app.appTitle);
                }*/
            }
            if (window.localStorage.getItem("currMode") == "zoom") {
                $("#uploadButton .front-face span").html("Zoom In");
            }
            $('#mode-select').val(window.localStorage.getItem("currMode"));
            $('#mode-select').trigger("change");
            //alert("mode is now: "+$('#mode-select').val());

            $('#mode-select').change(function() {

                if (shared.advancedFunctions || this.value == "basic") {
                    //alert("hollaback: "+this.value);
                    window.localStorage.setItem("currMode", this.value);

                    if (this.value == "hires") {
                        if (device.platform != "iOS") {
                            navigator.notification.alert(
                                "In High Res mode every image will cost "+app.hiresDreamCost+" Dream Tokens!",
                                null,
                                app.appTitle);
                        }

                        document.getElementById("deeperButton").style.display = "none";
                    }

                    if (this.value == "zoom") {
                        navigator.notification.alert(
                            "In Zoom Journey mode you can travel endlessly into your image.",
                            null,
                            app.appTitle);

                        $("#uploadButton .front-face span").html("Zoom In");
                    }
                    else {
                        $("#uploadButton .front-face span").html("Upload Photo");
                    }
                }
                else {

                    if (this.value == "hires") {
                        navigator.notification.alert(
                            "In High Res mode you can dream images in much higher resolution.",
                            null,
                            app.appTitle);
                    }
                    if (this.value == "zoom") {
                        navigator.notification.alert(
                            "In Zoom Journey mode you can travel endlessly into your image.",
                            null,
                            app.appTitle);
                    }

                    navigator.notification.alert(
                        "This is only available in the full version. Get it from your app store.",
                        null,
                        app.appTitle);

                    window.setTimeout(function() {
                        // reset the select
                        $('#mode-select').val("basic");
                        $('#mode-select').trigger("change");
                    }, 1000);
                }

            });
        });

        // select the right Ad Id according to platform
        if( /(android)/i.test(navigator.userAgent) ) { // for android
            app.admobid = {
                banner: 'ca-app-pub-4609867550240391/9644309060', // or DFP format "/6253334/dfp_example_ad"
                interstitial: 'ca-app-pub-4609867550240391/2121042265'
            };
        } else if(/(ipod|iphone|ipad)/i.test(navigator.userAgent)) { // for ios
            app.admobid = {
                banner: 'ca-app-pub-xxx/zzz', // or DFP format "/6253334/dfp_example_ad"
                interstitial: 'ca-app-pub-xxx/kkk'
            };
        } else { // for windows phone
            app.admobid = {
                banner: 'ca-app-pub-xxx/zzz', // or DFP format "/6253334/dfp_example_ad"
                interstitial: 'ca-app-pub-xxx/kkk'
            };
        }

        // display smart banner at top center, using the default options
        /*
        if(app.displayAds()) AdMob.createBanner( {
            adId: app.admobid.banner,
            position: AdMob.AD_POSITION.TOP_CENTER,
            autoShow: true }
        );*/

        // AdColony

        if (app.displayAds()) {
            window.adcolony.setUp(app.adColony_appId, app.adColony_fullScreenAdZoneId, app.adColony_rewardedVideoAdZoneId);
            window.adcolony.onRewardedVideoAdLoaded = function() {
                //alert('onRewardedVideoAdLoaded');
                app.rewardedVideoReady = true;
                if (shared.isFree) {
                    document.getElementById("reward-button").style.display = "block";
                }
            };
            window.adcolony.onRewardedVideoAdCompleted = function() {
                //alert('onRewardedVideoAdCompleted');
                shared.addDreamTokens(1);
            };
        }

        // load stored dreams list and show it
        var storedLocalDreams = window.localStorage.getItem("localDreams")
        if (storedLocalDreams == null) {
            app.localDreams = [];
        }
        else {
            app.localDreams = JSON.parse(storedLocalDreams);
        }
        app.createImagesList();

        // resume looking for finished dream
        app.currDreamingPhoto = window.localStorage.getItem("currDreamingPhoto");
        if (app.currDreamingPhoto != null) {
            //alert("resume looking for finished dream");
            app.lookForFinishedDreams();
        }

        // show repeat button
        if (window.localStorage.getItem("currMode") != "hires") {
            if (app.localDreams.length > 0) {
                document.getElementById("deeperButton").style.display = "block";
            }
        }
        else {
            document.getElementById("deeperButton").style.display = "none";
        }

        app.replenishFreeImages();
        window.setInterval(app.replenishFreeImages, 30*1000);
    },

    replenishFreeImages: function() {
        // refill free dreams
        if (shared.isFree && shared.getDreamTokensCount() <= 0) {
            var imagesDreamed = window.localStorage.getItem("imagesDreamed");
            var lastImageDreamedTimestamp = window.localStorage.getItem("lastImageDreamedTimestamp");
            //alert("imagesDreamed is: "+imagesDreamed);
            //alert("lastImageDreamedTimestamp is: "+lastImageDreamedTimestamp);

            var currentTimestamp = new Date().getTime();
            if (lastImageDreamedTimestamp > 0
                && currentTimestamp-lastImageDreamedTimestamp > app.freeImageReplenishInterval*60*60*1000) {

                imagesDreamed = 0;
                //alert("setting imagesDreamed to: "+imagesDreamed);
                window.localStorage.setItem("imagesDreamed", imagesDreamed);
                //alert("setting lastImageDreamedTimestamp to: "+0);
                window.localStorage.setItem("lastImageDreamedTimestamp", 0);

                shared.updateDreamTokens();
            }
        }
    },

    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.style.display = "none";
        //receivedElement.style.display = "block";
        document.querySelector('#uploadButton').style.display = "block";

        console.log('Received Event: ' + id);
    },

    dreamingAllowed: function() {
        var dreamingAllowed = false;

        if (window.localStorage.getItem("currMode") == "hires") {
            if (shared.getDreamTokensCount() < app.hiresDreamCost) {
                navigator.notification.alert(
                    "For High Res dreams you need at least "+app.hiresDreamCost+" Dream Tokens. Click the shopping cart.",
                    null,
                    app.appTitle);
            }
            else {
                dreamingAllowed = true;
            }
        }
        else if (shared.isFree && shared.getDreamTokensCount() <= 0) {
            var imagesDreamed = window.localStorage.getItem("imagesDreamed");

            if (imagesDreamed < app.freeImageCount) {
                dreamingAllowed = true;
            }
            else {
                var buyText = " or buy some Dream Tokens and continue dreaming right now";
                if (device.platform == "iOS") {
                    buyText = "";
                }
                navigator.notification.alert(
                    "You have used up your image dreams.\n\nWait "+app.freeImageReplenishInterval+" hours"+buyText+".",
                    null,
                    app.appTitle);
            }
        }
        else {
            dreamingAllowed = true;
        }

        return dreamingAllowed;
    },

    getImage: function() {
        if (app.devMode || app.dreamingAllowed()) {
            var maxImageSize = app.maxImageSize;
            if (window.localStorage.getItem("currMode") == "hires") {
                maxImageSize = app.maxHiresImageSize;
            }

            var cameraOptions = {
                quality: 95,
                destinationType: Camera.DestinationType.FILE_URI, //DATA_URL,
                sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
                correctOrientation: true,
            };
            if (window.localStorage.getItem("currMode") != "hires") {
                // preventing upscale not possible? only set targetW/H if in basic mode
                cameraOptions.targetWidth = maxImageSize;
                cameraOptions.targetHeight = maxImageSize;
            }

            if (window.localStorage.getItem("currMode") == "zoom") {
                var croppingImg = null;

                if (app.localDreams.length <= 0) {
                  // Retrieve image file location from specified source
                  navigator.camera.getPicture(
                      app.cropImage, // success
                      function(message) {
                          window.history.back(); // reset the upload button

                          console.log('ERROR: get picture failed');
                      },
                      cameraOptions
                  );

                }
                else {
                  croppingImg = app.localDreams[app.localDreams.length-1];
                  app.cropImage(croppingImg);
                }


            }
            else {
                // Retrieve image file location from specified source
                navigator.camera.getPicture(
                    app.uploadPhoto, // success
                    function(message) {
                        window.history.back(); // reset the upload button

                        console.log('ERROR: get picture failed');
                    },
                    cameraOptions
                );
            }
        }
        else {
            window.history.back(); // reset the upload button
        }

    },

    cropImage: function(croppingImg) {
      console.log('Cropping image: '+croppingImg);

      window.plugins.crop(function success (newPath) {
        console.log('Cropped image: '+newPath);

        var options = {
              uri: newPath,
              quality: 90,
              width: maxImageSize,
              height: maxImageSize};

        window.ImageResizer.resize(options,
          function(image) {
            console.log('Scaled image: '+image);
            app.uploadPhoto(image);
             // success: image is the new resized image
          }, function() {
            console.log('ERROR: scale image failed');
            // failed: grumpy cat likes this function
          });


      }, function fail () {
        console.log('ERROR: crop image failed');
      }, croppingImg, {quality: 100});
    },

    repeatDream: function() {
        if (app.localDreams.length > 0) {
            if (app.devMode || app.dreamingAllowed()) {
                document.getElementById("deeperButton").style.display = "none";
                app.uploadPhoto(app.localDreams[(app.localDreams.length-1)]);
            }
        }
    },

    uploadPhoto: function(imageURI) {
        var options = new FileUploadOptions();
        options.fileKey="file";
        options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
        options.mimeType="image/jpeg";

        var params = new Object();
        params.dreamStyle = window.localStorage.getItem("currStyle");// app.currStyle;
        params.dreamMode = window.localStorage.getItem("currMode");
        params.deviceId = app.deviceId;
        params.guideImage = window.localStorage.getItem("guideImageId");

        options.params = params;
        options.chunkedMode = false;

        app.showSpinner(true);

        var ft = new FileTransfer();
        //ft.upload(imageURI, "https://127.0.0.1:8181/upload.php", app.winPhoto, app.failPhoto, options);
        // 10.0.2.2 is android emu localhost
        ft.upload(imageURI, "http://"+app.serverIp+"/upload.php", app.winPhoto, app.failPhoto, options);

        app.currentlyProcessing = true;

        if (window.localStorage.getItem("currMode") == "hires") {
            navigator.notification.alert(
                "High Res dreams take a loooong time to process. Be patient. Check back in 10 min for 1000px or 30 min for 2400px image size.",
                null,
                app.appTitle);
        }
    },

    winPhoto: function(r) {
        console.log("Code = " + r.responseCode);
        console.log("Response = " + r.response);
        console.log("Sent = " + r.bytesSent);
        //alert(r.response);

        var answer = r.response.split(":");
        if (answer[0] == "OK") {
            if (app.displayAds()) {
                window.setTimeout(function() {
                    if(app.displayAds) AdMob.prepareInterstitial( {adId:app.admobid.interstitial, autoShow:true} );
                    if(app.displayAds) AdMob.showInterstitial();
                }, 3*1000);
            }

            if (app.currentlyProcessing) { // not cancelled
                app.currDreamingPhoto = answer[1];
                window.localStorage.setItem("currDreamingPhoto", app.currDreamingPhoto);

                app.lookForFinishedDreams();

                document.querySelector('#uploadButton').style.display = "none";

                if (window.localStorage.getItem("publishImages") == null) {
                    navigator.notification.confirm(
                        'Do you want to publish your dreamed images on '+app.publicWebsiteAddress+'?' , // message
                        function(buttonIndex) { // callback to invoke with index of button pressed
                            //alert('You selected button ' + buttonIndex);
                            if (buttonIndex == 1) {
                                window.localStorage.setItem("publishImages", true);
                            }
                            else {
                                window.localStorage.setItem("publishImages", false);
                            }
                        },
                        'Sharing is caring',           // title
                        ['Yes','No']     // buttonLabels
                    );
                }

                //alert("queue count: "+answer[2]+" - "+document.querySelector('#seconds-counter'));
                var secondsValue = answer[2]*app.secondsPerImage;
                if (window.localStorage.getItem("currStyle") == "guided_") {
                    secondsValue = 2*secondsValue;
                }
                document.getElementById("seconds-counter").innerHTML = secondsValue;
                //alert("olo "+document.getElementById("seconds-counter"));
                app.countdownHitZero = false;
                window.clearInterval(app.countDownInterval);
                app.countDownInterval = window.setInterval(app.countDown, 1000);
            }
        }
        else {
            // error from upload server
            alert("Server Error: "+answer[1]);
        }
    },

    failPhoto: function(error) {
        app.showSpinner(false);

        window.history.back(); // reset the upload button
        alert("An error has occurred: Code = " + error.code + "\nCheck your internet access. Or our server might be temporarily unavailable.");
    },

    countDown: function() {
        var seconds = document.getElementById("seconds-counter").innerHTML;
        seconds = parseInt(seconds);

        if (app.countdownHitZero == false && seconds > 0) {
            seconds--;
            document.getElementById("seconds-counter").innerHTML = seconds;

            if (seconds == 0) {
                app.countdownHitZero = true;
            }
        }
        else if (app.countdownHitZero) {
            seconds++;
            document.getElementById("seconds-counter").innerHTML = seconds;
        }
    },

    showSpinner: function(active) {
        if (active) {
            window.history.back(); // reset the upload button
            document.querySelector('#uploadButton').style.display = "none";

            document.querySelector('#abortButton').style.display = "block";

            document.getElementById("loading-spinner").style.display = "block";
        }
        else {
            document.querySelector('#uploadButton').style.display = "block";

            window.history.back(); // reset the abort button
            document.querySelector('#abortButton').style.display = "none";

            document.getElementById("loading-spinner").style.display = "none";
        }
    },

    lookForFinishedDreams: function() {
        window.clearInterval(app.dreamCheckInterval)
        app.dreamCheckInterval = window.setInterval(app.checkDreamedPhoto, 10*1000);
        app.showSpinner(true);
    },

    abortDream: function() {
        app.currentlyProcessing = false;
        app.currDreamingPhoto = null;
        window.localStorage.removeItem("currDreamingPhoto");

        window.clearInterval(app.dreamCheckInterval)

        app.showSpinner(false);

        // show repeat button
        if (window.localStorage.getItem("currMode") != "hires") {
            document.getElementById("deeperButton").style.display = "block";
        }
        else {
            document.getElementById("deeperButton").style.display = "none";
        }

        window.history.back(); // reset the abort button
        window.history.back(); // reset the upload button
    },

    checkDreamedPhoto: function() {
        //for (var i = 0; i < app.currDreamingPhotos.length; i++) {
        //    var currDreamingPhoto = app.currDreamingPhoto[i];

            if (app.currDreamingPhoto != null) {
                var baseUrl = cordova.file.dataDirectory;
                //var baseUrl = cordova.file.documentsDirectory; // img still doesn't show up in iOS
                app.makeDir(baseUrl, app.galleryFolderName); // works in iOS sim now. downloading works, but not visible in photos.
                var store = baseUrl+app.galleryFolderName+"/";

                var dreamUrl = "http://"+app.serverIp+"/dreams/"+app.currDreamingPhoto;
                var currLocalDream = store+app.currDreamingPhoto;

                console.log("update dream: "+dreamUrl);

                var ft = new FileTransfer();
                ft.download(dreamUrl, currLocalDream, function(entry) {
                    // check again! cause it might have been handled by last request
                    if (app.currDreamingPhoto != null) {
                        console.log("File transfer Success!");
                        console.log("storing image to: "+currLocalDream)

                        window.plugins.toast.showShortBottom("Image saved to gallery.");

                        var tmpCurrDreamingPhoto = app.currDreamingPhoto;

                        app.abortDream(); // this resets app.currDreamingPhoto

                        app.localDreams.push(currLocalDream);
                        window.localStorage.setItem("localDreams", JSON.stringify(app.localDreams));

                        // hopefully give the app some time to properly download/store the image
                        // and prevent corrupted images being shown
                        window.setTimeout(function() {
                            app.displayResultImage(currLocalDream);
                        }, 1000);

                        // manage dream tokens
                        var currDreamTokens = window.localStorage.getItem("dreamTokens");

                        if (currDreamTokens > 0) {
                            console.log("we have tokens: "+currDreamTokens);

                            if (window.localStorage.getItem("currMode") == "hires") {
                                shared.addDreamTokens(-1*app.hiresDreamCost);
                            }
                            else {
                                shared.addDreamTokens(-1);
                            }
                        }
                        else {
                            if (shared.isFree) {
                                var imagesDreamed = window.localStorage.getItem("imagesDreamed");
                                if (imagesDreamed == null) {
                                    imagesDreamed = 0;
                                }
                                imagesDreamed++;
                                //alert("setting imagesDreamed to: "+imagesDreamed);
                                window.localStorage.setItem("imagesDreamed", imagesDreamed);

                                shared.updateDreamTokens();

                                if (imagesDreamed >= app.freeImageCount) {
                                    var currentTimestamp = new Date().getTime();
                                    //alert("setting lastImageDreamedTimestamp to: "+currentTimestamp);
                                    window.localStorage.setItem("lastImageDreamedTimestamp", currentTimestamp);
                                }

                                if (imagesDreamed < app.freeImageCount) {
                                    var buyText = "\n\nPlease consider buying some Dream Tokens.";
                                    if (device.platform == "iOS") {
                                        buyText = "";
                                    }
                                    navigator.notification.alert(
                                        "You have "+(app.freeImageCount-imagesDreamed)+" free image dreams left."+buyText,
                                        null,
                                        app.appTitle);
                                }
                            }
                        }

                        // vibrate and beep
                        navigator.notification.vibrate(1000);
                        navigator.notification.beep(1);
                    }
                },
                function(err) {
                    window.history.back(); // reset the upload button

                    console.log("Error");
                    console.dir(err);
                });
            }
        //}
    },

    displayResultImage: function(currLocalDream) {
        app.createImageEntry(currLocalDream);

        // scan the downloaded image with MediaScanner so it appears in gallery
        if (device.platform == "iOS") {
            app.saveToGallery(currLocalDream);
        }
        else {
            window.plugins.scanmedia.scanFile(currLocalDream, function (msg) {
                //alert("Success ScanMedia");
            }, function (err) {
                //alert("Fail ScanMedia: " + err);
            });
        }

        console.log("publishImages is: "+window.localStorage.getItem("publishImages"));
        if (window.localStorage.getItem("publishImages") == "true") {
            console.log("auto publish dream: "+currLocalDream);
            app.publishDream(currLocalDream);
        }
        else {
            window.setTimeout(function() {
                // tell server to delete photo since it was successfully downloaded
                console.log("calling delete.php FileTransfer");
                var ft = new FileTransfer();
                ft.download("http://"+app.serverIp+"/delete.php?imageName="+tmpCurrDreamingPhoto,
                    store+"justlocaldelete.php",
                    function() {
                        console.log("called delete.php FileTransfer WIN!");
                    },
                    function() {
                        console.log("called delete.php FileTransfer FAIL!");
                    });
            }, 1000);
        }

    },

    displayImageFull: function(imagePath) {
        //window.open(imagePath, "_blank", "location=yes"); // opens files in fullscreen default browser
        cordova.InAppBrowser.open(imagePath, "_blank", "location=no,zoom=yes,hardwareback=yes"); // inAppBrowser is a separate plugin, has back button and allows zoom

        //FullScreenImage.showImageURL("img/testresultimg.jpg"); // stupid module only allows images in /www/
        //FullScreenImage.showImageURL(app.localDream); // doesn't work with full filepath, even after hacking the plugin to try and allow paths outside www
    },

    makeDir: function (parentDir, folderName) {
        //step to request a file system
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, fileSystemSuccess, fileSystemFail);

        function fileSystemSuccess(fileSystem) {
            parentDir.getDirectory(folderName, { create: true, exclusive: false }, onDirectorySuccess, onDirectoryFail); // creating folder in sdcard
        }

        function onDirectorySuccess(parent) {
            // Directory created successfuly
        }

        function onDirectoryFail(error) {
            //Error while creating directory
            alert("Unable to create new directory: " + error.code);
        }

        function fileSystemFail(evt) {
            //Unable to access file system
            alert("fileSystemFail: "+evt.target.error.code);
        }
    },

    httpGet: function(url) {
        var request = new XMLHttpRequest();
        console.log("httpGet calling: "+url);
        request.open("GET", url, true);
        request.onreadystatechange = function() {
            if (request.readyState == 4) {
                if (request.status == 200 || request.status == 0) {
                    // -> request.responseText <- is a result
                }
            }
        }
        request.send();
    },

    displayAds: function() {
        return (shared.isFree && (typeof AdMob !== 'undefined') && shared.getDreamTokensCount() <= 0 && device.platform != "iOS");
    },

    showBalticAd: function() {
        cordova.InAppBrowser.open("https://www.balticservers.com/en/gpu-servers?linkedFromDeepDreamPhotoFilter",
            "_blank",
            "location=yes,zoom=yes,hardwareback=yes");
    },

    saveToGallery: function(imgUrl) {
        var newImg = new Image();
        newImg.onload = function() {
            // Create an empty canvas element
            var canvas = document.createElement("canvas");
            canvas.width = newImg.width;
            canvas.height = newImg.height;

            // Copy the image contents to the canvas
            var ctx = canvas.getContext("2d");
            ctx.drawImage(newImg, 0, 0);

            window.canvas2ImagePlugin.saveImageDataToLibrary(
                    function(msg){
                        console.log(msg);
                    },
                    function(err){
                        console.log(err);
                    },
                    canvas
                );
        }

        newImg.src = imgUrl; // this must be done AFTER setting onload
    },

    shareDream: function(img) {
        //var img = document.getElementById("result-img");

        var newImg = new Image();
        newImg.onload = function() {
            // Create an empty canvas element
            var canvas = document.createElement("canvas");
            canvas.width = newImg.width;
            canvas.height = newImg.height;

            // Copy the image contents to the canvas
            var ctx = canvas.getContext("2d");
            ctx.drawImage(newImg, 0, 0);

            // Get the data-URL formatted image
            // Firefox supports PNG and JPEG. You could check newImg.src to
            // guess the original format, but be aware the using "image/jpg"
            // will re-encode the image.
            var dataURL = canvas.toDataURL("image/png");

            //dataURL = dataURL.replace(/^data:image\/(png|jpg);base64,/, "");

            // Beware: passing a base64 file as 'data:' is not supported on Android 2.x: https://code.google.com/p/android/issues/detail?id=7901#c43
            // Hint: when sharing a base64 encoded file on Android you can set the filename by passing it as the subject (second param)
            window.plugins.socialsharing.share(
                "Dreamed by "+app.appTitle,
                "I deep dreamed this image",
                dataURL,
                null
            );
            //alert ('The image size is '+width+'*'+height);
        }
        newImg.src = img.src; // this must be done AFTER setting onload

    },

    publishDream: function(imageURI) {
        var options = new FileUploadOptions();
        options.fileKey="file";
        options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
        options.mimeType="image/jpeg";

        var params = new Object();

        options.params = params;
        options.chunkedMode = false;

        var ft = new FileTransfer();
        ft.upload(imageURI, "http://"+app.serverIp+"/publish.php",
            function() {
                window.plugins.toast.showShortBottom("Image published on "+app.publicWebsiteAddress);
                console.log("image publish upload win!");
            },
            function() {
                console.log("image publish upload failed.");
            }
            , options);
    },

    createImagesList: function() {
        //if (app.devMode) app.createImageEntry("img/testresultimg.jpg");

        if (app.localDreams != null) {
            if (app.localDreams.length > app.maxLocalDreamsNum) {
                app.localDreams = app.localDreams.slice(app.localDreams.length-app.maxLocalDreamsNum, app.localDreams.length);
            }

            for (var i = 0; i < app.localDreams.length; i++) {
                app.createImageEntry(app.localDreams[i]);
            }

            if (app.localDreams.length > 0) {
                document.getElementById("gallery-hint").style.display = "block";
            }
        }

        //if (app.devMode) app.createImageEntry("img/testresultimg.jpg");
    },

    createImageEntry: function(imagePath) {
        var listContainer = document.getElementById("images-container");

        var newImgEntry = document.createElement("div");
        newImgEntry.className = "result-entry";

        var newImg = document.createElement("img");
        newImg.addEventListener('click', function () { app.displayImageFull(imagePath); } );
        newImg.className = "result-img";
        newImg.src = imagePath;

        // share button
        var newShareContainer = document.createElement("div");
        newShareContainer.addEventListener('click', function () { app.shareDream(newImg); } );
        newShareContainer.className = "btn share-button";
        newShareContainer.innerHTML = " Share";

        var newShareIcon = document.createElement("img");
        newShareIcon.src = "img/share-icon-small.png";

        if (window.localStorage.getItem("publishImages") != "true") {
            // publish button
            var newPublishContainer = document.createElement("div");
            newPublishContainer.addEventListener('click', function () { app.publishDream(imagePath); } );
            newPublishContainer.className = "btn publish-button";
            newPublishContainer.innerHTML = " Make public";

            newImgEntry.appendChild(newPublishContainer);
        }

        // put it together
        newShareContainer.insertBefore(newShareIcon, newShareContainer.childNodes[0]);
        newImgEntry.appendChild(newShareContainer);
        newImgEntry.appendChild(newImg);
        listContainer.insertBefore(newImgEntry, listContainer.childNodes[0]);
    },

};

app.initialize();

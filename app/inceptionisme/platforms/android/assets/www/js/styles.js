
// Our application's global object
var app = {
    serverIp: "deepdream.bitwhirl.com:80"

};

//
// Constructor
// -----------
//

app.initialize = function() {

    // Listen to the deviceready event.
    // Make sure the score of 'this' isn't lost.
    document.addEventListener('deviceready', app.onDeviceReady, false);
};

app.onDeviceReady = function() {
    if (device.platform == "iOS") {
        document.getElementById("iosSpacer").style.display = "block";
    }
    
    var storedGuideImg = window.localStorage.getItem("guideImage");
    if (storedGuideImg != null) {
        //alert("setting guide img to : "+storedGuideImg);
        document.querySelector('#guide-img').src = storedGuideImg;
        document.querySelector('#guide-style').style.display = "block";
    }
    
    document.querySelector('#upload-guide').addEventListener('click', function() {
        if (shared.advancedFunctions) {
            app.getGuideImage();
        }
        else {
            navigator.notification.alert(
                "This is only available in the full version. Get it from your app store.", 
                null,
                app.appTitle);                    
        }
    });
    document.querySelector('#guide-img').addEventListener('click', app.setStyle.bind(document.querySelector('#guide-style')));

    var styleDemos = document.querySelectorAll('#style-demos div');

    for (var i = 0; i < styleDemos.length; i++) {
        var tmpDemo = styleDemos[i];
        var tmpDreamStyle = styleDemos[i].getAttribute("data-dreamstyle");
        styleDemos[i].addEventListener('click', app.setStyle.bind(tmpDemo));
    }
};

app.setStyle = function() {
    var chosenStyle = this.getAttribute("data-dreamstyle");
    var chosenStyleName = this.getAttribute("data-dreamstylename");
    window.localStorage.setItem("currStyle", chosenStyle);
    window.localStorage.setItem("currStyleName", chosenStyleName);
    //alert("style: "+chosenStyle)
    window.history.back();
};

app.getGuideImage = function() {
    var cameraOptions = {
        quality: 95, 
        destinationType: Camera.DestinationType.FILE_URI, //DATA_URL,
        sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
        correctOrientation: true,
        targetWidth: 224,
        targetHeight: 224,
        allowEdit: true
    };

    // Retrieve image file location from specified source
    navigator.camera.getPicture(
        app.uploadGuide, // success
        function(message) {
            window.history.back(); // reset the upload button

            console.log('ERROR: get guide picture failed');
        },
        cameraOptions
    );
};

app.uploadGuide = function(imageURI) {
    var options = new FileUploadOptions();
    options.fileKey="file";
    options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
    options.mimeType="image/jpeg";

    var params = new Object();
    params.guide = "true";
    params.deviceId = app.deviceId;

    options.params = params;
    options.chunkedMode = false;

    document.querySelector('#guide-style').style.display = "none";
    document.querySelector('#loading-spinner').style.display = "block";

    var ft = new FileTransfer();
    //ft.upload(imageURI, "https://127.0.0.1:8181/upload.php", app.winPhoto, app.failPhoto, options);
    // 10.0.2.2 is android emu localhost
    ft.upload(imageURI, "http://"+app.serverIp+"/upload.php", 
                function(r) { // win
                    console.log("Code = " + r.responseCode);
                    console.log("Response = " + r.response);
                    console.log("Sent = " + r.bytesSent);

                    var answer = r.response.split(":");
                    if (answer[0] == "OK") {                    
                        //alert("guide uploaded: "+imageURI);
                        document.querySelector('#guide-img').src = imageURI;

                        document.querySelector('#guide-style').style.display = "block";
                        document.querySelector('#loading-spinner').style.display = "none";

                        window.localStorage.setItem("guideImage", imageURI);
                        window.localStorage.setItem("guideImageId", answer[1]);

                        window.localStorage.setItem("currStyle", document.querySelector('#guide-style').getAttribute("data-dreamstyle"));
                        window.localStorage.setItem("currStyleName", document.querySelector('#guide-style').getAttribute("data-dreamstylename"));
                    }
                }, 
                function() { // fail
                    alert("Guide upload failed. Check your internet connection.");
                }, 
                options
            );

    app.currentlyProcessing = true;

};

app.initialize();
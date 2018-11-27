
$( document ).ready(function() {

    var $grid = $('.grid').masonry({
        itemSelector: '.grid-item',
        columnWidth: ".grid-sizer",
        percentPosition: true
    });

    // layout Masonry after each image loads
    $grid.imagesLoaded().progress( function() {
        console.log("layout!");
        $grid.masonry('layout');
    });        

    console.log($("#grid"))

    var imgLoad = imagesLoaded($("#grid"));
    function onAlways( instance ) {
      console.log('all images are loaded');
      console.log("layout!");
      $grid.masonry('layout');
    }
    // bind with .on()
    imgLoad.on( 'always', onAlways );
    // unbind with .off()
    imgLoad.off( 'always', onAlways );

});

// facebook page plugin
(function(d, s, id) {
          var js, fjs = d.getElementsByTagName(s)[0];
          if (d.getElementById(id)) return;
          js = d.createElement(s); js.id = id;
          js.src = "//connect.facebook.net/de_DE/sdk.js#xfbml=1&version=v2.4&appId=128167614195615";
          //js.src = "js/fb-sdk.js#xfbml=1&version=v2.4&appId=128167614195615";
          fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
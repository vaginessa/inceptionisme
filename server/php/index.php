<?php
// script-src 'self' *.facebook.net *.facebook.com http://connect.facebook.net 'unsafe-eval' 'unsafe-inline'; 
$olo = "default-src 'self' *.facebook.net *.facebook.com http://connect.facebook.net data: gap: https://ssl.gstatic.com 'unsafe-eval' 'unsafe-inline';";

header("Content-Security-Policy: ".$olo); 
header("X-WebKit-CSP: ".$olo); 
header("X-Content-Security-Policy: ".$olo); 
//header("X-Content-Security-Policy: script-src 'self' *.facebook.net; default-src 'self' data: gap: *.facebook.net http://connect.facebook.net https://ssl.gstatic.com 'unsafe-eval' 'unsafe-inline';"); 
//header("Content-Security-Policy: script-src 'self' http://connect.facebook.net;"); 
//header("X-Content-Security-Policy: script-src 'self' *.facebook.net; default-src 'self' data: gap: *.facebook.net;"); 
?>
<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Security-Policy" content="<?php echo $olo; ?>">

        <meta name="format-detection" content="telephone=no">
        <meta name="msapplication-tap-highlight" content="no">
        <meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width">

        <link rel="stylesheet" type="text/css" href="css/public.css">

        <script type="text/javascript" src="js/jquery-1.11.3.min.js"></script>
        <script type="text/javascript" src="js/masonry.pkgd.min.js"></script>
        <script type="text/javascript" src="js/imagesloaded.pkgd.min.js"></script>
        <script type="text/javascript" src="js/public.js"></script>

        <title>Deep Dream Photo Filter</title>

    </head>

    <body>
        <div id="fb-root"></div>

        <div style="width: 128px; margin: 0 auto;">
            <a href="index.php">
                <img src="img/deep-dream-me-logo-512px.png" style="width: 100%;">
            </a>
        </div>        

        <div style="width: 320px; margin: 0 auto;">
            <h1>Deep Dream Photo Filter</h1>
            <p>These images were made with the <br />
                <a href="https://play.google.com/store/apps/details?id=ch.scydev.inceptionisme" target="_blank">Deep Dream Photo Filter</a><br />
                 app for Android.</p>
        </div>

        <div style="width: 320px; margin: 0 auto;">
            <div class="fb-page" data-href="https://www.facebook.com/deepdreamin" data-width="300" data-height="200" data-small-header="true" data-adapt-container-width="true" data-hide-cover="false" data-show-facepile="true" data-show-posts="false">
                <div class="fb-xfbml-parse-ignore">
                    <blockquote cite="https://www.facebook.com/deepdreamin">
                        <a href="https://www.facebook.com/deepdreamin"></a>
                    </blockquote>
                </div>
            </div>
        </div>

<!--
<iframe src="//www.facebook.com/plugins/likebox.php?href=www.facebook.com%2Fdeepdreamin&amp;width=292&amp;height=300&amp;colorscheme=light&amp;show_faces=true&amp;border_color=&amp;stream=false&amp;header=true" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:292px; height:300px;" allowtransparency="true"></iframe>        
-->
        <div id="grid" class="grid js-masonry">
            <div class="grid-sizer"></div>
            <?php 
                $files = glob('dreams/public/*.jpg');
                usort($files, function($a, $b) {
                    return filemtime($a) < filemtime($b);
                });

                $fileCounter = 0;
                $filesPerPage = 20;
                $page = 0;
                if (isset($_GET["p"]) && $_GET["p"] != null && $_GET["p"] > 0) {
                    $page = $_GET["p"];
                }
                $from = $filesPerPage * $page;
                $to = $from + $filesPerPage;

                    foreach ($files as $entry) {

                        if ($entry != "." && $entry != "..") {
                            if ($fileCounter >= $from && $fileCounter < $to) {

                                $widthMultiplier = rand(1, 6);
                                if ($widthMultiplier >= 5) {
                                    $widthMultiplier = "grid-item--width2";
                                }
                                else {
                                    $widthMultiplier = "";
                                }

                                ?>
                                    <div class="grid-item <?php echo $widthMultiplier; ?>" >
                                        <a href="<?php echo $entry ?>">
                                            <img src="<?php echo $entry ?>" style="width:100%;">
                                        </a>
                                    </div>

                                    <!-- <div class="grid-item grid-item--width2">...</div> -->
                                <?php
                            }
                            $fileCounter++;
                        }
                    }

            ?>
        </div>

        <br />
        <br />
        <div style="width: 320px; margin: 0 auto;">
            <p><a href="index.php?p=<?php echo $page+1 ?>">More Images</a></p>
        </div>
        <br />
        <br />

    </body>
</html>

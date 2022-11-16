<?php
/**
 * Created by Igor
 * Date: 28.03.2017
 */

?>

    </div> <!--  page-wrap  -->

    <!--  FOOTER  -->
    <footer>
        <div class="panel">
            <div class="panel-content">
                <div class="main-content container display-table">
                    <div class="row table-row">
                        <div class="table-cell">
                            <img class="logo" src="<?php echo get_template_directory_uri() ?>/img/logo-white.png">

                            <!-- SOCIAL ICONS -->
                            <?php gsTemplates::SocialIcons() ?>

                        </div>
                        <div class="table-cell">
                            <nav id="nav-footer" class="nav-menu" role="navigation">

                                <?php
                                    wp_nav_menu( array('theme_location' => 'footer-menu',
                                                        'container' => false ));
                                ?>

                            </nav>
                        </div>
                        <div class="table-cell">
                            <div class="slogan">Tell your friends about GuitarSteam</div>
                            <br/>
                            <div class="social-icons">
                                <div id="fb-root"></div>
                                <div class="fb-share-button" data-href="https://guitarsteam.com/" data-layout="button_count" data-size="large">
                                    <a target="_blank" href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fguitarsteam.com%2F&amp;src=sdkpreparse" class="fb-xfbml-parse-ignore"></a>
                                </div>
                                <script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.3&appId=1443849932292795&autoLogAppEvents=1"></script>
                            </div>
                            </br>
                            <div class="legal">GuitarSteam is a registered trademark. All rights reserved.</div>
                        </div>
                    </div>
                </div>
                <div class="copy visible-xs">
                    <?= date('Y') ?> &copy; GuitarSteam.com
                </div>
                <div class="copy hidden-xs">
                    <?= date('Y') ?> &copy; GuitarSteam.com
                </div>
            </div>
        </div>
    </footer>

    <?php wp_footer() ?>
    <?php echo get_option( 'google-analytics' ) ?>

    <script>

        var jsBaseUrl = '<?php echo get_template_directory_uri(); ?>/js/';
        var jsPlayerUrl = '<?php echo get_template_directory_uri(); ?>/js/player/';
        var jsPlayerLibUrl = jsBaseUrl + 'lib/player/';
        var playerImagesUrl = '<?php echo get_template_directory_uri(); ?>/img/player/';
        var SERVER_ENVIRONMENT = '<?= ENVIRONMENT ?>';

    </script>
    <?php
    if ( ENVIRONMENT == 'LIVE' )
    { ?>

        <!-- Global site tag (gtag.js) - Google Analytics -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=UA-141909290-1"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'UA-141909290-1');
        </script>

    <?php } ?>

    <script src="<?php echo get_template_directory_uri() ?>/js/lib/require.js"></script>
    <script>require(['<?php echo get_template_directory_uri() ?>/js/main.js?v=2'])</script>

</body>
</html>

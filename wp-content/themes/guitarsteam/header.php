<?php
/**
 * Created by Igor
 * Date: 28.03.2017
 */

$login_state = 'data-login_state="0"';

if ( get_current_user_id() )
    $login_state = 'data-login_state="1"';

?>
<html>
<head>

    <?php gsTemplates::TitleAndDescription() ?>

    <meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no, width=device-width">
    <meta charset="utf-8">

    <?php
    if ( ENVIRONMENT == 'LIVE' )
    { ?>

        <!-- Google Tag Manager -->
        <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-KZ3TXD3');</script>
        <!-- End Google Tag Manager -->

    <?php
    }
    ?>

    <link rel="shortcut icon" href="<?= get_template_directory_uri() ?>/img/favicon.ico" type="image/x-icon">

    <?php wp_head(); ?>

</head>

<body style="overflow: auto; overflow-x: hidden" <?php echo $login_state; ?> >

    <?php
    if ( ENVIRONMENT == 'LIVE' )
    { ?>

        <!-- Google Tag Manager (noscript) -->
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KZ3TXD3"
                          height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
        <!-- End Google Tag Manager (noscript) -->

    <?php
    }
    ?>

    <div class="background-img">
        <div class="background-dark"></div>
        <div class="background-gradient"></div>
    </div>
    <div class="preload">
        <!--  Song array element  -->
        <?php get_template_part('templates/element', 'song-array') ?>
        <!--  Alert  -->
        <?php get_template_part('templates/element', 'alert') ?>

        <!--  Login form  -->
        <?php get_template_part('templates/element', 'login-form') ?>
        <!--  Registration form  -->
        <?php get_template_part('templates/element', 'register-form') ?>

        <!--  Payment form  -->
        <?php get_template_part('templates/element', 'payment-form') ?>

        <!--  User panel  -->
        <div id="userpanel_1">
            <?php gsTemplates::UserPanel( true ) ?>
        </div>
        <div id="userpanel_0">5
            <?php gsTemplates::UserPanel( false ) ?>
        </div>

        <!--  Message Box  -->
        <div id="message_box" class="message_box panel">
            <div class="box_title panel-content top solid">
            </div>
            <div class="box_content panel-content bottom plastic_cian">
            </div>
        </div>

        <!--  Round Spinner  -->
        <div id="round_spinner">
            <div class="round_spinner">
                <div class="spinner_body"></div>
            </div>
        </div>

        <!--  Load Screen Tip  -->
        <div class="load_screen_tip">
            <?= gsUtils::GetLoadScreenTip() ?>
        </div>

    </div>

<div class="page-wrap">
    <header>
        <!--  Desktop header  -->
        <div class="desktop row">
            <div class="col-sm-12">
                <div class="container">
                    <div class="top-panel">

                        <div class="header-logo">
                            <a href="<?php echo get_site_url() ?>">
                                <img src="<?php echo get_template_directory_uri() ?>/img/logo-white.png"/>
                            </a>
                            <div class="header-slogan laptop-slogan">
                                <div>New age guitar</div>
                                <div>experience</div>
                            </div>
                        </div>

                        <div class="panel social-user">
                            <div class="panel-content">
                                <!-- SOCIAL ICONS -->
                                <?php gsTemplates::SocialIcons( 'display-flex' ) ?>

                                <div class="userpanel">
                                    <?php
                                    if ( get_current_user_id() )
                                        gsTemplates::UserPanel( true );
                                    else
                                        gsTemplates::UserPanel( false );
                                    ?>
                                </div>
                            </div>
                        </div>

                        <div class="header-slogan desktop-slogan">
                            <div>New age guitar</div>
                            <div>experience</div>
                        </div>

                    </div>
                </div>
            </div>

            <div class="panel top-center col-sm-12">
                <div class="panel-content">
                    <nav id="nav-main" class="nav-menu" role="navigation">
                        <div class="container">
                            <?php
                            wp_nav_menu( array('theme_location' => 'main-menu',
                                'container' => false,
                                'menu_class' => 'display-flex' ));
                            ?>
                        </div>
                    </nav>
                </div>
            </div>

        </div>

        <!--  Mobile header  -->
        <div class="mobile row">
            <div class="col-sm-12">
                <div class="container">
                    <div class="top-panel">

                        <div class="header-logo">
                            <a href="<?php echo get_site_url() ?>">
                                <img src="<?php echo get_template_directory_uri() ?>/img/logo-white.png"/>
                            </a>
                            <div class="header-slogan laptop-slogan">
                                <div>New age guitar</div>
                                <div>experience</div>
                            </div>
                        </div>


                        <div class="header-slogan desktop-slogan">
                            <div>New age guitar</div>
                            <div>experience</div>
                        </div>

                    </div>
                </div>
            </div>

            <div class="panel top-center col-sm-12">
                <div class="panel-content">
                    <nav id="nav-main" class="nav-menu" role="navigation">
                        <div class="nav-panel">
                            <div class="navbar-toggler">
                                <a id="mobile-menu-toggle" class="mobilemenu_toggle" href="http://guitarsteam.test/shop" >
                                    <div class="line"></div>
                                    <div class="line"></div>
                                    <div class="line"></div>
                                </a>
                            </div>

                            <div class="userpanel">
                                <?php
                                if ( get_current_user_id() )
                                    gsTemplates::UserPanel( true );
                                else
                                    gsTemplates::UserPanel( false );
                                ?>
                            </div>

                            <!-- SOCIAL ICONS -->
                            <?php gsTemplates::SocialIcons( 'display-flex' ) ?>
                        </div>

                        <div id="mobile-menu" style="display: none">
                            <?php
                            wp_nav_menu( array('theme_location' => 'main-menu',
                                'container' => false,
                                'menu_class' => 'display-flex' ));
                            ?>
                        </div>
                    </nav>
                </div>
            </div>
        </div>
    </header>
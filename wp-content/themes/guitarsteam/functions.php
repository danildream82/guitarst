<?php
/**
 * Created by Igor
 * Date: 28.03.2017
 */

require_once 'inc/lib/vendor/autoload.php'; // PHP composer

include_once ABSPATH . "gs-config.php";
include_once "inc/utils.php";
include_once "inc/user.php";
include_once "inc/sendgrid.php";
include_once "inc/custom-post-types.php";
include_once "inc/login.php";
include_once "inc/song.php";
include_once "inc/search.php";
include_once "inc/open-graph.php";
include_once "templates/gsTemplates.php";
include_once "inc/shortcodes/module-base.php";
include_once "inc/shortcodes/page-feedback.php";
include_once "inc/shortcodes/contact-form.php";
include_once "inc/shortcodes/player-manual.php";
include_once "inc/shortcodes/test-tabs.php";
include_once "inc/shortcodes/popularity.php";
include_once "woocommerce/gs-hooks.php";

add_theme_support( 'woocommerce' );

/**
 * Load styles and scripts
 **/
add_action('wp_enqueue_scripts', 'load_style_script');
function load_style_script ()
{
    if( !is_admin() ) {
        wp_deregister_script("jquery");
    }

    wp_enqueue_style('bootstrap', get_template_directory_uri() . '/css/bootstrap.min.css');
    wp_enqueue_style('fancybox', get_template_directory_uri() . '/js/lib/fancybox/jquery.fancybox.min.css');
    wp_enqueue_style('style', get_template_directory_uri() . '/style.css');
    wp_enqueue_style('style-elements', get_template_directory_uri() . '/css/elements.css');
    wp_enqueue_style('style-spinners', get_template_directory_uri() . '/css/spinners.css');
    wp_enqueue_style('jquery-ui', get_template_directory_uri() . '/css/jquery-ui.css');
	wp_enqueue_style('swiper', get_template_directory_uri() . '/css/swiper.css');
	
}

/**
 * MENUS
 **/
register_nav_menu('main-menu', 'Main Menu');
register_nav_menu('footer-menu', 'Footer Menu');

/**
 * SIDEBARS
 **/
register_sidebar(array(
    'name' => 'Left Sidebar',
    'id' => 'left-sidebar',
    'description' => 'Main sidebar'));

// Init WIDGETS
include_once "inc/widgets.php";

// Global settings in admin panel
include_once "inc/admin_panel.php";

// Thumbnail support
add_theme_support('post-thumbnails');

// Image sizes
add_image_size('gs-song-thumb', 100, 100 );

// Prevent WP logout page redirect
add_action( 'wp_logout', function(){
    wp_redirect( home_url() );
    exit();
});

/**
 * Change default gravatar.
 */

add_filter( 'avatar_defaults', 'new_gravatar' );
function new_gravatar( $avatar_defaults )
{
    $myavatar = get_template_directory_uri() . '/img/icon/userpic.jpg';
    $avatar_defaults[$myavatar] = "GS Avatar";
    return $avatar_defaults;
}

// Редирект со страниц аттачментов
/*************************************************************************/
function gsTemplates( $template )
{
    global $post;
    global $term;

    $term = get_queried_object();
    $post_type = get_post_type();

    $url = wp_get_attachment_url( $term->ID );

    if ( $post_type == 'attachment' )
    {
        header( 'Location: ' . $url, true, 301 );
    }

    return $template;
}
/*************************************************************************/

add_filter('template_include', 'gsTemplates');

?>
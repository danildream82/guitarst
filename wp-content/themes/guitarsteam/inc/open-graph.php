<?php
/**
 * Created by PhpStorm.
 * User: Igor
 * Date: 22.12.2018
 * Time: 17:38
 */

function add_opengraph_doctype( $output )
{
    return $output . ' xmlns:og="http://opengraphprotocol.org/schema/" xmlns:fb="http://www.facebook.com/2008/fbml"';
}
add_filter('language_attributes', 'add_opengraph_doctype', 10, 2 );

//*********************************************************************************************
function gsOpenGraphMeta()
{
    global $post;

    if ( $post == false )
        return;

    $title = get_the_title();

    if ( $title == 'Frontpage' )
    {
        $title = 'GuitarSteam';
    }
    else
    if ( $post->post_type = 'product' )
    {
        $song = new gsSong( $post->ID );

        if ( $song->product )
            $title = $song->GetName() . ' - ' . $song->GetOrgnArtist() . ' | Guitar Tabs Online';
    }

//    if ( !is_singular())
//        return;

//    echo '<meta property="fb:admins" content="https://graph.facebook.com/danildream"/>';
    echo '<meta property="og:title" content="' . $title . '"/>' . "\n";
    echo '<meta property="og:type" content="website"/>' . "\n";
    echo '<meta property="og:url" content="' . get_permalink() . '"/>' . "\n";
    echo '<meta property="og:site_name" content="GuitarSteam"/>' . "\n";

    if ( !has_post_thumbnail( $post->ID ))
    {
        $default_image = get_template_directory_uri() . '/img/Open-graph.jpg';
        echo '<meta property="og:image" content="' . $default_image . '"/>' . "\n";
        echo '<meta property="og:description" content="3D Tabs Online Player | Tabs Collection | Guitar players community" />' . "\n";
    }
    else{
        $thumbnail_src = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ), 'medium' );
        echo '<meta property="og:image" content="' . esc_attr( $thumbnail_src[0] ) . '"/>' . "\n";
    }
}
add_action( 'wp_head', 'gsOpenGraphMeta', 5 );

?>
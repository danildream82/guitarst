<?php
/**
 * Created by PhpStorm.
 * User: Igor
 * Date: 27.06.2019
 * Time: 13:58
 */

function gsSetDefaultPopularity()
{
    $params = [
        'post_type' => 'product',
        'posts_per_page' => -1,
        'post_status' => 'publish'
    ];

    $query = new WP_Query( $params );

    $count = 0;

    foreach( $query->posts as $post )
    {
        $popularity = get_post_meta( $post->ID, 'song_popularity', true );

        if ( $popularity == false )
        {
            update_post_meta( $post->ID, 'song_popularity', 2 );
            $count++;
        }
    }

    echo 'Posts updated: ' . $count . '<br>';
    echo 'Done';
}
//**********************************************************************************************
//##############################################################################################

add_shortcode( 'set-default-popularity', 'gsSetDefaultPopularity' );

?>
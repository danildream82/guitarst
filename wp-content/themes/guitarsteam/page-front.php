<?php
/*
 * Template Name: Front Page
 *
 * Created by Sublime Text 3.
 * User: Evgeniy
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

get_header();

$search_params = [
    'page' => (get_query_var('page')) ? get_query_var('page') : 1,
    'keyword' => ($_GET['key']) ? $_GET['key'] : '',
    'complexity' => ($_GET['lvl']) ? $_GET['lvl'] : '',
    'genre' => ($_GET['gnr']) ? intval( $_GET['gnr'] ) : ''
];

$search = new gsSearch();

$search->SongGeneral( $search_params );

?>

    <div class="page-container">

        <!--  SLIDER  -->
        <?php get_template_part('templates/content', 'slider') ?>


        <!--  SIDEBAR  -->
        <?php get_template_part('templates/content', 'sidebar') ?>

        <!--  Page content  -->
        <div id="search-marker" class="container">

            <!--  Song Search form  -->
            <div class="panel container" style="float: none">

                <div class="search-form-wrapper panel-content">
                    <?php get_template_part('templates/element', 'song-search') ?>
                </div>

            </div>

            <div class="songs-block">

                <!--  Pagination  -->
                <div class="pagination_container">
                    <?php echo $search->song_search_pager ?>
                </div>

                <!--  Songs  -->
                <section class="song-array">

                    <?php
                    foreach( $search->song_search_result as $song )
                    {
                        get_template_part('templates/element', 'song-array');
                    }
                    ?>

                </section>

                <!--  Pagination  -->
                <div class="pagination_container">
                    <?php echo $search->song_search_pager ?>
                </div>
            </div>

            <!--  Button and spinning wheel
            <div style="clear:both"></div>
            <div class="button bald"> кнопка </div>-->

        </div>
    </div>

<?php
get_template_part('templates/element', 'player');

get_footer( 'shop' );
?>
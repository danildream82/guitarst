<?php
/**
 * Created by Igor
 * Date: 31.03.2017
 *
 * * The Template for displaying product archives, including the main shop page which is a post type archive.
 * Override this template by copying it to yourtheme/woocommerce/archive-product.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

get_header( 'shop' );

?>

    <div class="page-container">

        <!--  SIDEBAR  -->
        <?php get_template_part('templates/content', 'sidebar') ?>

        <!--  Page content  -->
        <div class="page-content container">

            <!--  Song Search form  -->

            <div class="panel container" style="float: none">

                <div class="search-form-wrapper panel-content">
                    <?php get_template_part('templates/element', 'song-search') ?>
                </div>

            </div>

            <!--  Pagination  -->

            <div class="pagination">
                <ul class="clearfix">
                    <li class="prev"><a rel="prev" href="#"></a></li>
                    <li class="sel"><a href="#">1</a></li>
                    <li><a rel="next" href="#">2</a></li>
                    <li><a href="#">3</a></li>
                    <li><a href="#">4</a></li>
                    <li><a href="#">5</a></li>
                    <li class="page gap"><span>…</span></li>
                    <li><a href="#">15</a></li>
                    <li class="next"><a rel="next" href="#"></a></li>
                </ul>
            </div>

            <!--  Songs  -->

            <section class="song-array">
            </section>

            <!--  Pagination  -->

            <div class="pagination">
                <ul class="clearfix">
                    <li class="prev"><a rel="prev" href="#"></a></li>
                    <li class="sel"><a href="#">1</a></li>
                    <li><a rel="next" href="#">2</a></li>
                    <li><a href="#">3</a></li>
                    <li><a href="#">4</a></li>
                    <li><a href="#">5</a></li>
                    <li class="page gap"><span>…</span></li>
                    <li><a href="#">15</a></li>
                    <li class="next"><a rel="next" href="#"></a></li>
                </ul>
            </div>

            <!--  Button and spinning wheel
            <div style="clear:both"></div>
            <div class="button bald"> кнопка </div>-->

        </div>
    </div>

<?php
    get_footer( 'shop' );
?>
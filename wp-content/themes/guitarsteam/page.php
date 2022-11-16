<?php
/**
 * Created by Igor
 * Date: 28.03.2017
 */

$content = get_the_content();

get_header();

?>

    <div class="page-container">

        <!--  SIDEBAR  -->
        <?php // get_template_part('templates/content', 'sidebar') ?>

        <!--  Page content  -->
        <div class="panel container">

            <?php get_template_part('templates/content', 'page') ?>

        </div>
        <div style="clear: both"></div>

    </div>

<?php

get_footer();

?>
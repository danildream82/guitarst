<?php
/**
 * Created by PhpStorm.
 * User: Igor
 * Date: 17.07.2019
 * Time: 21:23
 */

get_header();

?>

    <div class="page-container">

        <!--  SIDEBAR  -->
        <?php // get_template_part('templates/content', 'sidebar') ?>

        <!--  Page content  -->
        <div class="panel container">

            <div class="panel-content top title">
                <h1>404</h1>
            </div>
            <div class="panel-content bottom page-content">
                <h2>Page not found</h2>
                <div style="text-align: center">
                    Page doesn't exist or was deleted
                </div>
            </div>

        </div>
        <div style="clear: both"></div>

    </div>

<?php

get_footer();

?>

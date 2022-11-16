<?php
/**
 * * Template Name: Register
 *
 * Created by PhpStorm.
 * User: Igor
 * Date: 11.04.2017
 * Time: 11:45
 */

get_header();

?>

    <div class="page-container">

        <!--  Page content  -->
        <div class="container" style="float: none">

            <?php get_template_part('templates/element', 'register-form') ?>

        </div>
        <div style="clear: both"></div>

    </div>

    </div> <!--  page-wrap  -->

    <script> var jsBaseUrl = '<?php echo get_template_directory_uri(); ?>/js/' </script>
    <script data-main="<?php echo get_template_directory_uri() ?>/js/main" src="<?php echo get_template_directory_uri() ?>/js/lib/require.js"></script>
    </body>
    </html>

<?php

//get_footer();

?>
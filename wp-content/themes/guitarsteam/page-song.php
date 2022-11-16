<?php
/*
 * Template Name: Song
 *
 * Created by Sublime Text 3.
 * User: Evgeniy
 */

get_header();
?>

    <div class="song page-container"  style="float: none">

    <?php
    if ( have_posts() )
    {
        the_post();
    ?>

        <!--  Page content  -->
        <?php get_template_part('templates/element', 'song-box') ?>
            
        <div class="comments panel container" style="float: none">
            
            <div class="comments-wrapper panel-content">
                <?php comments_template() ?>
            </div>

        </div>
        <div style="clear: both"></div>

    <?php } ?>

    </div>

    </div> <!--  page-wrap  -->
    
<script> var jsBaseUrl = '<?php echo get_template_directory_uri(); ?>/js/' </script>
<script data-main="<?php echo get_template_directory_uri() ?>/js/main" src="<?php echo get_template_directory_uri() ?>/js/lib/require.js"></script>

<!--</body>-->
<!--</html>-->

<?php

get_footer();

?>
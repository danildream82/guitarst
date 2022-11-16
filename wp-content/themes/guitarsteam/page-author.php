<?php
/*
 * Template Name: Author
 *
 * Created by Sublime Text 3.
 * User: Evgeniy
 */

get_header();
?>

    <div class="author page-container"  style="float: none">
        
        <!--  Page content  -->
        <div class="panel container" style="float: none">
            
            <div class="panel-content">
                <?php get_template_part('templates/element', 'author') ?>
            </div>

        </div>
		
		<div class="panel container" style="float: none">
            
            <div class="search-form-wrapper panel-content">
                <?php get_template_part('templates/element', 'song-search') ?>
            </div>

        </div>
		
        <div class="panel container" style="float: none">
            
            <div class="search-form-wrapper panel-content">
                <?php get_template_part('templates/element', 'search-form') ?>
            </div>

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
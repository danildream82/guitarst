<?php
/**
 * The Template for displaying all single products
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/single-product.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see 	    https://docs.woocommerce.com/document/template-structure/
 * @author 		WooThemes
 * @package 	WooCommerce/Templates
 * @version     1.6.4
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
					<?php comments_template( '../comments.php' ) ?>
				</div>

			</div>
			<div style="clear: both"></div>

		<?php } ?>

	</div>

	</div> <!--  page-wrap  -->

	<script> var jsBaseUrl = '<?php echo get_template_directory_uri(); ?>/js/' </script>
	<script data-main="<?php echo get_template_directory_uri() ?>/js/main" src="<?php echo get_template_directory_uri() ?>/js/lib/require.js"></script>

<?php
get_template_part('templates/element', 'player');

get_footer();

?>
<?php
/**
 * Single Product Image
 *
 * @author 		WooThemes
 * @package 	WooCommerce/Templates
 * @version     2.6.3
 */


if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

global $post, $woocommerce, $product, $virtue;

$columns           = apply_filters( 'woocommerce_product_thumbnails_columns', 4 );
$post_thumbnail_id = get_post_thumbnail_id( $post->ID );
$full_size_image   = wp_get_attachment_image_src( $post_thumbnail_id, 'full' );
$thumbnail_post    = get_post( $post_thumbnail_id );
$image_title       = $thumbnail_post->post_content;
$placeholder       = has_post_thumbnail() ? 'with-images' : 'without-images';
$wrapper_classes   = apply_filters( 'woocommerce_single_product_image_gallery_classes', array(
	'woocommerce-product-gallery',
	'woocommerce-product-gallery--' . $placeholder,
	'woocommerce-product-gallery--columns-' . absint( $columns ),
	'images',
	'kad-light-gallery',
) );

if(isset($virtue['product_simg_resize']) && $virtue['product_simg_resize'] == 0) {
	$presizeimage = 0;
} else {
	$presizeimage = 1;
	$productimgwidth = 458;
	$productimgheight = 458;
}

?>
<div class="<?php echo esc_attr( implode( ' ', array_map( 'sanitize_html_class', $wrapper_classes ) ) ); ?>" data-columns="<?php echo esc_attr( $columns ); ?>">
	<figure class="woocommerce-product-gallery__wrapper">
	<div class="product_image">

	<?php

		$attributes = array(
			'title'                   => $image_title,
			'data-large-image'        => $full_size_image[0],
			'data-large-image-width'  => $full_size_image[1],
			'data-large-image-height' => $full_size_image[2],
		);
		if ( has_post_thumbnail() ) {
			if($presizeimage == 1){
				$alt = esc_attr( get_post_meta(get_post_thumbnail_id(), '_wp_attachment_image_alt', true) );
				if( !empty($alt) ) {
					$alttag	= $alt;
				} else {
					$alttag	= $image_title;
				}
				$lite_box_title = esc_attr( get_the_title( get_post_thumbnail_id() ) );
				$image_url = aq_resize($full_size_image[0], $productimgwidth, $productimgheight, true);
				if(empty($image_url)) {$image_url = $product_image_url;} 
				// Get srcset
		        $img_srcset = kt_get_srcset( $productimgwidth, $productimgheight, $full_size_image[0], $post_thumbnail_id);
		        if(!empty($img_srcset) ) {
		        	$img_srcset_output = 'srcset="'.esc_attr($img_srcset).'" sizes="(max-width: '.esc_attr($productimgwidth).'px) 100vw, '.esc_attr($productimgwidth).'px"';
		        } else {
		        	$img_srcset_output = '';
		        }
		        $html  = '<figure data-thumb="' . get_the_post_thumbnail_url( $post->ID, 'shop_thumbnail' ) . '" class="woocommerce-product-gallery__image"><a href="' . esc_url( $full_size_image[0] ) . '" title="'.esc_attr($lite_box_title).'">';
				$html .= '<img width="'.$productimgwidth.'" height="'.$productimgheight.'" src="'.$image_url.'" class="attachment-shop_single wp-post-image" '.$img_srcset_output.' title="'.$image_title.'" alt="'.$alttag.'">';
				$html .= '</a></figure>';
			} else {
				$html  = '<figure data-thumb="' . get_the_post_thumbnail_url( $post->ID, 'shop_thumbnail' ) . '" class="woocommerce-product-gallery__image"><a href="' . esc_url( $full_size_image[0] ) . '">';
				$html .= get_the_post_thumbnail( $post->ID, 'shop_single', $attributes );
				$html .= '</a></figure>';
			}
		} else {
			$html  = '<figure class="woocommerce-product-gallery__image--placeholder">';
			$html .= sprintf( '<img src="%s" alt="%s" class="wp-post-image" />', esc_url( wc_placeholder_img_src() ), esc_html__( 'Awaiting product image', 'virtue' ) );
			$html .= '</figure>';
		}

		echo apply_filters( 'woocommerce_single_product_image_thumbnail_html', $html, get_post_thumbnail_id( $post->ID ) );
	?>
	</div>
	<?php do_action( 'woocommerce_product_thumbnails' ); ?>		
	</figure>
</div>


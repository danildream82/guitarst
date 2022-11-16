<?php
/**
 * Single Product Thumbnails
 *
 * @author 		WooThemes
 * @package 	WooCommerce/Templates
 * @version     2.7.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

global $post, $product;

if ( version_compare( WC_VERSION, '2.7', '>' ) ) {
	$attachment_ids = $product->get_gallery_image_ids();
} else {
	$attachment_ids = $product->get_gallery_attachment_ids();
}

if ( $attachment_ids ) {
	?>
	<div class="product_thumbnails thumbnails">

	<?php

		foreach ( $attachment_ids as $attachment_id ) {
				$full_size_image  = wp_get_attachment_image_src( $attachment_id, 'full' );
			$thumbnail        = wp_get_attachment_image_src( $attachment_id, 'shop_thumbnail' );
			$thumbnail_post   = get_post( $attachment_id );
			$image_title      = $thumbnail_post->post_content;
			$lite_box_title   = esc_attr( get_the_title( $attachment_id ) );
			$attributes = array(
				'title'                   => $image_title,
				'data-large-image'        => $full_size_image[0],
				'data-large-image-width'  => $full_size_image[1],
				'data-large-image-height' => $full_size_image[2],
			);

			$html  = '<figure data-thumb="' . esc_url( $thumbnail[0] ) . '" class="woocommerce-product-gallery__image"><a href="' . esc_url( $full_size_image[0] ) . '" data-rel="lightbox[product-gallery]" title="'.esc_attr($lite_box_title).'">';
			$html .= wp_get_attachment_image( $attachment_id, 'shop_thumbnail', false, $attributes );
	 		$html .= '</a></figure>';

			echo apply_filters( 'woocommerce_single_product_image_thumbnail_html', $html, $attachment_id );
		}

	?></div>
	<?php
}
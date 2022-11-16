<?php
/**
 * Created by PhpStorm.
 * User: Igor
 * Date: 06.06.2019
 * Time: 14:53
 */

// Модификация страницы My Account
add_filter ( 'woocommerce_account_menu_items', 'gsMyAccountMenuItems' );

function gsMyAccountMenuItems( $menu_links )
{
    unset( $menu_links['dashboard'] );
    unset( $menu_links['orders'] );
    unset( $menu_links['downloads'] );
    unset( $menu_links['edit-address'] );

    return $menu_links;
}

?>
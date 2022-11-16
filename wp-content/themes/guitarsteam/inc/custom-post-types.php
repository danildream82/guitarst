<?php
/**
 * Created by Igor
 * Date: 16.08.2018
 * Time: 14:12
 */

define( 'DID_YOU_KNOW_POST_TYPE', 'did-you-know' );
define( 'DID_YOU_KNOW_TAXONOMY', 'did-you-know-cat' );
define( 'DID_YOU_KNOW_DEFAULT_TEXT', 'Guitarsteam is the best place to play and learn guitar music' );

/*******************************************************************************************************/
// DID YOU KNOW?
/*******************************************************************************************************/
register_post_type( DID_YOU_KNOW_POST_TYPE, array('public' => true,
    'supports' => array('title', 'editor'),
    'labels' => array('name' => 'Did You Know?',
        'singular_name' => 'Did You Know?',
        'edit_item' => 'Edit Tip',
        'view_item' => 'View Tip',
        'all_items' => 'All Tips',
        'add_new' => 'Add New Tip',
        'add_new_item' => 'Adding New Tip'),
    'publicly_queryable' => true,
    'menu_position' => 5,
    'description' => 'Интересные факты на гитарную тематику'
));

$labels = array();

$args = array(
    'label' => 'Tip Categories' // определяется параметром $labels->name
    , 'labels' => $labels
    , 'public' => false
    , 'show_in_nav_menus' => true // добавить на страницу создания меню
    , 'show_ui' => true    // добавить интерфейс создания и редактирования
    , 'show_tagcloud' => false // нужно ли разрешить облако тегов для этой таксономии
    , 'hierarchical' => false
    , 'update_count_callback' => ''
    , 'rewrite' => true
    , 'query_var' => true
    , 'capabilities' => array()
    , '_builtin' => false
);

register_taxonomy( DID_YOU_KNOW_TAXONOMY, DID_YOU_KNOW_POST_TYPE, $args );

/*******************************************************************************************************/

?>
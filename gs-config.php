<?php
/**
 * Created by PhpStorm.
 * User: Igor
 * Date: 12.06.2019
 * Time: 15:29
 */

//define( 'ENVIRONMENT', 'LIVE' );
define( 'ENVIRONMENT', 'TEST' );

// стиль адресов папок в зависимости от мимтемы
define( 'CONFIG_OS_FAMILY', 'WIN' ); // или LINUX

if ( defined( 'APSPATH' ) == false )
{
    define( 'ABSPATH', '/' );
}

define( 'CONFIG_TABS_DIR', ABSPATH . 'tabs' );                     // директория с табами
define( 'CONFIG_JAVA_URL', 'localhost:8080/gt-parser/Parser' );    // урл вызова парсера табов (в tabs.php)

define( 'MAX_POPULARITY', 3 );
define( 'MAX_COMPLEXITY', 3 );

// Title & Description
define( 'META_TITLE_FRONTPAGE', 'GuitarSteam - Isometric Guitar Tabs | 3D Player Online | Fingerstyle Tabs' );
define( 'META_DESCRIPTION_FRONTPAGE', 'Isometric Guitar Tabs played within 3D Visual Player, allowing users to learn and play them on real guitar easily' );

define( 'META_TITLE_PRODUCT', ' | Guitar Tabs 3D Online | Isometric 3D Tabs' );
define( 'META_DESCRIPTION_SONG', 'Fingerstyle 3D guitar tabs played online in browser. Isometric tabs, hand-picked arrangement' );

define( 'META_TITLE_DEFAULT', ' | GuitarSteam' );

?>
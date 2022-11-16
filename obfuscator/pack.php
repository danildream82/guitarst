<?php
/**
 * Created by Igor
 * Date: 13.12.2018
 * Time: 16:53
 */

define( 'OUTPUT', '../wp-content/themes/guitarsteam/js/player/player.js' );

// player_3d           : 'player/gplayer',
// player_midi_func    : 'player/midi-func',
// player_sound        : 'player/sound-system',
// player_core         : 'player/midi-player',
// player_utils        : 'player/utils',
// player_gui          : 'player/player-gui',
// player_dispatch     : 'player/player-dispatch'

$output = '';

$output = 'var PlayerDispatch = null;(function (){';

$output .= file_get_contents( '../wp-content/themes/guitarsteam/js/player/gplayer.js' ) . "\n";
$output .= file_get_contents( '../wp-content/themes/guitarsteam/js/player/midi-func.js' ) . "\n";
$output .= file_get_contents( '../wp-content/themes/guitarsteam/js/player/sound-system.js' ) . "\n";
$output .= file_get_contents( '../wp-content/themes/guitarsteam/js/player/midi-player.js' ) . "\n";
$output .= file_get_contents( '../wp-content/themes/guitarsteam/js/player/utils.js' ) . "\n";
$output .= file_get_contents( '../wp-content/themes/guitarsteam/js/player/player-gui.js' ) . "\n";
$dispatch = file_get_contents( '../wp-content/themes/guitarsteam/js/player/player-dispatch.js' );

$dispatch = str_replace(
    'var PlayerDispatch = new PlayerDispatcher();',
    'PlayerDispatch = new PlayerDispatcher();',
    $dispatch
);

$output .= $dispatch;
$output .= '})();';

$output = RemoveLogs( $output );

file_put_contents( OUTPUT, $output );

echo 'Done';

//*******************************************************************************************
function RemoveLogs( $file )
{
    do
    {
        $pos1 = strpos( $file, 'console.log' );

        if ( $pos1 === false )
            break;

        $pos2 = strpos( $file, ';', $pos1 );

        $part1 = substr( $file, 0, $pos1 );
        $part2 = substr( $file, $pos2 + 1, strlen( $file ) - $pos2 );

        $file = $part1 . $part2;
    } while( true );

    return $file;
}

?>
<?php
/**
 * Created by Igor
 * Date: 04.02.2019
 * Time: 17:03
 */

function gsTabsTest()
{
    ini_set('error_reporting', E_ALL);
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);

    include_once __DIR__ . "/../songscp.php";

    if ( current_user_can('administrator') == false )
    {
        echo 'Please, login';
        return;
    }

  $convertedSong = SongsCP::convertSongServlet( 'C:\JavaProjects\gp-parser\web\WEB-INF\bugfix\empty-measure-2.gp5', 3, TRUE );
//  $convertedSong = SongsCP::convertSongServlet( 'C:\JavaProjects\gp-parser\web\WEB-INF\bugfix\Albert_Gyorfi_The_Witcher_-_Believe.gp5', 3, TRUE );
//  $convertedSong = SongsCP::convertSongServlet( 'C:\JavaProjects\gp-parser\web\WEB-INF\bugfix\lambada_kaoma.gp5', 3, TRUE );

    if ( $convertedSong )
    {
        $converter = new TabsConverter();
        $tabsContent = $converter->ConvertTabs( $convertedSong );

        if ( $tabsContent)
        {
            echo $tabsContent;
            die;
        }
        else
        {
            echo '<div class="alert alert-danger">ERROR: file can not be converted</div>';
        }
    }
    else
    {
        echo ('Convertion Error: ' . SongsCP::getErrors());
    }
}
//#####################################################################################

add_shortcode( 'tabs-test', 'gsTabsTest' );
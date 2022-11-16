<?php

require_once(ABSPATH . 'wp-admin/includes/image.php');
require_once(ABSPATH . 'wp-admin/includes/media.php');
require_once(ABSPATH . 'wp-admin/includes/file.php');

include_once "tabs.php";

class SongsCP {
    
    const DEFAULT_SONG_FILES_DIR = CONFIG_TABS_DIR;
    const CONVERTER_URL = CONFIG_JAVA_URL;
    const CONVERTED_PREFIX = '.json';

    private static $errors = [];

    /******************************************************************************************************************/
    public static function getSongContentByPostId ( $postId )
    {
        $songInfo = self::getSongInfo( $postId );
        $songContent = '';

        if ( !empty( $songInfo ) )
        {            
            $filePath = $songInfo['full_path'] . self::CONVERTED_PREFIX;
            if ( file_exists( $filePath ) )
            {
                $songContent = file_get_contents( $filePath );
            }    
            else 
            {
                self::$errors[] = 'file ' . $filePath . ' not exists';
            }    
        } 

        return $songContent;
    }
    /******************************************************************************************************************/
    public static function getSongInfo( $postId ) 
    {
        global $wpdb;

        $songInfo = [];

        $strSql = " SELECT * FROM gp_files ";
        $strSql.= " WHERE post_id = %d ";
        $data = [$postId];

        $sql = $wpdb->prepare( $strSql, $data );

        $result = $wpdb->get_row( $sql , ARRAY_A );

        if ( !empty( $result ) ) 
        {
            $songInfo = $result;
        } 
        else 
        {
            self::$errors[] = 'Failed to retrieve song tabs. Please, try again. If the problem persists, please, contact us.';
        }

        return $songInfo;
    }
    /******************************************************************************************************************/
    public static function uploadSong( $fileData )
    {
        global $wpdb;

        $result = false;

        $uploadTime = date('Y-m-d H:i:s');

        $file_name = str_replace( ' ', '_', $fileData['name'] );

        $songPath = self::buildSongDir( $uploadTime, $fileData['post_id']) . '/' . $file_name;

        $wpdb->insert('gp_files',
            [
                'user_id'    => $fileData['user_id'],
                'post_id'    => (int)$fileData['post_id'],
                'file_name'  => $file_name,
                'full_path'  => $songPath,
                'song_name'  => $fileData['song_name'],
                'uploadedAt' => $uploadTime
            ],
            ['%d', '%d', '%s', '%s', '%s', '%s']
        );

        $lastId = $wpdb->insert_id;         

        if (!$lastId) 
        {
            self::$errors[] = "insertion of new song to DB failed";
        } 
        elseif( !move_uploaded_file( $fileData['tmp_name'], $songPath ) ) 
        {
            self::$errors[] = "song upload system error";
        }
        else
        {
            $result = true;      
        }    

        return $result;
    }
    /******************************************************************************************************************/
    // возвращает директорию песни
    private static function buildSongDir ( $time, $postId )
    {
        $firstLevelDir = date( 'Y-m', strtotime( $time ) );

        $uploadDir = self::DEFAULT_SONG_FILES_DIR . '/' .  $firstLevelDir . '/' . $postId;

        if ( ! is_dir( $uploadDir ) ) 
        {    
            @mkdir( $uploadDir, 0777, true );            
        }

        return $uploadDir;
    }

    /******************************************** работа c WP структурой поста *********************************************************/

    // добавление поста для wp, который соответствует загружаемой песне
    public static function addSongProduct( $params ) 
    {
        $post = [
            'post_author'  => $params['user_id'],
            'post_content' => $params['song_description'],
            'post_status'  => "pending",
            'post_title'   => $params['song_name'],
            'post_parent'  => '',
            'post_type'    => "product",
        ];

        $postId = wp_insert_post( $post, true );

        // пробуем получить ошибку
        if ( is_wp_error( $postId ) )
        { 
            self::$errors = array_merge( self::$errors, $postId->get_error_messages() );
            $postId = 0;;
        } 
        else
        {
            wp_set_object_terms( $postId, $params['song_category'], 'product_cat' );

            update_post_meta( $postId, 'song_complexity', $params['song_complexity'] );
            update_post_meta( $postId, 'song_popularity', $params['song_popularity'] );
            update_post_meta( $postId, 'song_original_artist', $params['song_original_artist'] );
        }

        return $postId;
    }
    /******************************************************************************************************************/
    // добавление картинки для поста WP - картинка песни
    public static function loadProductImage( $fileArray, $postId, $imgDesc )
    {
        $imageId = media_handle_sideload( $fileArray, $postId, $imgDesc );
  
        if ( is_wp_error( $imageId ) ) {

            // убираем временный файл - мусор
            @unlink( $fileArray['tmp_name'] );

            // пробуем получить системную ошибку медиа
            self::$errors[] = $imageId->get_error_message( $imageId->get_error_code() );

            $imageId = 0;

        }  else {

            // добавляем тумбу для основной картинки песни
            set_post_thumbnail( $postId, $imageId );
        }

        return $imageId;
    }

    /******************************************** валидаторы *************************************************************************/

    // валидатор таб файла
    public static function validateSongFile( $file = [] )
    {
        $validated = true;

        if ( empty( $file['song_file'] ) ) 
        {
            self::$errors[] = 'song file name is empty';
            $validated = false;
        }

        if ( empty( $file['song_file']['type'] ) || $file['song_file']['type'] != 'application/octet-stream' ) 
        {
            self::$errors[] = 'format incorrect or empty';
            $validated = false;
        }

        if ( empty( $file['song_file']['tmp_name'] ) || !file_exists( $file['song_file']['tmp_name'] ) ) 
        {
            self::$errors[] = 'GP5 File does not exist';
            $validated = false;
        }
        
        return $validated;
    }
    /******************************************************************************************************************/
    // валидатор картинки песни
    public static function validateImageFile( $file = [] ) 
    {
        $validated = true;

        if ( empty( $file['song_image'] ) ) 
        {
            self::$errors[] = 'image file name is empty';
            $validated = false;
        }

        if ( empty( $file['song_image']['name'] ) ) 
        {
            self::$errors[] = 'name incorrect or empty';
            $validated = false;
        }
        
        return $validated;
    }

    /************************************** вспомагательные функции ************************************************************************/

    // возвращает ошибки в виде строки
    public static function getErrors ()
    {
        return implode( ', ' , self::$errors );
    }

    /************************************** конвертационные функи ***************************************************************************/

    public static function uploadConvertedSong( $songPath, $content, $prefix = self::CONVERTED_PREFIX ) 
    {
        $uploadResult = true; 

        if ( !file_put_contents( $songPath . $prefix, $content ) ) 
        {
            self::$errors[] = 'converted file was not uploaded';
            $uploadResult = false; 
        }    

        return $uploadResult;
    }
    /******************************************************************************************************************/
    public static function convertSongTabs( $content )
    {
        $converter = new TabsConverter();
        $tabsContent = $converter->ConvertTabs( $content );

        if ( empty($tabsContent) ) {
            self::$errors[] = ' Tabs converter failure';
        }

        return $tabsContent;
    }
    /******************************************************************************************************************/
    public static function convertSongServlet( $path, $timeout=2, $errorReport=FALSE )
    {
        $convertResult = '';

        $curl = curl_init();
        curl_setopt($curl, CURLOPT_URL, self::CONVERTER_URL . '?song=' . $path );
        curl_setopt($curl, CURLOPT_HEADER, FALSE);
        curl_setopt($curl, CURLOPT_TIMEOUT, $timeout);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);

        $content = curl_exec($curl);
        $err = curl_errno($curl);
        $inf = curl_getinfo($curl);
        curl_close($curl);

        if (!empty($err))
        {
            self::$errors[] = ' curl/convert error ' . print_r($err, 1);
        }
        else
        {
            $convertResult = $content;
        }

        return $convertResult;
    }
    /******************************************************************************************************************/
    public static function convertAllSongs()
    {
        global $wpdb;

        $songInfo = [];

        $strSql = " SELECT * FROM gp_files ";

        $sql = $wpdb->prepare( $strSql, [] );

        $counter = 0;
        $error   = 0;

        $result = $wpdb->get_results( $sql , ARRAY_A );

        foreach ($result as $key => $value)
        {
            $path = $value['full_path'];

            if (!file_exists($path))
            {
                echo $path . "\n";
                continue;
            }

            echo $counter . ' ' . $path . ' ' ."\n";
            $convertedSong = self::convertSongServlet( $path, 3, TRUE );

            if (empty($convertedSong)) {
                echo 'Convertation Error: ' . self::getErrors() . ' ' . $path . "\n";
                continue;
            }

            $convertedSongByTabs = self::convertSongTabs( $path, $convertedSong);
            if (empty($convertedSongByTabs)) {
                echo 'Convertation Tabs Error: ' . self::getErrors() . ' ' . $path . "\n";
                continue;
            }

            // local converted song upload error
            rename($path . self::CONVERTED_PREFIX, $path . self::CONVERTED_PREFIX . '.old.v2');
            $convertedUploadResult = self::uploadConvertedSong( $path, $convertedSongByTabs);
            if (empty($convertedUploadResult)) {
                echo 'Local Convert Upload error: ' . self::getErrors() . "\n";
                continue;
            }
            sleep(1);
            $counter++;
        }

        return [ "counter" => $counter, "error" => $error];
    }
    /******************************************************************************************************************/
}

?>

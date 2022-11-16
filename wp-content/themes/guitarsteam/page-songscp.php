<?php
/*
 * Template Name: Songs CP
 *
 * Created by Eugene
 * Date: 20.10.2017
 */
error_reporting(E_ALL);
include_once "inc/songscp.php";

$alert_text = '';
$alert_class = '';
$request = [];

if ( current_user_can('administrator') == false )
{
    header( 'Location: ' . get_site_url(), true, 307 );
    die;
}

//if ( isset( $_REQUEST['action'] ) && $_REQUEST['action'] == 'downloadSong' && !empty( $_REQUEST['postId'] ) )
//{
//    header('Content-Description: File Transfer');
//    header('Content-Type: text/csv');
//    header('Content-Disposition: attachment; filename=' . $_REQUEST['postId']);
//    ob_clean();
//    flush();
//    echo SongsCP::getSongContentByPostId( $_REQUEST['postId'] );
//    exit;
//}

if ( isset( $_REQUEST['action'] ) && $_REQUEST['action'] == 'uploadSong' && !empty( $_FILES ) ) 
{
      try
      {
        $request = $_REQUEST;
        $songParams = $_FILES['song_file'];

        $validateSongFile = SongsCP::validateSongFile( $_FILES );
        if ( !$validateSongFile ) {
            throw new \Exception('Song GP5 File validation error: ' . SongsCP::getErrors());
        }

        $songParams['song_name'] = $request['song_name'];
        $songParams['song_description'] = $request['song_description'];
        $songParams['song_complexity'] = $request['song_complexity'];
        $songParams['song_popularity'] = $request['song_popularity'];
        $songParams['song_category'] = $request['song_category'];
        $songParams['song_original_artist'] = $request['song_original_artist'];
        $songParams['user_id'] = get_current_user_id();

        $convertedSong = SongsCP::convertSongServlet( $songParams['tmp_name'], 3, TRUE );
        if (empty($convertedSong)) {
            throw new \Exception('Convertation Error: ' . SongsCP::getErrors());
        }

        $convertedSongByTabs = SongsCP::convertSongTabs( $convertedSong );
        if ( empty($convertedSongByTabs) || strpos( $convertedSongByTabs, 'tracks' ) === false )
        {
            throw new \Exception('Convertation Tabs Error: ' . SongsCP::getErrors());
        }

        $songParams['post_id'] = SongsCP::addSongProduct( $songParams );
        if (empty($songParams['post_id'])) {
            throw new \Exception('Post was not created');
        }

        // check whether product image is required
        $imageUploaded = SongsCP::validateImageFile($_FILES);

        if ( $imageUploaded )
        {
            $imageUploadResult = SongsCP::loadProductImage( $_FILES['song_image'], $songParams['post_id'], 'product image' );

            if (empty($imageUploadResult))
            {
                throw new \Exception('Image Upload error: ' . SongsCP::getErrors());
            }
        }

        // local song upload error
        $songUploadResult = SongsCP::uploadSong( $songParams );
        if (empty($songUploadResult)) {
            throw new \Exception('Song Upload error: ' . SongsCP::getErrors());
        }

        $songInfo = SongsCP::getSongInfo( $songParams['post_id'] );

        // local converted song upload error
        $convertedUploadResult = SongsCP::uploadConvertedSong( $songInfo['full_path'], $convertedSongByTabs );
        if (empty($convertedUploadResult)) {
            throw new \Exception('Local Convert Upload error: ' . SongsCP::getErrors());
        }

        $alert_text = 'Uploaded and Converted';
        $alert_class = 'success';
    }
    catch(Exception $e)
    {
        $alert_text = $e->getMessage();
        $alert_class = 'danger';
    }
}

$songsCategory = get_terms( 'product_cat', ['hide_empty' => false]);

    // pre define fields
    if (empty($request['song_name']))
    {
        $request['song_name'] = '';
    }
    if (empty($request['song_description']))
    {
        $request['song_description'] = '';
    }
    if (empty($request['song_original_artist']))
    {
        $request['song_original_artist'] = '';
    }
    if (empty($request['song_complexity']))
    {
        $request['song_complexity'] = '';
    }
    if (empty($request['song_popularity']))
    {
        $request['song_popularity'] = '';
    }

get_header();
?>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>

<div class="page-container">
    <div class="panel container">
        <div class="panel-content top title">
            <h1>Upload Song</h1>
        </div>

        <div class="panel-content bottom">

             <!-- Start: Errors Block //-->
            <?= gsTemplates::Alert( $alert_class, $alert_text ) ?>
            <!-- Finish: Errors Block //-->

            <form method="post" enctype="multipart/form-data">
                <input type="hidden" name="action" value="uploadSong">
                <p>
                    <div>Tab file</div>
                    <input type="file" name="song_file">
                </p>
                <p>
                    <div>Song Name</div>
                    <input class="button white_wood edged flat" type="text" name="song_name" value="<?=$request['song_name']?>">
                </p>
                <p>
                    <div>Original Artist</div>
                    <input class="button white_wood edged flat" type="text" name="song_original_artist" value="<?=$request['song_original_artist']?>">
                </p>
                <p>
                    <div>Complexity</div>
                    <div class="fake-select">
                        <select class="button wooden edged" name="song_complexity">
                            <option value="3" <?php if ($request['song_complexity'] == '3') echo 'selected';?>>Hard</option>
                            <option value="2" <?php if ($request['song_complexity'] == '2') echo 'selected';?>>Medium</option>
                            <option value="1" <?php if ($request['song_complexity'] == '1') echo 'selected';?>>Easy</option>
                        </select>
                    </div>
                </p>
                <p>
                    <div>Popularity</div>
                    <div class="fake-select">
                        <select class="button wooden edged" name="song_popularity">
                            <option value="1" <?php if ($request['song_popularity'] == '1') echo 'selected';?>>*</option>
                            <option value="2" <?php if ($request['song_popularity'] == '2') echo 'selected';?>>**</option>
                            <option value="3" <?php if ($request['song_popularity'] == '3' || $request['song_popularity'] == false ) echo 'selected';?>>***</option>
                        </select>
                    </div>
                </p>
                <p>
                    <div>Genre</div>
                    <div class="fake-select">
                        <select class="button wooden edged" name="song_category" placeholder="Genre">
                            <?php
                            foreach( $songsCategory as $key => $value )
                            {
                                $selected = $request['song_name'] == $value->name ? 'selected' : '';
                            ?>
                                <option value="<?= $value->name; ?>" <?= $selected ?>>
                                    <?= $value->name ?>
                                </option>
                            <?php
                            }
                            ?>
                        </select>
                    </div>
                </p>
                <p>
                    <div>Product Image</div>
                    <input type="file" name="song_image" multiple>
                </p>
                <p>
                    <div>Description</div>
                    <textarea class="button white_wood edged flat" name="song_description"><?=$request['song_description']?></textarea>
                </p>
                <p>
                    <input class="button edged wooden" type="submit" name="Submit" value="Submit">
                </p>
            </form>
        </div>
    </div>
    <div style="clear: both"></div>
</div>

<?php

get_footer();

return;

?>

<!-- Список загруженных песен с возможностьб скачивания (не используется)-->
<div style="padding-left:300px;padding-bottom:300px;">
    <?php
    $params = ['posts_per_page' => 50, 'post_type' => 'product'];
    $wc_query = new WP_Query($params);
    ?>
    <ul>
        <?php if ($wc_query->have_posts()) : ?>
            <?php while ($wc_query->have_posts()) :
                $wc_query->the_post(); ?>
                <li style="padding:10px;">
                    <?php if ( has_post_thumbnail()) { ?>
                        <a href="<?php the_permalink(); ?>" title="<?php the_title_attribute(); ?>" >
                            <?php the_post_thumbnail([32, 32]); ?>
                        </a>
                    <?php } ?>
                    <a href="<?php the_permalink(); ?>">
                        <?php the_title(); ?>
                    </a>
                    <?php  get_the_date(); ?>
                    <?php  the_time(); ?>
                    <span style="font-weight:bold;cursor:pointer;" class="actDownload" data-id="<?=get_the_ID();?>">DOWNLOAD</span>
                </li>
            <?php endwhile; ?>
            <?php wp_reset_postdata(); ?>
        <?php else:  ?>
            <li>
                <?php _e( 'No Products' ); ?>
            </li>
        <?php endif; ?>
    </ul>
</div>

<script>
    $('.actDownload').click(function(e){
        e.preventDefault();
        var options = {
            type: "GET",
            data: {postId : this.dataset.id, action : 'downloadSong'},
            success: function(data){alert(data);}
        };
        $.ajax(options);
    });
</script>
<!--******************************************************************************************************-->
<?php
/**
 * Created by Igor
 * Date: 29.03.2017
 */

    if ( have_posts() )
    {
        the_post();

        // Page thumbnail
        $img_id = get_post_thumbnail_id( $post_id );
        $thumb = wp_get_attachment_image_src( $img_id );
    ?>

        <div class="panel-content top title">
            <h1><?php the_title() ?></h1>
        </div>
        <div class="panel-content bottom page-content">
            <?php if ( $thumb ) { ?>
                <img class="page-thumb" src="<?= $thumb[0] ?>">
            <?php } ?>
            <?php the_content() ?>
        </div>

    <?php
    }
    else
    {
    ?>

        <div class="panel-content top title">
            <h1>Page is empty</h1>
        </div>
        <div class="panel-content bottom page-content">
            No content found
        </div>

<?php
    }
?>
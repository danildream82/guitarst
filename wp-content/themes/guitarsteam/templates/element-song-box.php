<?php

global $post;
$song = new gsSong( $post->ID );

$price = $song->GetPrice();

$popularity = $song->GetPopularity();
$complexity = $song->GetComplexity();

$song_name = $song->GetName();
$orgn_artist = $song->GetOrgnArtist();

$categories = $song->GetSongCategories( $post->ID );
$thumb_url = get_the_post_thumbnail_url( $post, 'full' );
$small_thumb_url = get_the_post_thumbnail_url( $post, 'gs-song-thumb' );

$try_free_text = 'TRY MORE';
$more_songs_text = 'GET MORE SONGS';

$share_tags = '#guitartabs #fingerstyle #guitarlesson';
$share_text = $song_name . ' - ' . $orgn_artist . ' | 3D Tabs Online ' . "\n" . gsUtils::GetCurrentPageUrl( false ) . "\n\n" . $share_tags . "\n\n@guitarsteam";

// Get more songs
$params = [
    'post_type' => 'product',
    'posts_per_page' => 4,
    'post_status' => 'publish',

    'post__not_in' => [ $song->id ],

    'tax_query' => [[                   // песни одного жанра
        'taxonomy' => 'product_cat',
        'field' => 'id',
        'terms' => [ $categories[0]->term_id ],
        'compare' => 'IN'
    ]],

    'meta_key' => 'song_popularity',
    'meta_value' => $popularity,
    'orderby' => 'rand'
];

$query = new WP_Query( $params );

$try_more = $query->posts;
?>

<div class="panel container" style="float: none">
        <div class="panel-content top title song-title">
            <h1><?= $song_name ?> - <?= $orgn_artist ?></h1>
        </div>
		<section class="song-content panel-content bottom">
            <div class="song-main-panel">
                <div class="song-cover" style="background: url(<?= $thumb_url ?>) no-repeat; background-size: cover;" title="<?= get_the_title() ?> - Thumbnail Image">
                </div>
                <div class="song-options--block">
                    <div class="song-options">
                        <div class="song-option popularity">
                            <span>Popularity</span>
                            <div>
                                <?= gsTemplates::SongStars( $popularity, MAX_POPULARITY ) ?>
                            </div>
                        </div>
                        <div class="song-option complexity">
                            <span>Complexity</span>
                            <div>
                                <?= gsTemplates::SongStars( $complexity, MAX_COMPLEXITY ) ?>
                            </div>
                        </div >
                        <div class="play song-option price"
                             data-song_id="<?= $post->ID ?>"
                             data-price="<?= $price ?>"
                             data-name="<?= $song_name ?>"
                             data-thumb="<?= $small_thumb_url ?>"
                             data-original_artist="<?= $orgn_artist ?>"
                             data-player_name=""
                             data-user_image=""
                             data-genre=""
                             data-complexity=""
                             data-popularity=""
                        >
                            <?php
                            if ( $price > 0 )
                            {?>
                                <div class="price" href="#">
                                    <span class="currency">$</span>
                                    <span class="amount">5</span>
                                    <div class="arrow">
                                        <img alt="Pay & Launch Player" src="http://guitarsteam.test/wp-content/themes/guitarsteam/img/icon/play.png">
                                    </div>
                                </div>
                            <?php
                            }
                            else
                            { ?>
                                <a class="play_btn" href="#">
                                    <img alt="Launch Player" src="<?php echo get_template_directory_uri() ?>/img/icon/play.png">
                                </a>
                            <?php } ?>
                        </div>
                    </div>
                    <div class="share">
                        <?php echo gsTemplates::ShareBox( $share_text, $share_tags ) ?>
                    </div>
                </div>
            </div>

            <div class="song-option price mobile-price">
                <?php
                if ( $price > 0 )
                {?>
                    <div class="price" href="#">
                        <span class="currency">$</span>
                        <span class="amount">5</span>
                        <div class="arrow">
                            <img alt="Pay & Launch Tabs Player" src="http://guitarsteam.test/wp-content/themes/guitarsteam/img/icon/play.png">
                        </div>
                    </div>
                    <?php
                }
                else
                { ?>
                    <a class="play_btn" href="#">
                        <img alt="Launch Tabs Player" src="<?php echo get_template_directory_uri() ?>/img/icon/play.png">
                    </a>
                <?php } ?>
            </div>

            <div class="share-mobile">
                <?php echo gsTemplates::ShareBox( $share_text, $share_tags ) ?>
            </div>

            <div class="share-desktop">
                <?php echo gsTemplates::ShareBox( $share_text, $share_tags, false ) ?>
            </div>

            <div class="song-info">
                <div class="song-info--column">
                    <div class="song-column-data">
                        <p>Song Title: <a rel="nofollow" href="#" onclick="javascript:return false"><?= $song_name ?></a></p>
                        <p>Song artist:&#9 <a href="#" rel="nofollow" onclick="javascript:return false;"><?= $orgn_artist ?></a></p>
                    </div>
                </div>
                <div class="song-info--column">
                    <div class="song-column-data">
                        <p>Genres: </p>
                        <p class="song-tags">
                            <?php
                            foreach( $categories as $cat )
                            {
                                echo '<a href="#" class="btn-genre">' . $cat->name . '</a>';
                            }
                            ?>
                        </p>
                    </div>
                </div>
            </div>

            <a href="#" class="try-free--button">>> <?= $try_free_text ?></a>
            <div class="try-free" style="display: none">
                <img class="player-screen" src="<?php echo get_template_directory_uri(); ?>/img/player/screenshot-mini.jpg" alt="3D Player Screenshot">
                <ul class="free-songs">
                    <?php
                    foreach( $try_more as $song_post )
                    {
                        $artist = $song->GetOrgnArtist( $song_post->ID );
                        echo '<li><a href="' . get_post_permalink( $song_post->ID ) . '">' . $song_post->post_title . ' - ' . $artist . '</a></li>';
                    }
                    ?>
                </ul>
                <div class="more-free--button">
                    <a href="<?= get_site_url() ?>" class="more-free button edged">
                        <?= $more_songs_text ?>
                    </a>
                </div>

                <div class="more-free--button_mobile">
                    <a href="<?= get_site_url() ?>" class="more-free-mobile button edged">
                        <?= $more_songs_text ?>
                    </a>
                </div>
            </div>

            <div class="close-btn panel-content bottom solid">
            </div>

        </section>


<!--        <div class="button-tabs">-->
<!--            <a href="#" class="button-tab">-->
<!--                <span class="icon doc"></span>-->
<!--                <span class="tab-instructions">Instructions</span>-->
<!--            </a>-->
<!--            <a href="#" class="button-tab active-tab">-->
<!--                <span class="icon chat"></span>-->
<!--                <span class="tab-feedback">Feedback</span>-->
<!--            </a>-->
<!--        </div>-->
<!--  End  -->

</div>
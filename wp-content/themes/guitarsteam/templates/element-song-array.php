<?php
/**
 * Created by PhpStorm.
 * User: Igor
 * Date: 31.03.2017
 * Time: 17:33
 */

global $song;

if ( isset($song) == false )
{
    $song = [
        'id' => 0,
        'name' => '',
        'original_artist' => '',
        'thumb' => get_template_directory_uri() . '/img/song-thumb.jpg',
        'player_name' => '',
        'genre' => [],
        'complexity' => 0,
        'popularity' => 0,
        'price' => 0,
        'url' => ''
    ];
}

$song_pending = !empty( $song['pending'] ) ? 'pending-song' :'';

?>
    <!-- song_box -->
    <div class="song-array-element">
        <div class="panel">
            <div class="panel-content no-padding row <?= $song_pending ?>">

    <!--            Compact Song-->

                <section class="song-array-panel compact desktop">
                    <div class="cover compact" style="background: url(<?= $song['thumb'] ?>) center center / cover no-repeat;">
                        <img alt="Song cover image" src="<?= $song['thumb'] ?>" style="display: none">
                        <a href="<?= $song['url'] ?>" target="_blank"></a>
                    </div>
                    <div class="attributes compact">
                        <div class="title compact">
                            <a href="" class="favorites" title="Add to favorites"></a>
                            <a href="<?= $song['url'] ?>" target="_blank"><h2><?= $song['name'] ?> - <?= $song['original_artist'] ?></h2></a>
                            <div class="song-tags">
                                <?php
                                if ( $song['genre'] )
                                {
                                    foreach( $song['genre'] as $genre )
                                    { ?>
                                        <a href="#" class="btn-genre"><?= $genre ?></a>
                                        <?php
                                    }
                                }
                                else
                                { ?>
                                    <a href="#" class="btn-genre tmpl hidden"></a>
                                <?php
                                }
                                ?>
                            </div>
                        </div>

                        <div class="demo">
                            <a href="" class="demo-icon" title="Song demo"></a>
                        </div>

                        <div class="popularity compact">
                            <span>Popularity</span>
                            <div style="white-space: nowrap; text-align: center;">
                                <?php
                                echo gsTemplates::SongStars( $song['popularity'], MAX_POPULARITY );
                                ?>
                            </div>
                        </div>
                        <div class="complexity compact">
                            <span>Complexity</span>
                            <div style="white-space: nowrap; text-align: center;">
                                <?php
                                echo gsTemplates::SongStars( $song['complexity'], MAX_COMPLEXITY );
                                ?>
                            </div>
                        </div>
                    </div>
                    <div class="play desktop price-block compact"
                         data-song_id="<?= $song['id'] ?>"
                         data-price="<?= $song['price'] ?>"
                         data-name="<?= $song['name'] ?>"
                         data-thumb="<?= $song['thumb'] ?>"
                         data-original_artist="<?= $song['original_artist'] ?>"
                         data-genre='{<?php echo json_encode( $song['genre'] ) ?>}'
                         data-complexity="<?= $song['complexity'] ?>"
                         data-popularity="<?= $song['popularity'] ?>"
                         data-url="<?= $song['url'] ?>"
                    >
                        <?php
                        if ( $song['price'] > 0 )
                        { ?>
                            <div class="price compact" href="#">
                                <span class="currency">$</span>
                                <span class="amount">Y</span>
                                <div class="arrow">
                                    <img alt="Pay & Launch Player" src="<?php echo get_template_directory_uri() ?>/img/icon/play.png">
                                </div>
                            </div>
                        <?php
                        }
                        else
                        { ?>
                            <a class="play_btn" href="#">
                                <img alt="Launch Player" src="<?php echo get_template_directory_uri() ?>/img/icon/play.png" width="50">
                            </a>
                        <?php
                        }
                        ?>
                    </div>
                </section>

                <section class="song-array-panel compact laptop">
                    <div class="cover compact" style="background: url(<?= $song['thumb'] ?>) center center / cover no-repeat;">
                        <img alt="Song cover image" src="<?= $song['thumb'] ?>" style="display: none">
                        <a href="<?= $song['url'] ?>" target="_blank"></a>
                    </div>
                    <div class="attributes compact">
                        <div class="title compact">
                            <a href="" class="favorites" title="Add to favorites"></a>
                            <a href="<?= $song['url'] ?>" target="_blank"><h2><?= $song['name'] ?> - <?= $song['original_artist'] ?></h2></a>
                            <div class="song-tags">
                            <?php
                                if ( $song['genre'] )
                                {
                                    foreach( $song['genre'] as $genre )
                                    { ?>
                                        <a href="#" class="btn-genre"><?= $genre ?></a>
                                        <?php
                                    }
                                }
                                else
                                { ?>
                                    <a href="#" class="btn-genre tmpl hidden"></a>
                                    <?php
                                }
                            ?>
                            </div>
                        </div>
                    </div>
                    <div class="attributes compact">

                        <div class="popularity compact">
                            <span>Popularity</span>
                            <div style="white-space: nowrap; text-align: center;">
                                <?php
                                echo gsTemplates::SongStars( $song['popularity'], MAX_POPULARITY );
                                ?>
                            </div>
                        </div>
                        <div class="complexity compact">
                            <span>Complexity</span>
                            <div style="white-space: nowrap; text-align: center;">
                                <?php
                                echo gsTemplates::SongStars( $song['complexity'], MAX_COMPLEXITY );
                                ?>
                            </div>
                        </div>
                    </div>
                    <div class="play laptop price-block compact"
                         data-song_id="<?= $song['id'] ?>"
                         data-price="<?= $song['price'] ?>"
                         data-name="<?= $song['name'] ?>"
                         data-thumb="<?= $song['thumb'] ?>"
                         data-original_artist="<?= $song['original_artist'] ?>"
                         data-genre='{<?php echo json_encode( $song['genre'] ) ?>}'
                         data-complexity="<?= $song['complexity'] ?>"
                         data-popularity="<?= $song['popularity'] ?>"
                         data-url="<?= $song['url'] ?>>
                        <?php
                        if ( $song['price'] > 0 )
                        { ?>
                            <div class="price compact" href="#">
                                <span class="currency">$</span>
                                <span class="amount">Y</span>
                                <div class="arrow">
                                    <img alt="Pay & Launch Player" src="<?php echo get_template_directory_uri() ?>/img/icon/play.png">
                                </div>
                            </div>
                            <?php
                        }
                        else
                        { ?>
                            <a class="play_btn" href="#">
                                <img alt="Launch Player" src="<?php echo get_template_directory_uri() ?>/img/icon/play.png" width="50">
                            </a>
                            <?php
                        }
                        ?>
                    </div>
                </section>

                <section class="song-array-panel compact mobile">
                    <div class="cover" style="background: url(<?= $song['thumb'] ?>) center center / cover no-repeat;">
                        <img alt="Song cover image" src="<?= $song['thumb'] ?>" style="display: none">
                        <a href="<?= $song['url'] ?>" target="_blank"></a>
                    </div>
                    <div class="attributes mobile">
                        <div class="attributes-row">
                            <div class="title mobile">
                                <a href="<?= $song['url'] ?>" target="_blank"><h2><?= $song['name'] ?> - <?= $song['original_artist'] ?></h2></a>
                            </div>

                        </div>
                        <div class="attributes-row">
<!--                            <div class="player-user mobile">-->
<!--                                <a href="#" class="userpic-small">-->
<!--                                    <img class="user-image" src="http://guitarsteam.test/wp-content/uploads/2017/03/userpic-3.gif">-->
<!--                                </a>-->
<!--                                <a class="player-name" href="#">Name of Guitarist</a>-->
<!--                            </div>-->
                            <div class="song-tags mobile">
                                <?php
                                if ( $song['genre'] )
                                {
                                    foreach( $song['genre'] as $genre )
                                    { ?>
                                        <a href="#" class="btn-genre"><?= $genre ?></a>
                                    <?php
                                    }
                                }
                                else
                                { ?>
                                    <a href="#" class="btn-genre tmpl hidden"></a>
                                <?php
                                }
                                ?>
                            </div>
                        </div>
                    </div>


                    <div class="attributes mobile">
                        <div class="attributes-row">

                            <div class="complexity mobile">
                                <span>Complexity</span>
                                <div style="white-space: nowrap; text-align: center;">
                                    <?php
                                    echo gsTemplates::SongStars( $song['popularity'], MAX_POPULARITY );
                                    ?>
                                </div>
                            </div>
                        </div>
                        <div class="attributes-row">

                            <div class="popularity mobile">
                                <span>Popularity</span>
                                <div style="white-space: nowrap; text-align: center;">
                                    <?php
                                    echo gsTemplates::SongStars( $song['complexity'], MAX_COMPLEXITY );
                                    ?>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="play price-block mobile compact"
                         data-song_id="<?= $song['id'] ?>"
                         data-price="<?= $song['price'] ?>"
                         data-name="<?= $song['name'] ?>"
                         data-thumb="<?= $song['thumb'] ?>"
                         data-original_artist="<?= $song['original_artist'] ?>"
                         data-genre='{<?php echo json_encode( $song['genre'] ) ?>}'
                         data-complexity="<?= $song['complexity'] ?>"
                         data-popularity="<?= $song['popularity'] ?>"
                         data-url="<?= $song['url'] ?>>

                        <?php
                        if ( $song['price'] > 0 )
                        { ?>
                            <div class="price compact" href="#">
                                <span class="currency">$</span>
                                <span class="amount">Y</span>
                                <div class="arrow">
                                    <img alt="Pay & Launch Player" src="<?php echo get_template_directory_uri() ?>/img/icon/play.png">
                                </div>
                            </div>
                            <?php
                        }
                        else
                        { ?>
                            <a class="play_btn" href="#">
                                <img alt="Launch Player" src="<?php echo get_template_directory_uri() ?>/img/icon/play.png" width="50">
                            </a>
                            <?php
                        }
                        ?>
                    </div>
                </section>


            </div>
        </div>
    </div>

<?php ?>

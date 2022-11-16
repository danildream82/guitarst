<?php
/**
 * Created by Igor
 * Date: 06.06.2018
 * Time: 14:37
 */
?>

<link rel="stylesheet" href="<?= get_template_directory_uri() ?>/css/player.css" media="all" />

<div id="player_container" class="player_container" style="display: none;">

    <canvas id="canvas" tabindex="1">
    </canvas>

    <div class="load_screen player_controls">

        <div class="content top">
            <img class="logo" src="<?= get_template_directory_uri() ?>/img/logo-white-big.png"/>
        </div>
        <div class="panel tempo_volume">
            <div class="button close">
                <div class="button-icon"></div>
            </div>
        </div>
        <div class="content center">

<!--        <div class="alert danger" >-->
<!--            <span class="text">Hello</span>-->
<!--            <span class="button btn-close">Close</span>-->
<!--            <span class="button btn-retry">Retry</span>-->
<!--        </div>-->

            <!--  Round Spinner  -->
<!--            <div class="round_spinner">-->
<!--                <div class="spinner_body"></div>-->
<!--            </div>-->

            <div class="loading-text">
                <div>LOADING</div>
                <div>please wait ...</div>
            </div>


            <div class="progress">
                <div id="load-progress">
                    <div class="progress-label">Loading...</div>
                </div>
            </div>
        </div>
        <div class="content bottom">
            <div class="didyouknow-title">
                <div>DID YOU</div>
                <div>KNOW</div>
            </div>
            <div class="didyouknow-text">
                <span>The look of modern guitar was established by Spanish guitarist Antonio Torres Jurado.</span>
            </div>
        </div>
    </div>

    <div class="alert-wrapper" style="display: none">
        <div class="alert error danger" style="">
            <span>No songs found<br>Please, refine your search parameters and try again</span>
            <div style="clear: both;"></div>
            <div class="alert-buttons">
                <a href="#" class="button retry">Try Again</a>
                <a href="#" class="button return">Return to the site</a>
            </div>
        </div>
    </div>

    <div class="player_controls">

        <div class="panel top song_data">
            <a href="">
                <img class="song_thumb" src=""/>
            </a>
            <div class="description">
                <a href="" class="song_name">Song Name</a>
                <a href="" class="song_artist">Artist Name</a>
            </div>
        </div>

        <div class="panel left" style="display: none">
            <div class="button menu">
            </div>
        </div>

        <div class="panel rewind">

            <div>
                <div class="button rewind_backward">
                    <div class="button-icon"></div>
                </div>
                <div class="button rewind_forward">
                    <div class="button-icon"></div>
                </div>
            </div>
            <div>
                <div class="button playback">
                    <div class="button-icon"></div>
                </div>
            </div>
            <!--<div class="button play">-->
            <!--</div>-->

        </div>
        <div class="panel loop visible_in_pause">
            <div>

                <div>
                    <div class="button loop_bounds start">
                        <div class="button-icon"></div>
                    </div>
                    <div class="button loop_bounds end">
                        <div class="button-icon"></div>
                    </div>
                </div>

                <div class="button repeat">
                    <div class="button-icon"></div>
                </div>
            </div>
        </div>

        <div class="panel tempo_volume">
            <div class="button close">
                <div class="button-icon"></div>
            </div>
            <div class="meter_placeholder">
                <div class="button meter visible_in_pause">
                    <img src="<?= get_template_directory_uri() ?>/img/player/icon-meter.png">
                </div>
            </div>
            <div id="slider-tempo" class="slider">
                <div class="button-icon"></div>
            </div>
            <div id="slider-volume" class="slider">
            </div>
        </div>

        <div class="panel progress">

            <div id="slider-range"></div>
            <div id="slider-progress"></div>

            <div style="clear: both"></div>
        </div>
    </div>
</div>

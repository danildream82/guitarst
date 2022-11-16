<?php
/**
 * Created by PhpStorm.
 * User: Igor
 * Date: 30.04.2019
 * Time: 16:25
 */

function gsPlayerManual()
{
?>

<div class="player-manual">
    <img src="<?= get_template_directory_uri() ?>/img/player/manual/manual.jpg" style="width: 100%">
    <br/>
    <br/>
    <h2>Legend</h2>

    <br/>
    <br/>
    <div class="legend">
        <img src="<?= get_template_directory_uri() ?>/img/player/manual/simple-note-1.jpg">
        <img src="<?= get_template_directory_uri() ?>/img/player/manual/simple-note-2.jpg">
    </div>
    <h3>Plain, Simple, Single Note</h3>

    <br/>
    <br/>
    <div class="legend">
        <img src="<?= get_template_directory_uri() ?>/img/player/manual/open-string.jpg">
    </div>
    <h3>Open String</h3>

    <br/>
    <br/>
    <div class="legend">
        <img src="<?= get_template_directory_uri() ?>/img/player/manual/hammer-pull.jpg">
    </div>
    <h3>Hammer On / Pull Off</h3>

    <br/>
    <br/>
    <div class="legend">
        <img src="<?= get_template_directory_uri() ?>/img/player/manual/pull-to-open.jpg">
    </div>
    <h3>Pull Off to Open String</h3>

    <br/>
    <br/>
    <div class="legend">
        <img class="slide" src="<?= get_template_directory_uri() ?>/img/player/manual/slide.jpg">
    </div>
    <h3>Slide</h3>

    <br/>
    <br/>
    <div class="legend">
        <img src="<?= get_template_directory_uri() ?>/img/player/manual/palm-mute.jpg">
    </div>
    <h3>Palm Mute</h3>

    <br/>
    <br/>
    <div class="legend">
        <img src="<?= get_template_directory_uri() ?>/img/player/manual/mute-open-string.jpg">
    </div>
    <h3>Palm Mute Open String</h3>

    <br/>
    <br/>
    <div class="legend">
        <img src="<?= get_template_directory_uri() ?>/img/player/manual/flageolet.jpg">
    </div>
    <h3>Flageolet (Harmonic)</h3>

    <br/>
    <br/>
    <div class="legend">
        <img src="<?= get_template_directory_uri() ?>/img/player/manual/percussion.jpg">
    </div>
    <h3>String Percussion</h3>

    <br/>
    <br/>

</div>

<?php
}
//##############################################################################################

add_shortcode( 'player-manual', 'gsPlayerManual' );
?>
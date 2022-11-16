<?php
/**
 * Created by PhpStorm.
 * User: Igor
 * Date: 20.04.2017
 * Time: 12:12
 */

class gsTemplates
{
    public function __construct()
    {
    }
    /*******************************************************************************************************/
    public static function UserPanel( $logged_in = false )
    {
        if ( $logged_in )
        {
            $user = wp_get_current_user();
        ?>
                <div class="dashboard">
                    <a class="userpic" href="#">
                        <?= get_avatar( $user->ID, 48) ?>
                    </a>
                    <div class="user_info">
                        <a class="username" href="<?= get_site_url() ?>/my-account"><?php echo $user->display_name; ?></a>
                        </br>
                        <a class="logout" href="<?php echo wp_logout_url( '/' ); ?>">Log Out</a>
                    </div>
                </div>
                <div class="btn_play">
                    <img src="<?php echo get_template_directory_uri(); ?>/img/icon/play.png" title="Current Song"/>
                </div>
        <?php }
        else
        { ?>

            <div class="login_reg row">
                <div class="col-xs-6">
                    <a data-src="#window_login" href="javascript:;" data-fancybox="login-reg" class="fancybox-trigger">Login</a>
                </div>
                <div class="col-xs-6">
                    <a data-src="#window_register" href="javascript:;" data-fancybox="login-reg" class="fancybox-trigger">Register</a><br>
                </div>
            </div>
            <!--<a id="window-login-trigger" class="auth_form fancybox-trigger" href="#login_form" data-fancybox-group="login-reg">hidden trigger</a>-->

        <?php }
    }
    /*******************************************************************************************************/
    public static function Alert( $class, $message )
    {
        if ( $message )
        { ?>
            <div class="alert <?php echo $class; ?>">
                <div class="close" aria-label="close" title="close">×</div>
                <span><?php echo $message ?></span>
                <div style="clear: both;"></div>
            </div>
        <?php
        }
    }
    /*******************************************************************************************************/
    public static function SocialIcons( $class = '' )
    { ?>

        <div class="social-box <?php echo $class ?>">
            <span>Follow Us:</span>
            <div class="social-icons">
                <a href="https://www.facebook.com/guitarsteam" target="_blank" rel="nofollow" class="facebook social button edged round"></a>
                <a href="https://twitter.com/GuitarSteam" target="_blank" rel="nofollow" class="twitter social button edged round"></a>
                <a href="https://vk.com/guitarsteam_official" target="_blank" rel="nofollow" class="vkontakte social button edged round"></a>
            </div>
            <div style="clear: both"></div>
        </div>

    <?php }
    /*******************************************************************************************************/
    public static function ShareBox( $share_text, $compact = true )
    {
        if ( $compact )
        { ?>
            <div class="share-title">
                <span class="share-text">Share</span>
            </div>
            <div class="share-icons">
                <a href="https://www.facebook.com/sharer/sharer.php?u=<?= gsUtils::GetCurrentPageUrl( false ) ?>&description=<?= $share_text ?>" class="button edged share-icon fb" target="_blank"></a>
                <a href="https://twitter.com/intent/tweet?text=<?= urlencode( $share_text ) ?>" class="button edged share-icon tw" target="_blank"></a>
            </div>
        <?php
        }
        else
        { ?>
            <div class="share-icons">
                <div class="share-col">
                    <div class="share-col--title">Share on Facebook</div>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=<?= gsUtils::GetCurrentPageUrl( false ) ?>&description=<?= $share_text ?>" class="button edged share-icon fb" target="_blank"></a>
                </div>
                <div class="share-col">
                    <div class="share-col--title">Tweet It</div>
                    <a href="https://twitter.com/intent/tweet?text=<?= urlencode( $share_text ) ?>" class="button edged share-icon tw" target="_blank"></a>
                </div>
            </div>
        <?php
        }
    }
    /*******************************************************************************************************/
    public static function SongStars( $level, $max_level )
    {
        $output = '';

        for( $i = 1; $i <= $max_level; $i++ )
        {
            if ( $i <= $level )
                $output .= '<div class="star"></div>';
            else
                $output .= '<div class="star empty"></div>';
        }

        return $output;
    }
    /*******************************************************************************************************/
    public static function TitleAndDescription()
    {
        global $post;
        $title = '';
        $description = '';

        $sdfsdf = 123;

        // если это песня
        if ( $post->post_type == 'product' )
        {
            $song = new gsSong( $post->ID );
            $title = $song->GetName() . ' - ' . $song->GetOrgnArtist() . META_TITLE_PRODUCT;

            $description = META_DESCRIPTION_SONG;
            $description = str_replace( '%song%', $song->GetName(), $description );
            $description = str_replace( '%artist%', $song->GetOrgnArtist(), $description );
        }
        else
        // если это главная страница
        if ( $post->post_name == 'frontpage' )
        {
            $title = META_TITLE_FRONTPAGE;
            $description = META_DESCRIPTION_FRONTPAGE;
        }
        else
        // по умолчанию
        {
            $title = get_field( 'meta_title' );
            $title = $title ? $title : $post->post_title . META_TITLE_DEFAULT;

            $description = get_field( 'meta_description' );
        }

        echo '<title>' . $title . '</title>' . "\n";

        if ( $description )
            echo '<meta name="description" content="' . $description . '" />';
    }
    /*******************************************************************************************************/

    /*******************************************************************************************************/
};
<?php
/**
 * Created by PhpStorm.
 * User: Igor
 * Date: 08.04.2017
 * Time: 15:04
 *
 * WARNING!!!
 * The form is Wordpress compatible and it's key values shouldn't be changed
 */

{
    $alert_class = 'warning';
    $alert_text = 'An error aqcuired';

    // Obtain the error if any
    $error = (isset($_GET['login_error']) ) ? $_GET['login_error'] : '';
    $username = (isset($_GET['username']) ) ? urldecode( $_GET['username'] ) : '';

    if ( $error )
    {
        switch( $error )
        {
            case LOGIN_ERROR_EMPTY_EMAIL:
                $alert_text = 'Please, enter username or email';
                break;
            case LOGIN_ERROR_EMPTY_PSWD:
                $alert_text = 'Please, enter password';
                break;
            case LOGIN_ERROR_INVALID:
                $alert_text = 'Username or password is invalid.</br> If you don\'t have account yet, please, <a href="' . home_url( '/register/' ) . '">register here</a>';
                break;
        }

        gsTemplates::Alert( $alert_class, $alert_text );
    } ?>

    <div id="window_login"  class="form_container">
        <form name="loginform" id="login_form" class="auth_form" action="<?php echo get_site_url(); ?>/wp-login.php" method="post">
            <div class="panel">
                <div class="panel-content top title solid">
                    <h1>Login</h1>
                </div>
                <div class="panel-content bottom">

                    <p>
                        <input name="log" id="user_login" value="<?php echo $username ?>" size="18" placeholder="username or email" class="input button edged flat" type="text">
                    </p>
                    <p>
                        <label for="user_pass"></label>
                        <input name="pwd" id="user_pass" value="" size="18" class="input button edged flat" placeholder="password" type="password">
                    </p>

                    <p class="login-remember">
                        <input name="rememberme" id="rememberme" value="forever" type="checkbox">
                        <label for="rememberme">
                            <span class="button edged flat"></span>
                            Remember Me
                        </label>
                    </p>
                    <p class="login-submit">
                        <label for="wp-submit" id="login_btn" class="button wooden edged">
                            Log In
                        </label>
                        <input name="wp-submit" id="wp-submit" class="hidden button-primary" value="Log In" type="submit">
                        <input name="redirect_to" value="<?php echo get_site_url(); ?>/shop" type="hidden">
                    </p>
                    <p class="links">
                        <?php
                        $kjfgkdjf = get_permalink();

                        $rgrkgdfg = wp_lostpassword_url( get_permalink() );
                        ?>
                        <a href="<?php echo wp_lostpassword_url( get_permalink() ); ?>" title="Lost Password">Lost Password</a>
                        <a href="<?php echo wp_registration_url(); ?>" class="register_link" title="Register"><b>Register</b></a>
                    </p>
                    <div style="clear: both"></div>
                </div>
            </div>
        </form>
    </div>

<?php } ?>

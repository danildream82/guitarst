<?php
/**
 * Created by PhpStorm.
 * User: Igor
 * Date: 11.04.2017
 * Time: 11:49
 */
?>

    <div id="window_register" class="form_container">
        <form name="registerform" id="register_form" class="auth_form" action="<?php echo get_site_url(); ?>/wp-register.php" method="post">
            <div class="panel">
                <div class="panel-content top title solid">
                    <h1>Register</h1>
                </div>
                <div class="panel-content bottom">

                    <p>
                        <input name="username" id="username" value="<?php echo $username ?>" size="18" placeholder="username" class="input button edged flat" type="text">
                    </p>
                    <p>
                        <input name="email" id="user_email" value="<?php echo $username ?>" size="18" placeholder="email" class="input button edged flat" type="text">
                    </p>
                    <p>
                        <label for="user_pass"></label>
                        <input name="pwd" id="user_pass" value="" size="18" class="input button edged flat" placeholder="password" type="password">
                    </p>
                    <p>
                        <label for="user_pass_repeat"></label>
                        <input name="pwd_r" id="user_pass_repeat" value="" size="18" class="input button edged flat" placeholder="repeat password" type="password">
                    </p>

                    <p class="reg-agreement">
                        <input name="agreement" id="agreement" value="I agree to the terms of service" type="checkbox">
                        <label for="agreement">
                            <span class="button edged flat"></span>I agree to the <a href="<?= get_site_url() ?>/terms-of-service">terms of service</a><i class="required">*</i> </label>
                    </p>
                    <p>
                        <label for="wp-submit" id="register_btn" class="button wooden edged">
                            Register
                        </label>
                        <input name="wp-submit" id="wp-submit" class="hidden button-primary" value="Register" type="submit">
                    </p>
                    <p class="links">
                        <a href="<?php echo wp_lostpassword_url( get_permalink() ); ?>" title="Lost Password">Lost Password</a>
                        <a href="<?php echo wp_login_url(); ?>" class="login_link" title="Login"><b>Login</b></a>
                    </p>
                    <div style="clear: both"></div>
                </div>
            </div>
        </form>
    </div>

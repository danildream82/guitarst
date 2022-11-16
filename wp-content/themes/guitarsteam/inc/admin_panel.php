<?php
add_action('admin_menu', 'add_global_custom_options');
function add_global_custom_options()
{
    add_options_page('Theme Options',
                     'Theme Options',
                     'manage_options',
                     'functions',
                     'Theme_Options');
}
/**************************************************************/
function Theme_Options()
{
?>
    <div class="wrap">
        <h1>Theme Options</h1>
        
        <form method="post" action="options.php">
            <?php wp_nonce_field('update-options') ?>
            
            <h2>YNRM Links</h2>
            <p><strong>Sign In Link:</strong><br />
                <input type="text" name="link-sign-in" size="50" value="<?php echo get_option('link-sign-in'); ?>" />
            </p>
            <p><strong>Sign Up Link:</strong><br />
                <input type="text" name="link-sign-up" size="50" value="<?php echo get_option('link-sign-up'); ?>" />
            </p>
            <p><strong>List Your Space Link:</strong><br />
                <input type="text" name="link-list-your-space" size="50" value="<?php echo get_option('link-list-your-space'); ?>" />
            </p>
            
            <h2>Social Links</h2>
            <p><strong>Facebook Link:</strong><br />
                <input type="text" name="link-facebook" size="50" value="<?php echo get_option('link-facebook'); ?>" />
            </p>
            <p><strong>Twitter Link:</strong><br />
                <input type="text" name="link-twitter" size="50" value="<?php echo get_option('link-twitter'); ?>" />
            </p>
            <p><strong>Pinterest Link:</strong><br />
                <input type="text" name="link-pinterest" size="50" value="<?php echo get_option('link-pinterest'); ?>" />
            </p>
            <p><strong>Instagram Link:</strong><br />
                <input type="text" name="link-instagram" size="50" value="<?php echo get_option('link-instagram'); ?>" />
            </p>
            <br/>
            
            <h2>Twitter options</h2>
            <p><strong>Consumer Key:</strong><br />
                <input type="text" name="twitter-consumer-key" size="50" value="<?php echo get_option('twitter-consumer-key'); ?>" />
            </p>
            <p><strong>Consumer Secret Key:</strong><br />
                <input type="text" name="twitter-consumer-secret-key" size="50" value="<?php echo get_option('twitter-consumer-secret-key'); ?>" />
            </p>
            <p><strong>OAUTH Token:</strong><br />
                <input type="text" name="twitter-oauth-token" size="50" value="<?php echo get_option('twitter-oauth-token'); ?>" />
            </p>
            <p><strong>OAUTH Secret Token:</strong><br />
                <input type="text" name="twitter-oauth-secret-token" size="50" value="<?php echo get_option('twitter-oauth-secret-token'); ?>" />
            </p>
            <p><strong>Twitter hashtags (used when user shares posts on Twitter):</strong><br />
                <input type="text" name="twitter-hashtags" size="50" value="<?php echo get_option('twitter-hashtags'); ?>" />
            </p>
            <br/>
            
            <h2>Other</h2>
            <p><strong>Google Analytics Code:</strong><br />
                <input type="text" name="google-analytics" size="50" value="<?php echo get_option('google-analytics'); ?>" />
            </p>
            
            <p><input type="submit" name="Submit" value="Save Changes" class="button button-primary" /></p>
            <input type="hidden" name="action" value="update" />
            <input type="hidden" name="page_options" value="link-sign-in,
                                                            link-sign-up,
                                                            link-list-your-space,
                                                            link-facebook,
                                                            link-twitter,
                                                            link-pinterest,
                                                            link-instagram,
                                                            twitter-consumer-key,
                                                            twitter-consumer-secret-key,
                                                            twitter-oauth-token,
                                                            twitter-oauth-secret-token,
                                                            twitter-hashtags,
                                                            google-analytics" />
        </form>
    </div>
<?php
}
?>
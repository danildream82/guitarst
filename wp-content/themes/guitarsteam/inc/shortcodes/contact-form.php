<?php
/**
 * Created by Igor
 * Date: 16.06.2017
 * Time: 17:03
 */

function gsContactForm()
{
?>
    <div class="row">
        <div class="contact-form col-xs-12 col-sm-10 col-md-7 col-lg-7" novalidate="novalidate">
            <p class="required">
                <input id="name" name="user_name" value="" placeholder="Your Name" class="button edged flat required" aria-required="true" aria-invalid="false" type="text">
            </p>
            <p class="required">
                <input name="user_email" value="" placeholder="Your Email" class="button edged flat" aria-required="true" aria-invalid="false" type="email">
            </p>
            <p class="required">
                <input name="subject" value="" placeholder="Subject" class="button edged flat" aria-invalid="false" type="text">
            </p>
            <p class="required">
                <textarea name="message" rows="10" placeholder="Your Message" class="input button edged flat" aria-invalid="false"></textarea>
            </p>
        </div>

        <div class="contact-form col-xs-12 col-sm-10 col-md-7 col-lg-7" novalidate="novalidate">
            <div class="alert result" style="display: none"></div>
            <div class="contact-form-submit submit-btn button wooden edged">
                Send
            </div>
            <div style="clear: both"></div>
            <p></p>
            <p></p>
        </div>
    </div>

<?php
}
//##############################################################################################

add_shortcode( 'contact-form', 'gsContactForm' );
?>
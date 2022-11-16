<?php
/**
 * Created by TriLineSoft
 * Date: 27.04.2017
 * Time: 13:44
 */
?>

<!--Payment Form Checkout-->

<div id="payment_window" class="form_container" xmlns="http://www.w3.org/1999/html" xmlns="http://www.w3.org/1999/html">
    <div class="panel">
        <div class="pay-title">
            <h1>Check Out</h1>
        </div>
        <div class="payment_form panel-content bottom">
            <div class="row payment_form">

                <!-- Song List -->

                <ul class="song-list shopping_cart col-xs-12">
<!--                    <li>
                        <div class="close-icon">

                        </div>
                        <div class="song-cover">
                            <img class="edged" src="<?php echo get_template_directory_uri(); ?>/img/song-cover-gm.jpg" width="75" height="75" alt="Careless Whisper - George Michael">
                        </div>
                        <div class="song-name">
                            <a href="#">Careless Whisper Careless Whisper</a><br>
                            <a style="font-size: smaller;" href="#">George Michael George Michael</a>
                        </div>
                        <div class="song-price">3$</div>
                    </li>
                    <li>
                        <div class="song-name-mobile">
                            <a href="#">Careless Whisper Careless Whisper</a><br>
                            <a style="font-size: smaller;" href="#">George Michael George Michael</a>
                        </div>
                    </li>
                    <li>
                        <div class="close-icon">
                        </div>
                        <div class="song-cover">
                            <img class="edged" src="<?php echo get_template_directory_uri(); ?>/img/song-cover-gm.jpg" width="75" height="75" alt="Careless Whisper - George Michael">
                        </div>
                        <div class="song-name">
                            <a href="#">Careless Whisper Careless Whisper</a><br>
                            <a style="font-size: smaller;" href="#">George Michael George Michael</a>
                        </div>
                        <div class="song-price">3$</div>
                    </li>
                    <li>
                        <div class="song-name-mobile">
                            <a href="#">Careless Whisper Careless Whisper</a><br>
                            <a style="font-size: smaller;" href="#">George Michael George Michael</a>
                        </div>
                    </li>
                    <li>
                        <div class="close-icon">

                        </div>
                        <div class="song-cover">
                            <img class="edged" src="<?php echo get_template_directory_uri(); ?>/img/song-cover-gm.jpg" width="75" height="75" alt="Careless Whisper - George Michael">
                        </div>
                        <div class="song-name">
                            <a href="#">Careless Whisper Careless Whisper</a><br>
                            <a style="font-size: smaller;" href="#">George Michael George Michael</a>
                        </div>
                        <div class="song-price">3$</div>
                    </li>
                    <li>
                        <div class="song-name-mobile">
                            <a href="#">Careless Whisper Careless Whisper</a><br>
                            <a style="font-size: smaller;" href="#">George Michael George Michael</a>
                        </div>
                    </li>
                    -->
                    <li id="cart_song_blank" class="song hidden">

                        <div class="close-icon remove">

                        </div>
                        <div class="song-cover">
                            <img class="edged" src="<?php echo get_template_directory_uri(); ?>/img/song-cover-gm.jpg" width="75" height="75" alt="Careless Whisper - George Michael">
                        </div>
                        <div class="song-name">
                            <a class="name" href="#"></a><br>
                            <span class="player_name" style="font-size: smaller;"></span>
                        </div>
                        <div class="song-price">$<span class="price"></span></div>
                    </li>
                    <li id="cart_song_blank_mobile">
                        <div class="song-name-mobile">
                            <a class="name" href="#">asfasfasf</a><br>
                            <span class="player_name" style="font-size: smaller;">afsasfasf</span>
                        </div>
                    </li>
                </ul>
                <div class="total-block">
                    <span class="total-text">Total:</span>
                    <span class="total-price">9$</span>
                </div>
                <div class="pay-method">
                    <img src="<?php echo get_template_directory_uri(); ?>/img/visa-mastercard.png" alt="">
<!--                    <div class="visa-mastercard">-->
<!--                        <button class="button btn pressed"><img src="--><?php //echo get_template_directory_uri(); ?><!--/img/visa-mastercard.png" alt=""></button>-->
<!--                    </div>-->
<!--                    <span>OR</span>-->
<!--                    <div class="paypal">-->
<!--                        <button class="button btn"><img src="--><?php //echo get_template_directory_uri(); ?><!--/img/paypal.png" alt=""></button>-->
<!--                    </div>-->
                </div>
                <div class="col-xs-12">
                    <label class="card-number" for="card_number">Credit Card Number</label>
                    <p id="card_number" class="input button white_wood edged flat text_center" style="width: 100%">

>>>>>>> dev
                    </p>
                </div>
            </div>

            <div class="row">
                <div class="col-xs-12">
                    <div id="payment_submit" class="button wooden edged pay-btn">Pay</div>
                </div>

                <input type="hidden" name="order_id" value="<?php echo $order_id; ?>">
            </div>
            <div class="row">
                <div class="col-xs-12">
                    <a class="purchase-later--btn" href="#">Purchase later & close</a>
                </div>
            </div>
        </div>
    </div>
</div>

<?php
?>

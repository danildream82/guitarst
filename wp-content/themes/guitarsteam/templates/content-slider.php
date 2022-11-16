<?php
/**
 * Created by Igor
 * Date: 13.08.2018
 * Time: 14:05
 */
?>

<!-- Slider main container -->
<div class="swiper-show_button show-slider">
    <label class="link" for="slider-hider" id="clickme">
        <span><div class="swiper-show-button_arrow"></div>PROMO</span>
        <div class="swiper-show-button_arrow"></div>
    </label>
</div>

<input type="checkbox" id="slider-hider">

<div class="swiper-container panel">
    <div class="swiper-show_button hide-slider">
        <label class="link" for="slider-hider" id="clickme">
            <div class="swiper-hide-button_arrow"></div>
        </label>
    </div>
    <!-- Additional required wrapper -->
    <div class="swiper-wrapper panel-content">
        <!-- Slides -->
        <div class="swiper-slide slide1">
            <div class="slide-bg slide1-bg"></div>
            <!--                    <div class="fade_element_lt"></div>-->
            <!--                    <div class="fade_element_rt"></div>-->
            <!--                    <div class="fade_element_top"></div>-->
            <!--                    <div class="fade_element_lb"></div>-->
            <!--            <div class="fade_element_rb"></div>-->
            <div class="display-flex">
                <div class="left-slider-panel"></div>
                <div class="center-slider-panel">
                    <div class="main-slider-text">
                        <div class="first-slider-text">
                            <div>train your skills</div>
                            <div>at our platform</div>
                        </div>
                        <div class="text-line"></div>
                        <div class="second-slider-text">
                            <div>Enjoy Your</div>
                            <div>Favorite Songs</div>
                        </div>
                    </div>

                    <div class="main-slider-button">
                        <a href="#search-form" class="slider-button-arrow"></a>
                    </div>
                    <div class="gc-recommend"><a href="https://www.google.com/intl/ru_ALL/chrome/" target="_blank" rel="nofollow noopener">Google Chrome</a> is recommended</div>
                </div>
                <div class="right-slider-panel">
                    <div class="main-slide-image">
                        <div class="first-row">
                            <div class="first-image">
                                <img src="<?= get_template_directory_uri() ?>/img/slider/slider-image1.jpg" alt="">
                            </div>
                            <div class="second-image">
                                <img src="<?= get_template_directory_uri() ?>/img/slider/slider-image2.jpg" alt="">
                            </div>
                        </div>
                        <div class="second-row">
                            <div class="third-image">
                                <img src="<?= get_template_directory_uri() ?>/img/slider/slider-image3.jpg" alt="">
                            </div>
                            <div class="fourth-image">
                                <img src="<?= get_template_directory_uri() ?>/img/slider/slider-image4.jpg" alt="">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
        <div class="swiper-slide slide2">
            <div class="slide-bg slide2-bg"></div>
            <div class="display-flex">
                <div class="right-slider-panel">
                    <div class="main-slide-image">
                        <img src="<?= get_template_directory_uri() ?>/img/slider/slide2_picture.jpg" alt="">
                    </div>
                </div>
                <div class="center-slider-panel">
                    <div class="main-slider-text">
                        <div class="first-slider-text">
                            <div>What You See</div>
                            <div>is What You Play</div>
                        </div>
                        <div class="text-line"></div>
                        <div class="second-slider-text">
                            <div>Just that simple</div>
                            <div>with our Visual</div>
                            <div>Guitar Player</div>
                        </div>
                    </div>

                    <div class="main-slider-button">
                        <a href="#search-form" class="slider-button-arrow"></a>
                    </div>
                    <div class="gc-recommend"><a href="https://www.google.com/intl/ru_ALL/chrome/" target="_blank" rel="nofollow noopener">Google Chrome</a> is recommended</div>
                </div>
                <div class="left-slider-panel"></div>
            </div>

        </div>
    </div>
    <!-- If we need pagination -->
    <div class="swiper-pagination"></div>

    <!-- If we need navigation buttons -->
    <div class="swiper-button-prev"></div>
    <div class="swiper-button-next"></div>
</div>

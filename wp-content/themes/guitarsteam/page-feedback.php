<?php
/**
 * Template Name: Guest Book
 *
 * Created by Igor
 * Date: 11.03.2019
 * Time: 12:55
 */

//include_once "comments.php";

get_header();
?>

    <div class="page-container">

        <!--  SIDEBAR  -->
        <?php // get_template_part('templates/content', 'sidebar') ?>

        <!--  Page content  -->
        <div class="panel container">

            <div class="panel-content top title">
                <h1>Feedback</h1>
            </div>

            <div class="panel-content bottom">

                <h4 style="text-align: center">
                    We'd be glad to hear from you as a feedback.
                    <br/>
                    Drop us a line of just say hello!
                </h4>

                <br/>
                <div style="clear: both"></div>

            </div>

        </div>
        <div class="panel container">
            <div class="comments-wrapper panel-content">
                <?php comments_template() ?>
                <?php //get_template_part('templates/element', 'comments') ?>
            </div>
        </div>


    </div>

<?php

get_footer();

?>
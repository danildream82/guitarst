<?php

class gsComments
{
    public static function DisplayAll()
    { ?>

        <div class="row tabs m-0">
            <div class="col-md-12">
                <ul class="tabset">
                    <li class="active"><a href="#">Comments: <?= get_comments_number() ?></a></li>
                    <!--            <li><a href="#">Facebook</a></li>-->
                    <!--            <li><a href="#">VK</a></li>-->
                    <!--            <li><a href="#">Twitter</a></li>-->
                </ul>

                <section class="comments" id="comments">

                    <?php
                    // Comments Layout
                    if ( have_comments() )
                    {


                        wp_list_comments(array(
                            'type' => 'comment',
                            'callback' => 'CommentLayout' ));

                        if(function_exists('wp_comments_corenavi'))
                            wp_comments_corenavi();

                    }
                    ?>

                    <!-- Comment Form -->
                    <div class="comment-form">
                        <?php self::DisplayForm() ?>
                    </div>

                </section>

                <?php


                /********************************************************************/

                remove_all_actions( 'wp_insert_comment' );
                //add_action( 'wp_insert_comment', 'YNRM_on_add_new_comment', 99, 2 );
                add_action( 'comment_post', 'GS_on_add_new_comment', 10, 2 );

                function GS_on_add_new_comment( $comm_id, $comment )
                {
                    //          print_r( $comment, true ); die;
                }
                ?>

            </div>
        </div>

    <?php
    }
    /******************************************************************************************/
    public static function DisplayForm( $post_id = null ) // post_id нужен для того, чтобы WP проверил включены ли каменты на этой странице
    {
        $comment_field = '<div class="form-group col-md-12 col-sm-12 col-xs-12 row" name="comment">
                                                    <label for="comment"></label>
                                                    <textarea placeholder="Write Your Comment" id="comment" class="input button edged flat" name="comment" rows="5"></textarea>
                                                </div>';

        $fields =  array(
            'comment_field' => $comment_field,

            'name' => '<div class="form-group col-md-6 col-sm-6 col-xs-12 row">
                                <label for="name"></label>
                                <input class="form-control input button white_wood edged flat" id="name" name="author" placeholder="Name*" type="text">
                            </div>',

            'email'  => '<div class="form-group col-md-6 col-sm-6 col-xs-12 row">
                                    <label for="email"></label>
                                    <input class="form-control input button white_wood edged flat" id="email" name="email" placeholder="Email*" type="text">
                                </div>',

            //                'url' =>  '<div class="form-group col-md-6 col-sm-6 col-xs-12 row">
            //                                    <label for="url"></label>
            //                                    <input class="form-control input button white_wood edged flat" id="url" name="url" placeholder="Website" type="text">
            //                                </div>',

            //                'twitter'  => '<div class="form-group col-md-6 col-sm-6 col-xs-12 row">
            //                                    <label for="twitter">Twitter</label>
            //                                    <input class="form-control input button white_wood edged flat" id="twitter" name="twitter" placeholder="@your-twitter-id" type="text">
            //                                </div>',


        );

        if (is_user_logged_in())
        {
            $args = array('fields' => $fields,
                'comment_field' => $comment_field,
                'label_submit' => 'Send',
                'title_reply' => 'Add Comment',
                'title_reply_to' => 'Reply to: %s',
                'cancel_reply_link' => 'Cancel Reply',
                'comment_notes_before' => false,
                'comment_notes_after' => '<div class="form-group col-md-6 col-sm-6 col-xs-12 row">
                                            <input name="submit" id="submit" class="submit submit-btn button wooden edged" value="Send" type="submit">
                                          </div>'
            );

            $res = comment_form( $args, $post_id );

            /*                                    $fields = array( 'twitter'  => '<div class="form-group col-md-6 col-sm-6 col-xs-12 row">
                                                                    <label for="twitter">Twitter</label>
                                                                    <input class="form-control" id="twitter" name="twitter" placeholder="@your-twitter-id" type="text">
                                                                </div>',
                                                                'comment_field' => $comment_field );*/
        }
        else
        { ?>
            <!-- Login form-->
            <div id="respond" style="margin-bottom: 15px;">
                <h3>Please, <a data-src="#window_login" href="javascript:;" data-fancybox="login-reg" class="fancybox-trigger">login to leave a comment</a></h3>
            </div>
            <?php
        }
    }
    /******************************************************************************************/
}

function CommentLayout( $comment, $args, $depth )
{
    ?>
    <div class="comment" id="comment-<?php echo get_comment_ID() ?>">
        <div class="user">
            <?php echo get_avatar( $comment, 100) ?>
            <!--                    <span class="name">--><?php //echo get_comment_author_link() ?><!--</span>-->
        </div>
        <div class="body">
                    <span class="name">
                        <span class="user mobile">
                            <?php echo get_avatar( $comment, 100) ?>
                            <!--                    <span class="name">--><?php //echo get_comment_author_link() ?><!--</span>-->
                        </span>
                        From: <?php echo get_comment_author_link() ?></span>
            <div class="comment-text">
                <?php comment_text() ?>
            </div>
            <div class="meta">
                <span class="date"><?php echo get_comment_date() ?></span>
                <?php comment_reply_link(array_merge( $args, array('depth' => $depth, 'max_depth' => $args['max_depth']))) ?>
            </div>
        </div>
        <div style="clear: both"></div>
    </div>
    <?php
}

gsComments::DisplayAll();

?>


<?php
/*
 * Сложный модуль комментариев с каментами из Фейсбука, Контакта и т.п.
 *
 * В данный момент НЕ ИСПОЛЬЗУЕТСЯ!!!
 * см. comments.php в корне темы
*/
?>


<div class="row tabs">
	<div class="col-md-12">
		<ul class="tabset">
			<li class="active"><a href="#">Comments: 0</a></li>
			<li><a href="#">Facebook</a></li>
			<li><a href="#">VK</a></li>
			<li><a href="#">Twitter</a></li>
		</ul>

        <section class="comments" id="comments">
            <h4><?php
                $comment_num = get_comments_number();
                if ( $comment_num != 1 )
                    echo $comment_num . ' Comments';
                else
                    echo $comment_num . ' Comment';
                ?></h4>

            <?php
            // Comments Layout
            if ( have_comments() )
            {


                wp_list_comments(array(type => 'comment',
                    callback => CommentLayout));

                if(function_exists('wp_comments_corenavi'))
                    wp_comments_corenavi();

            }
            ?>

            <!-- Comment Reply form -->
            <?php
            // COMMENT FORM
            $comment_field = '<div class="form-group col-md-12" name="comment">
                                                    <label for="comment">Write Your Comment</label>
                                                    <textarea placeholder=".  .  .  .  .  .  .  .  .  .  .  .  .  ." id="comment" name="comment" rows="5"></textarea>
                                                </div>';

            $fields =  array(
                'name' => '<div class="form-group col-md-6 col-sm-6 col-xs-12 row">
                                                                        <label for="name">Name <span style="color: red">*</span></label>
                                                                        <input class="form-control" id="name" name="author" placeholder=". . . . . . ." type="text">
                                                                    </div>',

                'email'  => '<div class="form-group col-md-6 col-sm-6 col-xs-12 row">
                                                                    <label for="email">Email <span style="color: red">*</span></label>
                                                                    <input class="form-control" id="email" name="email" placeholder=". . . . . . ." type="text">
                                                                </div>',

                'url' =>  '<div class="form-group col-md-6 col-sm-6 col-xs-12 row">
                                                                        <label for="url">Website</label>
                                                                        <input class="form-control" id="url" name="url" placeholder=". . . . . . ." type="text">
                                                                    </div>',

                'twitter'  => '<div class="form-group col-md-6 col-sm-6 col-xs-12 row">
                                                                    <label for="twitter">Twitter</label>
                                                                    <input class="form-control" id="twitter" name="twitter" placeholder="@your-twitter-id" type="text">
                                                                </div>',

                'comment_field' => $comment_field
            );

            if (is_user_logged_in())
            {
                /*                                    $fields = array( 'twitter'  => '<div class="form-group col-md-6 col-sm-6 col-xs-12 row">
                                                                        <label for="twitter">Twitter</label>
                                                                        <input class="form-control" id="twitter" name="twitter" placeholder="@your-twitter-id" type="text">
                                                                    </div>',
                                                                    'comment_field' => $comment_field );*/
            }
            else
                $comment_field = false;

            $args = array('fields' => $fields,
                'comment_field' => $comment_field,
                'label_submit' => 'Send',
                'title_reply' => 'Add Comment',
                'title_reply_to' => 'Reply to: %s',
                'cancel_reply_link' => 'Cancel Reply',
                'comment_notes_before' => false,
                'comment_notes_after' => '<input name="submit" id="submit" class="submit button" value="Send" type="submit">'
            );

            comment_form($args);
            ?>
        </section>

        <?php
        function CommentLayout( $comment, $args, $depth )
        {
            ?>
            <div class="comment" id="comment-<?php echo get_comment_ID() ?>">
                <div class="user">
                    <?php echo get_avatar( $comment, 48) ?>
                    <span class="name"><?php echo get_comment_author_link() ?></span>
                </div>
                <div class="body">
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

        /********************************************************************/

        remove_all_actions( 'wp_insert_comment' );
        //add_action( 'wp_insert_comment', 'YNRM_on_add_new_comment', 99, 2 );
        add_action( 'comment_post', 'YNRM_on_add_new_comment', 10, 2 );
        function YNRM_on_add_new_comment( $comm_id, $comment )
        {
//    print_r( $comment, true ); die;
        }
        ?>

	</div>
</div>


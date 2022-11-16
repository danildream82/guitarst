<?php
/**
 * Created by Igor
 * Date: 25.08.2018
 * Time: 21:07
 */

class gsUtils
{
    static protected $last_tip = 0;

    /***************************************************************************************/
    public static function GetLoadScreenTip()
    {
        $tip_text = DID_YOU_KNOW_DEFAULT_TEXT;

        $query = new WP_Query( array(
            'post_type' => DID_YOU_KNOW_POST_TYPE,
            'posts_per_page' => 1,
            'orderby' => 'rand' ));

        if ( $query->posts )
        {
            $tip_text = $query->posts[0]->ID;

            // проверяем, чтобы не пропускать одну и ту же запись два раза подряд
            foreach ( $query->posts as $post )
            {
                $post = $query->posts[0];

                if ( $post->ID != self::$last_tip )
                {
                    $tip_text = $post->post_content;
                    self::$last_tip = $post->ID;
                    break;
                }
            }
        }

        return $tip_text;
    }
    /************************************************************************************/
    public static function Alert( $message_text, $class, $display_empty = false )
    {
        if ( $message_text || $display_empty )
        {
            // Visibility
            $style = '';
            if ( $display_empty && $message_text == false )
                $style = 'style="display: none"';

            // prepare text
            if (!is_array($message_text)) {
                $message_text = [$message_text];
            }

            ?>

            <div class="alert alert-<?php echo $class; ?>" <?= $style ?>>
                <?php echo implode('<br />', $message_text); ?>
            </div>

        <?php }
    }
    /************************************************************************************/
    public static function MaskEmail( $email )
    {
        $parts = explode( '@', $email );

        if ( count( $parts ) != 2 )
            return $email;

        $name = $parts[0];
        $new_name = '';

        for ( $i = 0; $i < strlen( $name ); $i++ )
        {
            if ( $i != 0 && $i != strlen( $name ) - 1 )
                $new_name .= '&bull;';
            else
                $new_name .= $name[$i];
        }

        return $new_name . '@' . $parts[1];
    }
    /***************************************************************************************/
    public static function MaskPhoneNum( $phone )
    {
        $new_phone = '';

        for ( $i = 0; $i < strlen( $phone ); $i++ )
        {
            if ( $i > 2 && $i != strlen( $phone ) - 1 )
                $new_phone .= '&bull;';
            else
                $new_phone .= $phone[$i];
        }

        return $new_phone;
    }
    /************************************************************************************/
    public static function CleanPhoneNum( $phone )
    {
        $phone = str_replace( ' ', '', $phone );
        $phone = str_replace( '-', '', $phone );
        $phone = str_replace( '(', '', $phone );
        $phone = str_replace( ')', '', $phone );

        return $phone;
    }
    /************************************************************************************/
    public static function EscapeArray( $arr )
    {
        global $wpdb;
        $escaped = [];
        foreach ( $arr as $key => $value ) {
            if ( is_numeric( $value ) ) {
                $escaped[] = $wpdb->prepare( '%d', $value );
            } else {
                $escaped[] = $wpdb->prepare( '%s', $value );
            }
        }

        return implode( ',', $escaped );
    }
    /************************************************************************************/
    public static function GenerateRandomCode( $length )
    {
        $symbols = array(0,1,2,3,4,5,6,7,8,9,
            'a','b','c','d','e','f','g','h','i','j','k',
            'l','m','n','o','p','q','r','s','t','u','v',
            'w','x','y','z');

        // Generate code
        $code = '';

        for ($i = 0; $i < $length; $i++)
        {
            $index = rand(0, count($symbols) - 1);
            $code .= $symbols[$index];
        }

        $code = strtoupper( $code );

        return $code;
    }
    /************************************************************************************/
    public static function GetCurrentPageUrl( $trailing_slash = true, $no_paging = true )
    {
        global $wp;

        $current_url =  home_url( $wp->request );

        if ( $no_paging )
        {
            $position = strpos( $current_url , '/page' );
            $current_url = ( $position ) ? substr( $current_url, 0, $position ) : $current_url;
        }

        if ( $trailing_slash )
            $current_url = trailingslashit( $current_url );

        return $current_url;
    }
    /************************************************************************************/
    public static function GetUserName( $user_data )
    {
        if ( isset( $user_data->first_name ) && $user_data->first_name )
            return $user_data->first_name;
        else
            return $user_data->user_login;
    }
    /************************************************************************************/
    public static function GetCardLastDigits( $card_num )
    {
        // Remove spaces
        $card_num = str_replace( " ", "", $card_num );

        // Get last 4 digits
        $last_digits = substr( $card_num, -4 );

        return $last_digits;
    }
    /************************************************************************************/

}

?>
<?php
/**
 * Created by TriLineSoft
 * User: Igor
 * Date: 29.03.2017
 * Time: 19:29
 */

define('API_PASS', 'KJFHGOFGIUHYFKJDKVBKGLHSLDIFKDJH');

// Error codes
define( 'ERR_OK', 'ok' );
define( 'ERR_ACTION_FAILED', 'action_failed' );
define( 'ERR_NO_DATA', 'no_data_supplied' );
define( 'ERR_BAD_SEARCH_PARAM', 'bad_search_param' );
define( 'ERR_INVALID_DATA', 'invalid_data' );
define( 'ERR_UNSUPPORTED_ACTION', 'unsupported_action' );

// Allowed Actions list
//--------------------------------
// Required arguments:
// 'user' - JSON encoded user data
define('ACTION_LOGIN', 'login');
define('ACTION_REGISTER', 'register');
define('ACTION_SONG_SEARCH', 'song_search');
define('ACTION_SONG_DOWNLOAD', 'song_download');
define('ACTION_CONTACT_FORM_SEND', 'contact_form_send' );
define('ACTION_GET_COMMENT_FORM', 'get_comment_form');

include_once "songscp.php";
error_reporting(E_ALL);

class gsAPI
{
    protected $request_data;
    protected $api_pass;
    protected $action;

    protected $sendgrid;

    private static $search_fields;
    private static $allowed_values_for_search_fields;

    private static $allowed_main_search_fields = [ 
                                                    "title"    => 1,
                                                    "author"  => 1,
                                                 ];

    private static $allowed_term_search_fields = [
                                                    "genre" => "product_cat",
                                                 ];

    private static $allowed_meta_search_fields = [
                                                    "song_original_artist" => [ "name" => "song_original_artist", "compare_type" => "LIKE",],
                                                    "song_complexity"      => [ "name" => "song_complexity", "compare_type" => "LIKE",],
                                                 ];                                                   
    private static $meta_relation_type = 'OR';                                                 

    private static $default_required_fields = [
                                          'action'        => 1,
                                          'api_pass'      => 1,
                                      ];

    private static $search_post_type = 'product';

    /*******************************************************************************************************/
    /*******************************************************************************************************/
    public function __construct()
    {
        self::$search_fields = self::$allowed_main_search_fields +
                               self::$allowed_term_search_fields +
                               self::$allowed_meta_search_fields;

        $this->sendgrid = new gsSendGrid();
    }
    /*******************************************************************************************************/
    public function ProcessCall()
    {
        // Unlimited execution time
        set_time_limit(0);

        $post_data = file_get_contents("php://input");

        if ( !empty( $post_data ) ) {
            $this->request_data = json_decode( $post_data, true );
        } else {
            $this->Response( ERR_INVALID_DATA, 'no data supplied' );
            return false;
        }

        // Validate API password
        if ( $this->request_data['api_pass'] != API_PASS )
        {
            $this->Response( ERR_INVALID_DATA, 'invalid API password' . $this->request_data['api_pass']);
            return;
        }

        // Get the data
        $action = $this->request_data['action'];

        // DO ACTIONS
        switch ($action) {
            case ACTION_LOGIN:
                $this->Login( $this->CheckRequiredField( 'log' ),
                              $this->CheckRequiredField( 'pwd' ),
                              $this->CheckRequiredField( 'rmb' ));
                break;
            case ACTION_REGISTER:
                $this->Register( $this->CheckRequiredField( 'usr' ),
                              $this->CheckRequiredField( 'eml' ),
                              $this->CheckRequiredField( 'pwd' ));
                break;
            case ACTION_SONG_SEARCH:
              //  $this->DoTestSearch(); // FOR TEST
                $this->SongGeneralSearch($this->request_data['search_params']);
                break;
            case ACTION_SONG_DOWNLOAD:
                echo $this->SongDownLoad( $this->request_data['post_id'] );
                break;
            case ACTION_CONTACT_FORM_SEND:
                $this->ContactFormSend(
                    $this->CheckRequiredField( 'user_name' ),
                    $this->CheckRequiredField( 'user_email' ),
                    $this->CheckRequiredField( 'subject' ),
                    $this->CheckRequiredField( 'message' ));
                break;
            case ACTION_GET_COMMENT_FORM:
                $this->GetCommentForm();
                break;
            default:
                $this->Response(ERR_UNSUPPORTED_ACTION, $action);
        }

        return;
    }
    /***************************************************************************************/
    protected function Login( $login, $password, $remember )
    {
        //Check if user exists in WordPress database
        if ( strpos( $login, '@' ) !== false )
            $user = get_user_by( 'email', $login );
        else
            $user = get_user_by( 'login', $login );

        // user not found
        if( $user )
        {
            // check password
            if ( wp_check_password( $password, $user->user_pass, $user->ID ))
            {
                wp_clear_auth_cookie();
                wp_set_current_user ( $user->ID );
                wp_set_auth_cookie  ( $user->ID );

                $user_data = $this->GetUserData( $user->ID );

                $this->Response( ERR_OK, '', $user_data );
            }
            else  //bad password
            {
                $this->ResponseBool( false );
            }
        }
        else
            $this->ResponseBool( false );
    }
    /***************************************************************************************/
    protected function Register( $username, $email, $password )
    {
        if ( $username == '' && $email ) // username from email
        {
            $parts = explode( '@', $email );
            $username = $parts[0];
        }

        // Register user
        $user_data = array( 'user_login' => $username,
                            'user_pass' => $password,
                            'user_email' => $email);

        $user_id = wp_insert_user( $user_data );

        if( is_wp_error( $user_id )) // on error
        {
            $error = $user_id;
            $this->Response( $error->get_error_code(), $error->get_error_message() );
        }
        else
        if ( $user_id == 0 ) // user name is too big
        {
            $this->Response( ERR_ACTION_FAILED, 'user_name_too_big' );
        }
        else
        {
            // Set user pic
            //update_user_meta( $user_id, 'user-pic', $user_data->profile_pic );

            $user_data = $this->GetUserData( $user_id );

            $this->Response( ERR_OK, '', $user_data );
        }
    }
    /***************************************************************************************/
    protected function GetUserData( $user_id )
    {
        $user = get_userdata( $user_id );

        if ( $user == false )
        {
            $this->Response( ERR_ACTION_FAILED, 'database_error' );
            return false; // TODO : заменить на конструкцию с исключениями
        }

        $user_data = array(
            'display_name' => $user->display_name,
            'user_avatar' => get_site_url() . '/wp-content/uploads/2017/03/AD_userpic-150x150.jpg'
        );

        return $user_data;
    }
    /***************************************************************************************/
    protected function SongGeneralSearch( $search_params )
    {
        $search = new gsSearch();
        $result = $search->SongGeneral( $search_params );

        if ( $result )
        {
            $text = $result['total'] > 0 ? '' : 'Search result is empty';
            $this->Response( ERR_OK, $text, $result );
        }
        else
        {
            $this->Response(  $search->last_error['code'], $search->last_error['text'], [ 'search_results' => [] ]);
        }
    }
    /***************************************************************************************/
    protected function SongDownLoad( $postId )
    {
        $tabs = SongsCP::getSongContentByPostId( $postId );
        $tip  = gsUtils::GetLoadScreenTip();

        if ( empty($tabs))
        {
            $this->Response( ERR_ACTION_FAILED, 'Song download error: ' . SongsCP::getErrors() );
        }
        else
        {
            $this->Response( ERR_OK, '', [ 'tabs' => $tabs, 'tip' => $tip ] );
        }
    }
    /***************************************************************************************/
    protected function ContactFormSend( $user_name, $user_email, $subject, $message )
    {
        $res = $this->sendgrid->SendRawEmail( $user_email, $user_name, SUPPORT_EMAIL, '', $subject, $message );

        if ( $res )
            $this->Response( ERR_OK, '' );
        else
            $this->Response( ERR_ACTION_FAILED, 'Failed to send the email' );
    }
    /***************************************************************************************/
    protected function GetCommentForm()
    {
        $user = new gsUser();

        ob_start();

        include_once __DIR__ . "/../comments.php";

        ob_clean();

        $post_id = url_to_postid( site_url('feedback'));
        gsComments::DisplayForm( $post_id );

        $content = ob_get_contents();

        ob_end_clean();

        $this->Response( ERR_OK, '', array( 'content' => $content ));
    }
    /***************************************************************************************/
    protected function DoTestSearch()
    {
        $results = array();

        $song = array(
            'id' => 111,
            'name' => 'Californication',
            'original_artist' => 'RHCP',
            'player_name' => 'Igor Presnyakov',
            'thumb' => 'http://guitarsteam.test/wp-content/uploads/2017/03/rhcp-150x150.jpg',
            'user_image' => 'http://guitarsteam.test/wp-content/uploads/2017/03/userpic-3.gif',
            'genre' => array( 'pop', 'rock' ),
            'complexity' => 3,
            'popularity' => 3,
            'price' => 3
        );

        array_push( $results, $song );

        $song = array(
            'id' => 222,
            'name' => 'Hotel California',
            'original_artist' => 'Eagles',
            'player_name' => 'Tommy Emmanuel',
            'thumb' => 'http://guitarsteam.test/wp-content/uploads/2017/03/Hotel-California-Single-The-Eagles-Album-Cover-Beverly-Hills-Hotel-150x150.jpg',
            'user_image' => 'http://guitarsteam.test/wp-content/uploads/2017/03/AD_userpic-150x150.jpg',
            'genre' => array( 'pop', 'rock' ),
            'complexity' => 3,
            'popularity' => 2,
            'price' => 0
        );

        array_push( $results, $song );

        $song = array(
            'id' => 333,
            'name' => 'Castle In the Snow',
            'original_artist' => 'Avener',
            'player_name' => 'Igor Presnyakov',
            'thumb' => 'http://guitarsteam.test/wp-content/uploads/2017/03/avener-150x150.jpg',
            'user_image' => 'http://guitarsteam.test/wp-content/uploads/2017/03/userpic-3.gif',
            'genre' => array( 'pop' ),
            'complexity' => 2,
            'popularity' => 1,
            'price' => 2
        );

        array_push( $results, $song );

        $this->Response( ERR_OK, '', [ 'search_results' => $results ]);
    }
    /***************************************************************************************/
    protected function CheckRequiredField( $field_name )
    {
        if ( isset( $this->request_data[$field_name] ) == false )
        {
            $this->Response( ERR_NO_DATA, $field_name . ' field is absend' );
            return;
        }

        return $this->request_data[$field_name];
    }
    /***************************************************************************************/
    protected function CheckDefaultRequiredFields()
    {
        foreach (self::$default_required_fields as $key => $value ) {
            if ( !isset($this->request_data[$key]) ) {
                $this->Response( ERR_NO_DATA, $key . ' field is absend' );
                return false;
            }
        }

        return true;
    }
    /***************************************************************************************/
    protected function CheckAllowedSearchFields( $search_params_name )
    {
        foreach ( $this->request_data[$search_params_name] as $key => $value ) {
            if ( !isset(self::$search_fields) ) {
                $this->Response( ERR_BAD_SEARCH_PARAM, $key . ' is not allowed field' );
                return false;
            } elseif ( empty($value) ) {
                unset($this->request_data[$key]);
            }
        }    

        return true;
    }
    /***************************************************************************************/
    // If we need just to send report either error or success
    protected function ResponseBool( $ret )
    {
        if ( $ret ) {
            echo $this->Response( ERR_OK, '' );
        } else {
            echo $this->Response( ERR_ACTION_FAILED, '' );
        }
    }
    /***************************************************************************************/
    // data - array with "key => value" pairs, which will be added to result json message
    protected function Response( $error_code, $error_message = '', $data = false )
    {
        $ret = [ 'error_code' => $error_code, 'error_message' => $error_message ];

        // Setup custom values
        if ( isset( $data ) && is_array( $data ) && count( $data ) > 0 )
        {
            foreach( $data as $key => $value )
            {
                $ret['data'][$key] = $value;
            }
        }

        $ret = json_encode( $ret );

        echo $ret;
    }

    /***************************************************************************************/
    /*  STATIC functions
    /***************************************************************************************/
    /***************************************************************************************/
}

// TMP : for production DEBUG
function fileDebug($var)
{
    $ret = false;
    $file_name = "/var/www/html/wp-debug/debug.txt";

    $file = fopen( $file_name, "a+" );

    if ( file_exists( $file_name ))
    {
        fwrite($file, print_R($var, 1). "\r\n");
        fclose($file);
        $ret = true;
    }

    return $ret;
}

?>

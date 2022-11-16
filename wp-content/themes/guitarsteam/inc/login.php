<?php
/**
 * Created by PhpStorm.
 * User: Igor
 * Date: 08.04.2017
 * Time: 13:44
 */

define( 'LOGIN_ERROR_EMPTY_EMAIL', 'empty_email' );
define( 'LOGIN_ERROR_EMPTY_PSWD', 'empty_pswd' );
define( 'LOGIN_ERROR_INVALID', 'invalid' );

/*********************************************************************************************/
//add_filter('authenticate', function( $user, $login, $password){
//
//    try
//    {
//        //Check for empty fields
//        if ( empty($login) ){ //No email
//            throw new Exception('empty_email');
//        }
//        //else if(!filter_var($email, FILTER_VALIDATE_EMAIL)){ //Invalid Email
//        //}
//        if ( empty($password) ){ //No password
//            throw new Exception('empty_pswd');
//        }
//
//        //Check if user exists in WordPress database
//        if ( strpos( $login, '@' ) !== false )
//            $user = get_user_by( 'email', $login );
//        else
//            $user = get_user_by( 'login', $login );
//
//        //bad email
//        if( $user )
//        {
//            //check password
//            if ( wp_check_password($password, $user->user_pass, $user->ID))
//                return $user; //passed
//            else
//                throw new Exception('invalid');
//
//        }
//        else
//            throw new Exception('invalid');
//    }
//    catch(Exception $e)
//    {
//        header( 'Location: ' . home_url( '/login' ) . '?login_error=' . $e->getMessage() . '&username=' . urlencode( $email ));
//        exit;
//    }
//
//}, 20, 3);
/*********************************************************************************************/
// Redirect login & register pages
//add_action('init', function()
//{
//    $page_viewed = basename($_SERVER['REQUEST_URI']);
//
//    if( $page_viewed == "wp-login.php" && $_SERVER['REQUEST_METHOD'] == 'GET') {
//        header( 'Location: ' . home_url( '/login' ));
//        exit;
//    }
//    if( $page_viewed == "wp-login.php?action=register" && $_SERVER['REQUEST_METHOD'] == 'GET') {
//        header( 'Location: ' . home_url( '/register' ));
//        exit;
//    }
//});
/*********************************************************************************************/
//add_action( 'wp_login_failed', function()
//{
//    header( 'Location: ' . home_url( '/login/' ) . '?login=failed' );
//    exit;
//});
/*********************************************************************************************/

?>
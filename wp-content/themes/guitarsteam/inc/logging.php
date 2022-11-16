<?php
/**
 * Created by Igor
 * Date: 13.04.2018
 * Time: 19:21
 */

include_once( ABSPATH . 'wp-content/plugins/giftcards/include/lib/vendor/autoload.php' );

define( 'LOGGLY_TOKEN', '4eebf38a-b2a0-4696-af2f-0523971799fb' );

define( 'LOG_TAG_CHECKOUT', 'checkout' );
define( 'LOG_TAG_2FACTOR', '2-factor' );
define( 'LOG_TAG_AFFILLIATE', 'affilliate' );
define( 'LOG_TAG_AFF_PAGE', 'affilliate-page' );
define( 'LOG_TAG_BUY_COUPONS', 'BUY-coupons' );
define( 'LOG_TAG_SELL_COUPONS', 'SELL-coupons' );
define( 'LOG_SINGLE_CARD', 'single-card');
define( 'LOG_SUBSCRIPTION', 'subscription');
define( 'LOG_USER_VERIFICATION', 'user-verification');

class ejLog
{
    /************************************************************************************/
    public static function Send( $message, $tag, $context = [] )
    {
        $log = new \Monolog\Logger( 'ejGiftCards' );
        $log->pushHandler( new \Monolog\Handler\LogglyHandler( LOGGLY_TOKEN . '/tag/' . $tag, \Monolog\Logger::INFO ));

        $log->addWarning( $message, $context );
    }
    /************************************************************************************/
}

?>
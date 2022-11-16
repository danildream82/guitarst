<?php

/**
 * Created by PhpStorm.
 * User: Igor
 * Date: 27.04.2017
 * Time: 18:34
 */

define('TABLE_USER_SETTINGS', 'user_settings' );

class gsUser extends gsUtils
{
    public $current; // current WP_user
    public $settings; // current user settings
    public $affilliate = null;

    public static $bulk_seller_status_array = array( 'pending', 'approved', 'rejected' );

    public function __construct()
    {
        $this->current = wp_get_current_user();
        $this->settings = $this->GetSettings();
    }
    /************************************************************************************/
    public function SetUser( $user_id )
    {
        $this->current = get_user_by( 'id', $user_id );
        $this->settings = $this->GetSettings();
    }
    /************************************************************************************/
    public function IsLoggedIn()
    {
        return $this->current->ID == true;
    }
    /************************************************************************************/
    public function IsAffilliate( $refresh = false )
    {
        if ( $this->affilliate == null || $refresh ) // remember the status
        {
            $this->affilliate = ejAffilliate::GetAffilliate( $this->current->ID );
        }

        return $this->affilliate ? true : false;
    }
    /************************************************************************************/
    public function IsReferral()
    {
        return ejAffilliate::GetAffByRef( $this->current->ID ) ? true : false;
    }
    /************************************************************************************/
    public function GetAffBalance( $total_earned = false )
    {
        $balance = false;

        if ( $this->IsAffilliate() )
        {
            $balance = 0;

            if ( $total_earned )
                $balance = $this->affilliate->total_earnings;
            else
                $balance = $this->affilliate->balance;
        }

        return $balance; // false in case if user isn't affilliated
    }
    /************************************************************************************/
    public function GetAffLink()
    {
        $link = false;

        if ( $this->IsAffilliate() )
        {
            if ( $this->affilliate->short_link )
                $link = $this->affilliate->short_link;
            else
                $link = get_site_url() . '?ref=' . $this->affilliate->ref_code;
        }

        return $link;
    }
    /************************************************************************************/
    public function GetReferralsCount()
    {
        $count = 0;

        if ( $this->IsAffilliate() )
        {
            $count = ejAffilliate::GetReferralsCount( $this->affilliate->user_id );
        }

        return $count;
    }
    /************************************************************************************/
    public function GetFirstName()
    {
        if ( $this->current->ID == false )
            return '';

        $first_name = get_user_meta( $this->current->ID, 'first_name', true );

        if ( $first_name == '' )
            $first_name = $this->current->data->user_nicename;

        return $first_name;
    }
    /************************************************************************************/
    public function SaveUserBillingInfo( $user_data )
    {
        update_user_meta( $this->current->ID, 'first_name', sanitize_text_field( $user_data['first_name'] ));
        update_user_meta( $this->current->ID, 'last_name', sanitize_text_field( $user_data['last_name'] ));
        update_user_meta( $this->current->ID, 'phone', sanitize_text_field( $user_data['phone'] ));
        update_user_meta( $this->current->ID, 'company', sanitize_text_field( $user_data['company'] ));
        update_user_meta( $this->current->ID, 'address', sanitize_text_field( $user_data['address'] ));
        update_user_meta( $this->current->ID, 'city', sanitize_text_field( $user_data['city'] ));
        update_user_meta( $this->current->ID, 'state', sanitize_text_field( $user_data['state'] ));
        update_user_meta( $this->current->ID, 'zip_code', sanitize_text_field( $user_data['zip_code'] ));
        update_user_meta( $this->current->ID, 'birth_year', sanitize_text_field( $user_data['birth_year'] ));
        update_user_meta( $this->current->ID, 'birth_month', sanitize_text_field( $user_data['birth_month'] ));
        update_user_meta( $this->current->ID, 'birth_day', sanitize_text_field( $user_data['birth_day'] ));
    }
    /************************************************************************************/
    public function GetUserBillingInfo()
    {
        $user_data = array(
            'first_name'    => get_user_meta( $this->current->ID, 'first_name', true ),
            'last_name'     => get_user_meta( $this->current->ID, 'last_name', true ),
            'phone'         => get_user_meta( $this->current->ID, 'phone', true ),
            'company'       => get_user_meta( $this->current->ID, 'company', true ),
            'address'       => get_user_meta( $this->current->ID, 'address', true ),
            'city'          => get_user_meta( $this->current->ID, 'city', true ),
            'state'         => get_user_meta( $this->current->ID, 'state', true ),
            'zip_code'      => get_user_meta( $this->current->ID, 'zip_code', true ),
            'birth_year'    => get_user_meta( $this->current->ID, 'birth_year', true ),
            'birth_month'   => get_user_meta( $this->current->ID, 'birth_month', true ),
            'birth_day'     => get_user_meta( $this->current->ID, 'birth_day', true )
        );

        return $user_data;
    }
    /************************************************************************************/
    public function SetPaypalID( $pp_id, $only_once = true ) // only once per user
    {
        // if wasn't saved yet
        if ( $this->GetPaypalID() == false || $only_once == false )
        {
            $this->SaveSetting( 'paypal-id', null, null, $pp_id );
        }
    }
    /************************************************************************************/
    public function GetPaypalID()
    {
        return $this->GetSettingByName( 'paypal-id' );
    }
    /************************************************************************************/
    public function GetCreditCardToken()
    {
        return $this->GetSettingByName( 'cc_token' );
    }
    /************************************************************************************/
    public function SetCreditCardToken( $cc_token, $only_once = true ) // only once per user
    {
        if ( $this->GetCreditCardToken() == false || $only_once == false )
        {
            $this->SaveSetting( 'cc_token', null, null, $cc_token );
        }
    }
    /************************************************************************************/
    public static function IsPaypalIdAvailable( $pp_id, $user_id = false )
    {
        global $wpdb;
        $ret = true;

        if ( $pp_id == false )
            return false;

        // Check if the ID is already taken
        $sql = $wpdb->prepare( 'SELECT * FROM ' . TABLE_USER_SETTINGS .
            ' WHERE value_str=%s AND setting_name="paypal-id"', $pp_id );

        $res = $wpdb->get_results( $sql );

        if ( $res && count( $res ) > 0 ) // found
        {
            // if users are different
            if ( $user_id )
            {
                if ( $user_id != intval( $res[0]->user_id ))
                    $ret = false;
            }
            else
                $ret = false;
        }

        return $ret;
    }
    /************************************************************************************/
    public function GetSettings( $user_id = false )
    {
        global $wpdb;
        $user_id = $user_id ? $user_id : $this->current->ID;

        if ( $user_id == false )
            return false;

        $sql = $wpdb->prepare( 'SELECT * FROM ' . TABLE_USER_SETTINGS . ' WHERE user_id=%d', $user_id );

        return $wpdb->get_results( $sql );
    }
    /************************************************************************************/
    public function GetSettingByName( $setting_name )
    {
        if ( $this->current->ID == false )
            return false;

        $found = false;
        $setting_obj = null;

        // Search by name
        foreach( $this->settings as $key => $setting )
        {
            if ( $setting->setting_name == $setting_name )
            {
                $found = true;
                $setting_obj = $setting;
                break;
            }
        }

        $setting = false;

        // Get value
        if ( $found )
        {
            if ( $setting_obj->value_int )
                $setting = $setting_obj->value_int;
            else
            if ( $setting_obj->value_float )
                $setting = $setting_obj->value_float;
            else
            if ( $setting_obj->value_str )
                $setting = $setting_obj->value_str;
        }

        return $setting;
    }
    /************************************************************************************/
    public function SaveSetting( $setting_name, $value_int, $value_float, $value_str, $user_id = false )
    {
        $user_id = $user_id ? $user_id : $this->current->ID;

        if ( $user_id == false )
            return false;

        global $wpdb;
        $ret = false;

        // Check persistense of this value
        $sql = $wpdb->prepare( 'SELECT * FROM ' . TABLE_USER_SETTINGS . ' WHERE user_id=%d AND setting_name="%s"', $user_id, $setting_name );

        $result = $wpdb->get_row( $sql );

        if ( $result )
        {
            // Update data
            $ret = $wpdb->update( TABLE_USER_SETTINGS,
                    array(  'value_int' => $value_int,
                            'value_float' => $value_float,
                            'value_str' => $value_str ),
                    array( 'id' => $result->id ),
                    array( '%d', '%f', '%s' ), array( '%d' ));

            if ( $ret !== false )
                $ret = true;
        }
        else
        {
            // Insert data
            $ret = $wpdb->insert( TABLE_USER_SETTINGS,
                        array( 'user_id' => $user_id,
                               'setting_name' => $setting_name,
                               'value_int' => $value_int,
                               'value_float' => $value_float,
                               'value_str' => $value_str ),
                        array( '%d', '%s', '%d', '%f', '%s' ));
        }

        if ( $ret && $user_id == $this->current->ID ) // save settings to current class object
            $this->settings = $this->GetSettings();

        return $ret;
    }
    /************************************************************************************/
}
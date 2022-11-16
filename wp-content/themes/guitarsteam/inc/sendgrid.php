<?php

define ( 'SG_API_KEY', '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' );

define ('TMPL_REGISTRATION_COMPLETE', "d-47c1d4996f08495d971df88036ef7fc7");
define ('TMPL_FORGOT_PASSWORD', "d-d3ac8c674c7c4b408deab2e67a7127fe");
define ('TMPL_NOTIFICATION', "d-b5e1c5fe625b47849bbad33fa6440473");

//define( 'SENDGRID_LIST_MARKETING', '5160328' );

define( 'SUPPORT_EMAIL', 'guitarsteam.com@gmail.com' );

class gsSendGrid {

    public $apiKey;

    protected $sg; // sendgrid object

    public function __construct()
    {
        $this->apiKey = SG_API_KEY;
        $this->sg = new \SendGrid( $this->apiKey );
    }
    /*******************************************************************************************************/
    public function UserNotification( $email, $user_name, $title, $message_text )
    {
        // prepare message text
        $message_text = json_encode( $message_text );
        $message_text = substr( $message_text, 1, strlen( $message_text ) - 1 );
        $message_text = substr( $message_text, 0, strlen( $message_text ) - 1 );

        $subs = array( '-MessageTitle-' => $title,
                       '-MessageText-'  => $message_text );

        $request_body = $this->CompileRequest( $email, [], [], $user_name, $title, TMPL_NOTIFICATION, $subs );
        $response = $this->sg->client->mail()->send()->post( $request_body ); // SEND
    }
    /*******************************************************************************************************/
    public  function IsUserPresentInList( $email, $list_id = false )
    {
        $ret = false;
        $request_body = $this->Req_SearchRecipient( $email, $list_id );

        $response = $this->sg->client->contactdb()->recipients()->search()->post( $request_body ); // CALL API

        // Validate errors
        if ( $response->statusCode() == 200 || $response->statusCode() == 201 )
        {
            $body = json_decode( $response->body());

            if ( $body->recipient_count > 0 )
            {
                $recipient = $body->recipients[0];
                $ret = $recipient;
            }

        }

        return $ret;
    }
    /*******************************************************************************************************/
    public function SubscribeUser( $email )
    {
        $ret = true;
        $request_body = $this->Req_AddRecipient( $email );

        $response = $this->sg->client->contactdb()->recipients()->post( $request_body ); // CALL API

        // Validate errors
        if ( $response->statusCode() != 200 && $response->statusCode() != 201 )
            $ret = false;

        // Get recipient ID
        $body = json_decode( $response->body());
        $recipient_id = $body->persisted_recipients[0];

        $request_body = $this->Req_AddRecipientToList( $recipient_id, SENDGRID_LIST_MARKETING );

        $response = $this->sg->client->contactdb()->lists()->_( SENDGRID_LIST_MARKETING )->recipients()->_( $recipient_id )->post( $request_body ); // CALL API

        // Validate errors
        if ( $response->statusCode() != 200 && $response->statusCode() != 201 )
            $ret = false;

        return $ret; // bool
    }
    /*******************************************************************************************************/
    public function UnsubscribeUser( $email ) // NOT IN USE
    {
        $ret = false;

        // Get the user contact
        $request = json_decode( '{
                                        "conditions": [
                                            {
                                              "field": "email",
                                              "value": "' . $email . '",
                                              "operator": "eq",
                                              "and_or": ""
                                            }
                                        ]
                                    }' );

        $response = $this->sg->client->contactdb()->recipients()->search()->post( $request ); // CALL API

        if ( $response->statusCode() == 200 || $response->statusCode() == 201 )
        {
            $recipients = json_decode( $response->body(), true );

            if ( $recipients['recipient_count'] > 0 && count( $recipients['recipients'] ) > 0 )
            {
                $recipient = $recipients['recipients'][0];

                // Delete email from the list
                $response = $this->sg->client->contactdb()->lists()->_( SENDGRID_LIST_MARKETING )->recipients()->_( $recipient['id'] )->delete(); // CALL API

                $res = $response->statusCode();

                if ( $response->statusCode() == 204 || $response->statusCode() == 200 || $response->statusCode() == 201 )
                    $ret = true;
            }
        }

        return $ret;
    }
    /*******************************************************************************************************/
    public function AffSentInviteAdmin( $emails_list, $user, $adminEmails )
    {
        $message = $emails_list . "<br><br> User ID: <b>" . $user->current->ID . "</b><br>User Email: " . $user->current->data->user_email;

        $send_to = '';
        $cc = [];
        foreach ( $adminEmails as $idx => $sendTo )
        {
            if ( $idx == 0 )
                $send_to = $sendTo;
            else
                array_push( $cc, $sendTo );
        }

        $subs = array(
            '-MessageTitle-' => 'User Sent Invites',
            '-MessageText-'  => $message
        );

        $request_body = $this->CompileRequest( $send_to, $cc, [], '', 'User Sent Invites', TMPL_NOTIFICATION, $subs );
        $response = $this->sg->client->mail()->send()->post( $request_body ); // SEND
    }
    /*******************************************************************************************************/
    public function SendEmail( $user_email, $user_name, $template_id, $subs, $subject = '' )
    {
        // sanitize subs
        foreach ( $subs as $key => $value )
        {
            $value = json_encode( $value ); // prepare string
            if ( $value[0] == '"' )
                $value = substr( $value, 1, strlen( $value ) - 2 ); // cut quotes
            $subs[$key] = $value;
        }

        $request_body = $this->CompileRequest( $user_email, [], [], $user_name, $subject, $template_id, $subs );
        $response = $this->sg->client->mail()->send()->post( $request_body ); // SEND
    }
    /*******************************************************************************************************/
    public function SendRawEmail( $from_email, $from_name, $to_email, $to_name, $subject, $message )
    {
        $subject = json_encode( $subject );
        $subject = substr( $subject, 1, strlen( $subject ) - 2 );

        $message = json_encode( $message );
        $message = substr( $message, 1, strlen( $message ) - 2 );

        $request_body = '{
            "personalizations":
            [{
              "headers": {
                "X-Accept-Language": "en", 
                "X-Mailer": "EjGiftCards"
              },
                     
              "to": [
                {
                  "email": "' . $to_email . '", 
                  "name": "' . $to_name . '"
                }
              ]
            }],
            
            "from": {
                "email": "' . $from_email . '", 
                "name": "' . $from_name . '"
            },
            
            "reply_to": {
                "email": "' . $from_email . '", 
                "name": "' . $from_name . '"
            },
             
            "subject": "' . $subject . '",
            
            "content": [{
                "type": "text/plain",
                "value": "' . $message . '"
            }]
        }';

        $request_body = json_decode( $request_body );
        $response = $this->sg->client->mail()->send()->post( $request_body ); // SEND

        if ( $response->statusCode() != 202 )
            return false;

        return true;
    }
    /*******************************************************************************************************/
    protected function CompileRequest( $user_email, $cc = [], $bcc = [], $user_name, $subject, $template_id, $subs, $attachments = [] )
    {
        $attachments_json = '';

        if ( count( $attachments ) > 0 )
        {
            $attachments_json = '"attachments": [';

            foreach( $attachments as $attach )
            {
                $attachments_json .= '{';
                $attachments_json .=  '"content":"' . $attach['content'] . '",'; // base64 string
                $attachments_json .=  '"type":"' . $attach['type'] . '",';       // usua HTML file type
                $attachments_json .=  '"filename":"' . $attach['filename'] . '",';
                $attachments_json .=  '"disposition":"' . $attach['disposition'] . '"'; // 'inline' or 'attachment'
                $attachments_json .= '},';
            }

            $attachments_json = substr( $attachments_json, 0, -1 );
            $attachments_json .= '],';
        }

        $cc_str = '';

        if ( count( $cc ) > 0 )
        {
            $cc_str = '"cc":[';

            foreach ( $cc as $email )
                $cc_str .= '{ "email": "' . $email . '" },';

            $cc_str = substr( $cc_str, 0, -1 );
            $cc_str .= '],';
        }

        $bcc_str = '';

        if ( count( $bcc ) > 0 )
        {
            $bcc_str = '"bcc":[';

            foreach ( $bcc as $email )
                $bcc_str .= '{ "email": "' . $email . '" },';

            $bcc_str = substr( $bcc_str, 0, -1 );
            $bcc_str .= '],';
        }

        $request_body = '{
            "personalizations":
            [{
              "headers": {
                "X-Accept-Language": "en", 
                "X-Mailer": "EjGiftCards"
              },
                     
              "to": [
                {
                  "email": "' . $user_email . '", 
                  "name": "' . $user_name . '"
                }
              ],';

              $request_body .= $cc_str;
              $request_body .= $bcc_str;

              $request_body .= '"substitutions": {';

        // Build substitutions
        foreach( $subs as $key => $value )
            $request_body .= '"' . $key . '": "' . $value. '",';

        $request_body = substr( $request_body, 0, -1 );

        $request_body .= '}
        }],
            
            "from": {
                "email": "support@ejgiftcards.com", 
                "name": "Sam Smith"
            },
            
            "reply_to": {
                "email": "support@ejgiftcards.com", 
                "name": "Sam Smith"
            },';

            $request_body .= $attachments_json;

            $request_body .= '
             
            "subject": "' . $subject . '",
            
            "template_id": "' . $template_id . '"
        }';

        return json_decode( $request_body );
    }
    /*******************************************************************************************************/
    protected function PrepareJsonData( &$data_str )
    {
        $data_str = json_encode( $data_str );
        $data_str = substr( $data_str, 1, strlen( $data_str ) - 2 );
    }
    /*******************************************************************************************************/
    protected function Req_SearchRecipient( $email, $list_id = false )
    {
        $request = '{';

        if ( $list_id )
        {
            $request .= '"list_id": ' . $list_id . ',';
        }

        $request .= '"conditions": [';


                        $request .='{
                            "field": "email",
                            "value": "' . $email . '",
                            "operator": "eq",
                            "and_or": ""
                        }';

        $request .= ']}';

        return json_decode( $request );
    }
    /*******************************************************************************************************/
    protected function Req_AddRecipient( $email )
    {
        $request = '[{
                        "email": "' . $email . '"
                    }]';

        return json_decode( $request );
    }
    /*******************************************************************************************************/
    protected function Req_AddRecipientToList( $recipient_id, $list_id )
    {
        $request = '[{
                        "list_id": "' . $list_id . '",
                        "recipient_id": "' . $recipient_id . '"
                    }]';

        return json_decode( $request );
    }
    /*******************************************************************************************************/
}

?>
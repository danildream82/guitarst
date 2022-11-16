/**
 * Created by Igor on 11.04.2017.
 */

define( ['jquery'], function( $ ){

    // OBJECT
    function Api()
    {
        var self = this;

        /*************************************************************/
        // public
        /*************************************************************/
        self.SendRequest = function( request, cbSuccess, cbError, cbNetworkError ) // callbacks
        {
            // Send request
            $.ajax({
                url: '/api',
                type: "POST",
                data: request,
                success: onSuccess,
                error: onError
            });

            //---------------------------------------------------------------
            function onSuccess( response )
            {
                try
                {
                    // Validate response
                    if ( response == '' )
                        throw new Error( 'network_error', 'network_error' );

                    response = JSON.parse( response );

                    // Check response
                    if ( response.error_code == 'ok' )
                    {
                        var data = response.data || false;
                        cbSuccess( data );
                    }
                    else
                        throw { err_code: response.error_code, err_message: response.error_message };
                }
                catch( e )
                {
                    cbError( e.err_code, e.err_message );
                }
            }
            function onError( jqXHR, textStatus, errorThrown )
            {
                var err_msg = 'Unknown Error Occurred';

                // Check error
                if (jqXHR !== 'undefined' &&
                    jqXHR.responseText !== 'undefined' &&
                    (msg = JSON.parse(jqXHR.responseText)) !== 'undefined' &&
                    msg.message !== 'undefined')
                {
                    err_msg = msg.message;
                }

                cbNetworkError();
            }
            //---------------------------------------------------------------
        }
    };

    return new Api;

});
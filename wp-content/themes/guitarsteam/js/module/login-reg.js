/**
 * Created by Igor on 08.04.2017.
 */

define( ['jquery', 'common', 'api'], function( $, common, api )
{

    function LoginReg()
    {
        var self = this;

        self.login_callbacks = [];
        self.login_tried = false; // remain false if user just closed window

        /*************************************************************/
        // public
        /*************************************************************/
        self.login_callbacks = new Array(); // Push a function here and the script will pass login result there ( boolean )

        /*************************************************************/
        self.AuthBox = function( div_id, callbacks )
        {
            callbacks = callbacks || false;

            if ( callbacks )
                self.login_callbacks = callbacks;

            self.login_tried = false;

            $.fancybox.open({
                src : '#' + div_id,
                type : 'inline',
                opts : {
                    afterClose : function()
                    {
                        if ( common.IsUserLoggedIn() == false ) // if true then callbacks will get called after message box
                            self.RunCallbacks( false );
                    }
                }
            });
        }
        /*************************************************************/
        self.Login = function( login, password, remember, button, alert_container, cbUpdateUserPanel )
        {
            common.util.PutSpinner( button );

            request = JSON.stringify({
                action : "login",
                api_pass : common.settings.api_pass,
                log : login,
                pwd : password,
                rmb : remember
            });

            api.SendRequest( request, onSuccess, onError, onNetworkError );

            function onSuccess( data )
            {
                // Update comment form
                UpdateCommentForm( function()
                {
                    // Update userpanel content
                    cbUpdateUserPanel( data );

                    common.util.RemoveSpinner( button );
                    $.fancybox.close(); // Close login form

                    common.util.message.Box( 'Thank You!!!', 'You are now logged in', 2, function(){ self.RunCallbacks( true ) });
                });
            }
            function onError( error_code )
            {
                // Remove previous errors
                $('#login_form .alert').remove();

                // show Alert
                common.util.message.Alert( 'Login failed.</br> If you don\'t have account yet, please <a href="/register/">register here</a>',
                                           'warning', alert_container, false );
                common.util.RemoveSpinner( button );
            }
            function onNetworkError()
            {
                // Remove previous errors
                $('#login_form .alert').remove();

                // show Alert
                common.util.message.Alert( 'An error acquired. Please, try again' , 'warning', alert_container, false );
                common.util.RemoveSpinner( button );
            }

            function UpdateCommentForm( callback )
            {
                var comment_form = $('.comment-form');

                if ( comment_form.length )
                {
                    request = JSON.stringify({
                        action : "get_comment_form",
                        api_pass : common.settings.api_pass
                    });

                    api.SendRequest( request, function( data )
                    {
                        comment_form.html( data.content );
                        callback();
                    }, onError, onNetworkError );
                }
                else
                    callback();
            }
        };
        /*************************************************************/
        self.Register = function( username, email, password, button, alert_container, cbUpdateUserPanel )
        {
            common.util.PutSpinner( button );

            request = JSON.stringify({
                action : "register",
                api_pass : common.settings.api_pass,
                usr : username,
                eml : email,
                pwd : password
            });

            api.SendRequest( request, onSuccess, onError, onNetworkError );

            function onSuccess( data )
            {
                $.fancybox.close(); // Close login form
                common.util.RemoveSpinner( button );

                common.util.message.Box( 'Thank You!!!', 'You are now registered and logged in', 2 );

                cbUpdateUserPanel( data );
            }
            function onError( err_code, err_message )
            {
                // Remove previous errors
                $('#register_form .alert').remove();

                // show Alert
                common.util.message.Alert( err_message, 'warning', alert_container, false );
                common.util.RemoveSpinner( button );
            }
            function onNetworkError()
            {
                // Remove previous errors
                $('#register_form .alert').remove();

                // show Alert
                common.util.message.Alert( 'An error acquired. Please, try again' , 'warning', alert_container, false );
                common.util.RemoveSpinner( button );
            }
        }
        /*************************************************************/
        // FANCYBOX CLOSE callback
        self.RunCallbacks = function( logged_in )
        {
            while( self.login_callbacks.length > 0 )
            {
                callback = self.login_callbacks.pop();
                callback( logged_in );
            }
        }
        /*************************************************************/
        // private
        /*************************************************************/
        /*************************************************************/
    }

    return new LoginReg();
});
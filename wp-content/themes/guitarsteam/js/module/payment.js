/**
 * Created by TriLineSoft on 27.04.2017.
 */

define( ['jquery', 'common', 'api', 'stripe'], function( $, common, api )
{
    // OBJECT
    function Payment()
    {
        var self = this;
        var cart_total = 0;

        self.cart = new Cart();
        self.stripe = new stripe();
        self.OnPaymentResult = null;

        /*************************************************************/
        // public
        /*************************************************************/
        self.Init = function() {};
        /*************************************************************/
        self.ShowForm = function( song, cbResult )
        {
            self.stripe.OnPaymentResult = cbResult;
            self.OnPaymentResult = cbResult;
            var form = $( '.preload #payment_window' );

            // Setup cart
            self.cart.AddSong( song );

            // Setup form
            form.find('#payment_submit').click( function()
            {
                common.util.PutSpinner( $('#payment_submit'));
                $('#payment_window .alert_box .alert').slideUp( 100 );
                Checkout();
            });

            // Show up
            $.fancybox.open({
                src : '#payment_window',
                type : 'inline',
                opts : {
                    afterLoad: function () {
                        self.stripe.SetupElements();
                    }
                } // opts
            });
        };
        /***********************  PRIVATE  ***************************/
        function Checkout()
        {
            var songs = self.cart.GetSongs();
            var song_id_array = Array();

            songs.forEach( function( song ){
                song_id_array.push( song.id );
            });

            // if stripe
            self.stripe.Checkout( song_id_array, OnPaymentResult );

            function OnPaymentResult( result )
            {
                self.OnPaymentResult( result ); // call SongManager

                if ( result )
                    self.cart.Clear();
            }
        }
        /*************************************************************/

        /*************************************************************/
        //*****************     CART     ***************************
        /*************************************************************/
        function Cart()
        {
            var self = this;
            var songs = Array();
            var services = Array();
            var coupons = Array();

            Init();

            /************************  PUBLIC  ***************************/
            self.AddSong = function( song )
            {
                var found = false;

                if ( songs.every( isUnique ) ) // validate presense of new song in cart
                {
                    songs.push( song );

                    AddToPaymentForm( song );
                    SetCartCookie();
                }

                function isUnique( cart_song )
                {
                    return cart_song.id != song.id;
                }
            }
            /*************************************************************/
            self.RemoveSong = function( song_id, remove_node )
            {
                if ( typeof remove_node == 'undefined' )
                    remove_node = true;

                songs = songs.filter( function( song )
                {
                    if ( song.id == song_id )
                    {
                        if ( remove_node )
                            var node = $('#cart_song_' + song_id).remove();

                        return false;
                    }
                    else
                        return true;
                });

                SetCartCookie();

                // set total
                $('#payment_window .cart_total').text( self.CalculateCartTotal() );
            }
            /*************************************************************/
            self.Clear = function()
            {
                // songs
                songs.forEach( function( song )
                {
                    $('#cart_song_' + song.id).remove();
                });

                songs = [];
                SetCartCookie();

                // set total
                $('#payment_window .cart_total').text( 0 );

                services = [];
                coupons = [];
            }
            /*************************************************************/
            self.GetSongs = function()
            {
                return songs;
            }
            /*************************************************************/
            self.CalculateCartTotal = function()
            {
                var total = 0;

                songs.forEach( function( song, index )
                {
                    total += song.price;
                });

                return total;
            }
            /*********************  PRIVATE  *****************************/
            function Init()
            {
                // Set hooks
                $('.shopping_cart .song .remove').on( 'click', function ( e )
                {
                    var song_div = $( e.target ).closest('.song');
                    var song = common.CreateNewSongData( song_div );

                    self.RemoveSong( song.id, false );
                    song_div.remove();
                });
            }
            /*************************************************************/
            function SetCartCookie()
            {
                var song_id_array = Array();
                songs.forEach( function( song )
                {
                    song_id_array.push( song.id );
                });

                var str_cart_songs = JSON.stringify( song_id_array );

                $.cookie( 'guitarsteam-shopping-cart', str_cart_songs, { path: '/'});
            }
            /*************************************************************/
            function AddToPaymentForm( new_song_data ) // show cart contents on payment form
            {
                var div_cart = $('#payment_window .shopping_cart');
                var song_blank = $('#cart_song_blank');

                // prepare new node
                var new_song = song_blank.clone( true );
                new_song.removeAttr( 'id' );
                new_song.attr( 'id', 'cart_song_' + new_song_data.id );

                // set data
                $( new_song.find('.name')[0] ).text( new_song_data.name );
                $( new_song.find('.player_name')[0] ).text( new_song_data.player_name );
                $( new_song.find('.price')[0] ).text( new_song_data.price );
                new_song_data.SetDataToNode( new_song );

                // add node
                div_cart.prepend( new_song );
                new_song.removeClass('hidden');
                new_song.slideDown( 200 );

                // set total
                $('#payment_window .cart_total').text( self.CalculateCartTotal() );
            }
            /*************************************************************/
        }

        /*************************************************************/
        //*****************     STRIPE     ***************************
        /*************************************************************/
        function stripe()
        {
            var self = this;
            var stripe_obj = Stripe('pk_test_Z2qnVGXGJWfV9eSdmz6Kobjq');

            self.card = null;
            self.song_id_array = null;
            self.OnPaymentResult = null;
            self.payment_result = false;

            self.SetupElements = function()
            {
                // Create an instance of Elements
                var elements = stripe_obj.elements();

                var style = {
                    base: {
                        color: '#32325d',
                        lineHeight: '24px',
                        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                        fontSmoothing: 'antialiased',
                        fontSize: '16px',
                        '::placeholder': {
                            color: '#444'
                        }
                    },
                    invalid: {
                        color: '#fa755a',
                        iconColor: '#fa755a'
                    }
                };

                // Create an instance of the card Element
                self.card = elements.create( 'card', {style: style} );

                // Add an instance of the card Element into the `card-element` <div>
                self.card.mount('#card_number');

                /*self.card.on('change', function(event) {
                    self.PaymentResult(event);
                });*/
            }
            /*************************************************************/
            self.Checkout = function( song_id_array, cbResult )
            {
                self.song_id_array = song_id_array;
                self.OnPaymentResult = cbResult;
                stripe_obj.createToken( self.card ).then( self.PaymentResult, self.onError );
            }
            /*************************************************************/
            self.PaymentResult = function( result )
            {
                if ( result.token )
                {
                    // Send to server
                    request = JSON.stringify({
                        action : "song_payment",
                        api_pass : common.settings.api_pass,
                        token : result.token,
                        song_id : self.song_id_array
                    });

                    api.SendRequest( request, onSuccess, onError, onNetworkError );

                    function onSuccess( data )
                    {
                        self.OnPaymentResult( true ); // call Payment
                        self.payment_result = true;

                        // Close current fancyBox instance
                        parent.jQuery.fancybox.getInstance().close();

                        common.util.message.Box( 'Thank You!!!', 'The song is loading...', 2 );
                        common.util.RemoveSpinner( $( '#payment_window' ).find('#payment_submit'));
                    }
                    function onError( error_code, error_msg )
                    {
                        error_msg = error_msg || '';
                        var message = 'An error acquired';

                        if ( error_msg != '' )
                            message = error_msg;

                        common.util.message.Alert( message, 'warning', $('#payment_window .alert_box' ), false );
                        common.util.RemoveSpinner( $('#payment_submit'));
                    }
                    function onNetworkError()
                    {
                        common.util.message.Alert( 'A network error acquired.', 'warning', $('#payment_window .alert_box' ), false );
                        common.util.RemoveSpinner( $('#payment_submit'));
                    }
                }
                else
                if (result.error)
                {
                    common.util.message.Alert( 'Invalid card number', 'warning', $('#payment_window .alert_box' ), false );
                    common.util.RemoveSpinner( $('#payment_submit'));
                }
            }
            /*************************************************************/
            self.onError = function()
            {
                common.util.message.Alert( 'A network error acquired', 'warning', $('#payment_window .alert_box' ), false );
                common.util.RemoveSpinner( $('#payment_submit'));
            }
            /*************************************************************/
        } // our stripe object

    } // Payment object

    return new Payment();

    //##########################  HANDLERS  ###########################
});
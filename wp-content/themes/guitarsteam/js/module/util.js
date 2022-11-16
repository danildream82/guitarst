/**
 * Created by Igor on 05.04.2017.
 */

define( ['jquery'], function( $ ){

    /*************************************************************/
    // OBJECT
    /*************************************************************/
    function Message()
    {
        var self = this;
        var message_box_active = false;

        /*************************************************************/
        self.Box = function( title, text, timeout, callback /*=false*/ ) // timeout - sec
        {
            callback = callback || false;
            timeout = timeout || 0;

            if ( message_box_active )
                return;
            else
                message_box_active = true;

            var box = $('.preload .message_box');

            $( box.find( '.box_title' )[0] ).text( title );
            $( box.find( '.box_content' )[0] ).text( text );

            $.fancybox.open({
                src : '#message_box',
                type : 'inline',
                opts : {
                    afterClose : function()
                    {
                        message_box_active = false;

                        if ( callback )
                            callback();
                    }
                }
            });

            if ( timeout )
            {
                setTimeout( function(){
                    $.fancybox.close();
                }, timeout * 1000 );
            }

            return box;
        };
        /*************************************************************/
        // alert_class = success, info, warning, danger
        self.Alert = function( text, alert_class, container, append )
        {
            if ( typeof append == 'undefined' )
                append = true;

            var alert = $( $('.preload .alert')[0] ).clone();
            alert.hide();

            var alerts = $( container ).find( '.alert' );

            // Remove previous errors
            if ( alerts.length > 0 )
            {
                alerts.effect( 'blind', {mode: 'hide'}, 200, function ()
                {
                    alerts.remove();
                    SetupAlert();
                });
            }
            else
            {
                SetupAlert();
            }

            //------------------------------------------------------------
            function SetupAlert()
            {
                // Setup alert
                alert.addClass( alert_class );
                alert.find('span').html( text );
                $( alert.find('.close')[0] ).click( CloseAlert );

                // show alert
                if ( append )
                    container.append( alert );
                else
                    container.prepend( alert );

                alert.effect( 'blind', {mode: 'show'}, 200 );
            }
        };
        //------------------------------------------------------------
        self.RemoveAlerts = function( container )
        {
            var alerts = container.find( '.alert' );

            alerts.effect(  'blind', {mode: 'hide'}, 200, function ()
            {
                alerts.remove();
            });
        };
        //------------------------------------------------------------
        function CloseAlert(e)
        {
            e.stopPropagation();

            var alert = $(e.target).parent('.alert');
            alert.effect(  'blind', {mode: 'hide'}, 200, function ()
            {
                alert.remove();
            });
        };
        //------------------------------------------------------------
        $(document).on( 'click', '.alert .close', function (e) {
            CloseAlert(e);
        });
    } // Message

    /******************************************************************************************/
    /******************************************************************************************/
    // OBJECT
    function Util() {
        var self = this;

        /*************************************************************/
        // public
        /*************************************************************/

        self.message = new Message();

        /*************************************************************/
        // Functions
        /*************************************************************/
        self.PutSpinner = function(obj, omit_width )
        {
            var width = obj[0].getBoundingClientRect().width;
            var height = obj[0].getBoundingClientRect().height;

            // Save text
            obj.data('text', obj.html());
            obj.html( $($('.preload #round_spinner')[0]).html() );
            obj.outerHeight( height );
            if ( typeof omit_width == 'undefined' || omit_width == false )
                obj.outerWidth( width );
            obj.disabled = true;
        }
        //------------------------------------------------------------
        self.RemoveSpinner = function(obj, text, keep_width )
        {
            text = text || false;
            keep_width = keep_width || false;

            if ( text )
                obj.html( text );
            else
                obj.html( obj.data('text'));

            if ( keep_width )
            {
                var width = obj.width();
                obj.width( width );
            }
            else
                obj.width( 'auto' );

            obj.height( 'auto' );

            obj.disabled = false;

            // button.html( button.data( 'title' ));
            // button.outerWidth('');
        }
        /*************************************************************/
        self.DisableAnimation = function( obj )
        {
            obj.addClass( 'no_animation' );
        };
        /*************************************************************/
        self.EnableAnimation = function ( obj )
        {
            obj.removeClass( 'no_animation' );
        };
        /*************************************************************/
        self.DisableAllAnimations = function()
        {
            self.DisableAnimation( $('body > .background-img'));
            self.DisableAnimation( $('.swiper-slide .slide-bg'));
            self.DisableAnimation( $('.swiper-slide.slide1 .right-slider-panel'));
            self.DisableAnimation( $('.swiper-slide.slide1 .right-slider-panel .main-slide-image'));
            self.DisableAnimation( $('.swiper-slide.slide1 .center-slider-panel .main-slider-button a.slider-button-arrow'));
            self.DisableAnimation( $('.swiper-slide.slide2 .right-slider-panel'));
            self.DisableAnimation( $('.swiper-slide.slide2 .center-slider-panel .main-slider-button a.slider-button-arrow'));
        };
        /*************************************************************/
        self.EnableAllAnimations = function()
        {
            self.EnableAnimation( $('body > .background-img'));
            self.EnableAnimation( $('.swiper-slide .slide-bg'));
            self.EnableAnimation( $('.swiper-slide.slide1 .right-slider-panel'));
            self.EnableAnimation( $('.swiper-slide.slide1 .right-slider-panel .main-slide-image'));
            self.EnableAnimation( $('.swiper-slide.slide1 .center-slider-panel .main-slider-button a.slider-button-arrow'));
            self.EnableAnimation( $('.swiper-slide.slide2 .right-slider-panel'));
            self.EnableAnimation( $('.swiper-slide.slide2 .center-slider-panel .main-slider-button a.slider-button-arrow'));
        };
        /*************************************************************/
        self.ScrollTo = function( obj, msec, v_shift )
        {
            v_shift = v_shift | 0;

            $('html, body').animate({
                scrollTop: obj.offset().top + v_shift
            }, msec );
        };
        /*************************************************************/
    };

    return new Util();
});

/**
 * Created by Igor on 04.04.2017
 */

requirejs.config({
    baseUrl: jsBaseUrl,
    // shim goes here
    paths: {
        jquery: 'lib/jquery.min',
        jquery_ui: 'lib/jquery-ui.min',
        jquery_cookie: 'lib/jquery.cookie',
        fancybox: 'lib/fancybox/jquery.fancybox.min',
        swiper: 'lib/swiper.min',
        stripe: 'https://js.stripe.com/v2/?1',
        stripe2: 'https://js.stripe.com/v3/?1',
        vocabulary: 'module/vocabulary',
        common: 'module/common',
        util: 'module/util',
        api: 'module/api',
        login_reg: 'module/login-reg',
        payment: 'module/payment',
        song_manager: 'module/song-manager',

        // polyfill
        midi_js          : 'lib/player/midi-js/build/MIDI.min',
        midi_base64      : 'lib/player/midi-js/inc/shim/Base64binary',
        midi_webAudioApi : 'lib/player/midi-js/inc/shim/WebAudioAPI',
        // midi.js package
        midi_audioDetect : 'lib/player/midi-js/js/midi/audioDetect',
        midi_gm          : 'lib/player/midi-js/js/midi/gm',
        midi_loader      : 'lib/player/midi-js/js/midi/loader',
        midi_audiotag    : 'lib/player/midi-js/js/midi/plugin.audiotag',
        midi_webaudio    : 'lib/player/midi-js/js/midi/plugin.webaudio',
        midi_webmidi     : 'lib/player/midi-js/js/midi/plugin.webmidi',

        // 3D libs
        three : 'lib/player/three.min',
        tween : 'lib/player/Tween',
        stats : 'lib/player/stats.min',
        touch_punch : 'lib/player/touch-punch.min',

        // Player
        player_3d           : 'player/gplayer',      // comment off of these for obfuscated version
        player_midi_func    : 'player/midi-func',
        player_sound        : 'player/sound-system',
        player_core         : 'player/midi-player',
        player_utils        : 'player/utils',
        player_gui          : 'player/player-gui',
        player_dispatch     : 'player/player-dispatch'

        // player_dispatch     : 'player/player'            // uncomment one for obfuscated code
        // player_dispatch     : 'player/player-obfuscated'
        // player_dispatch     : 'player/player-renamed'
    },
    map: {
        '*': {
            three: 'three-glue'
        },
        'three-glue': {
            three: 'three'
        }
    },
    shim: {
        'fancybox' : { deps : ['jquery'] },
        'jquery_cookie' : { deps : ['jquery'] },
        'swiper' : {
            exports: 'Swiper',
            deps : ['jquery']
        },
        'stripe' : {
            exports: 'Stripe',
            deps: [ 'stripe2' ]
        },

        'midi_js' : {
            exports: 'MIDI',
            deps: [
                'midi_base64',
                'midi_webAudioApi',

                'midi_audioDetect',
                'midi_gm',
                'midi_loader',
                'midi_audiotag',
                'midi_webaudio',
                'midi_webmidi'
            ]
        },

        'player_dispatch' : {
            exports : 'PlayerDispatch',
            deps: [
                'midi_js',

                'three',
                'tween',
                'stats',
                'touch_punch',
                'player_gui' // comment out for obfuscated version
            ]
        },
        'player_gui' : { // comment out for obfuscated version
            exports : 'PlayerGUI',
            deps: [
                'player_3d',
                'jquery',
                'jquery_ui',
                'player_midi_func',
                'player_sound',
                'player_core',
                'player_utils'
            ]
        }
    },
    waitSeconds: 200,
    urlArgs: function(id, url)
    {
        var args = 'v=1';

        if ( url.indexOf('main.js') !== -1)
            args = 'v=2';

        if ( url.indexOf('player.js') !== -1)
            args = 'v=2';
        if ( url.indexOf('three.min.js') !== -1)
            args = 'v=2';
        if ( url.indexOf('MIDI.min.js') !== -1)
            args = 'v=2';

        if ( url.indexOf('common.js') !== -1)
            args = 'v=1';
        if ( url.indexOf('util.js') !== -1)
            args = 'v=1';
        if ( url.indexOf('login-reg.js') !== -1)
            args = 'v=1';
        if ( url.indexOf('song-namager.js') !== -1)
            args = 'v=1';
        if ( url.indexOf('api.js') !== -1)
            args = 'v=1';
        if ( url.indexOf('vocabulary.js') !== -1)
            args = 'v=1';
        if ( url.indexOf('payment.js') !== -1)
            args = 'v=1';

        return ( url.indexOf('?') === -1 ? '?' : '&') + args;
    }
});

/*************************************************************/
// Init particular page
/*************************************************************/
require( ['jquery', 'common', 'api', 'login_reg', 'jquery_ui', 'jquery_cookie'], function( $, common, api, login_reg )
{
    //##############################################################
    // JS ENTRY POINT
    //##############################################################
    $(document).ready(function ()
    {
        // Song array
        var path_name = $(location).attr('pathname');

        // Front Page
        if ( path_name == '/' || path_name == '' )
            Page_Front();
        else
        if ( path_name.indexOf('/song/') != -1 )
            Page_Song();
        else
        // Contact Form
        if ( path_name == '/contact-us' || path_name == '/contact-us/' )
        {
            Page_ContactForm();
        }

        Page_Any();
    });

    //##############################################################
    function Page_Front()
    {
        require( ['jquery', 'common', 'swiper', 'song_manager'], function( $, common, Swiper ) {

            <!-- Initialize Swiper JS -->
            var swiper = new Swiper('.swiper-container', {
                spaceBetween: 0,                  // Distance between slides in px
                effect: 'fade',
                speed: 1200,
                keyboard: {
                    enabled: true
                },
                centeredSlides: true,
                loop: true,                         // Loop on/off
                autoplay: {
                    delay: 8000,                    // Delay between slides
                    disableOnInteraction: false    // True - Autoplay stops after user swipes
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                    dynamicBullets: true           // If you use bullets pagination with a lot of slides,
                },                                  // will keep only few bullets visible
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev'
                }
            });
        });
    }
    /*************************************************************/
    function Page_SongArray()
    {
        if ( $('.songs-block').length > 0 )
        {
            require( ['jquery', 'common', 'song_manager'], function( $, common, song_manager )
            {
                var filter_panel = $('.search-filters');

                var curr_page = parseInt( $($('.songs-block .pagination .page-numbers.current')[0]).text());

                song_manager.current_page = curr_page;

                // set hooks
                $(document).on( 'submit', '#search-form', function (e) // поиск
                {
                    e.preventDefault();

                    // Получаем фильтры
                    var search_params = {
                        key : $('#search-song').val(),
                        lvl : $('#search-form input[name=complexity]:checked').val(),
                        gnr : $('#search-genre').val(),
                        page: 1
                    };
                    search_params.lvl = search_params.lvl ? search_params.lvl : '';
                    search_params.lvl = search_params.lvl == 'on' ? '' : search_params.lvl;

                    // Определяем нужно ли делать засечку в истории браузера
                    var push_history = false;
                    if ( song_manager.SearchParamsDiffer( search_params ))
                        push_history = true;

                    song_manager.GetSongArray( push_history, search_params );
                });
                $(document).on( 'click', '.pagination li a', function(e) // пейджер
                {
                    e.preventDefault();

                    var target = $(e.target); // ссылка
                    var li = target.parent(); // список

                    // определяем действие
                    if ( target.hasClass( 'prev' ))
                    {
                        song_manager.current_page--;
                    }
                    else
                    if ( target.hasClass( 'next' ))
                    {
                        song_manager.current_page++;
                    }
                    else // номер страницы
                    {
                        song_manager.current_page = parseInt( target.text());
                    }

                    song_manager.search_params.page = song_manager.current_page;
                    song_manager.GetSongArray( true );
                });
                //-----------------------------------
                window.onpopstate = function( event )
                {
                    if ( event.state != 'undefined' && event.state && event.state.params )
                    {
                        if ( song_manager.SearchParamsDiffer( event.state.params ))
                        {
                            SetupFilters( event.state.params );
                            song_manager.GetSongArray( false, event.state.params, false );
                        }
                    }
                };
                $(document).on( 'click', '.song-tags .btn-genre', function(e) // ссылка на жанр
                {
                    e.preventDefault();
                    var link = $( e.target );
                    var selected = $('#search-genre option:selected');

                    if ( selected.text() != link.text() )
                    {
                        $('#search-genre').children().removeAttr("selected");

                        // ищем индекс жанра в списке
                        var options = $('#search-genre').children();
                        var index = 0;

                        for ( var i = 0; i < options.length; i++ )
                        {
                            var option = $( options[i]);
                            var name = option.attr( 'name' );

                            if ( name == link.text())
                            {
                                index = i;
                                break;
                            }
                        }

                        // Разворачиваем панель фильтров
                        filter_panel.slideDown( 300 );

                        // Сбрасываем все параметры
                        ResetSearchFilters();

                        // выставляем жанр
                        document.getElementById('search-genre').selectedIndex = index;

                        $('#search-form').submit();
                    }
                });
                $(document).on( 'click', '.search-bottom .btn-filter', function(e) // панель фильтров
                {
                    e.preventDefault();

                    if ( filter_panel.is(':visible') )
                        filter_panel.slideUp( 200 );
                    else
                        filter_panel.slideDown( 300 );
                });
                $(document).on( 'click', '.song-array .play', function(e) // запуск проигрывателя
                {
                    var play_box = $( e.target.closest('.play') );
                    song_manager.PlayClick( play_box );
                });
                $(document).on( 'click', '.userpanel .btn_play', function(e) // запуск текущей песни
                {
                    song_manager.PlayCurrentSong();
                });
                // Сброс текста в строке поиска
                $(document).on( "change paste keyup", '#search-song' ,function (e) {
                    if ( $(e.target).val() )
                        $('.clear-search-text').addClass( 'active' );
                    else
                        $('.clear-search-text').removeClass( 'active' );
                });
                $(document).on( 'click', '.clear-search-text', function(e) {
                    $('#search-song').val('');
                    $('.clear-search-text').removeClass( 'active' );
                });

                function ResetSearchFilters()
                {
                    $('#search-song').val('');
                    $('#search-complexity').find( 'input' ).attr( 'checked', false );
                }

                // Устанавливаем начальную точку истории браузера
                var init_history = false;

                if ( typeof window.performance != 'undefined' )
                {
                    if (
                        window.performance.navigation.type == 0 && // страница не была перезагружена
                        window.history.length == 2 )
                    {
                        init_history = true;
                    }
                }
                else
                    init_history = true;

                if ( init_history )
                    window.history.pushState( { search_page: song_manager.current_page }, '' ); // первую устанавливаем точку истории, чтобы не путать ее с запуском плеера при получении события onpopstate
            });
        }

        //------------------------------------------------------------------------------------
        function SetupFilters( params )
        {
            var filter_key = $('#search-song');

            if ( params.key )
                filter_key.val( params.key );
            else
                filter_key.val( '' );

            if ( params.lvl )
                $('#search-complexity input[name="complexity"][value="' + params.lvl + '"]').prop('checked', true);
            else
                $('#search-complexity input.stars-reset').prop('checked', true);

            if ( params.gnr )
                $('#search-genre option[value="' + params.gnr + '"]').prop('selected', true);
            else
                $('#search-genre option[name="any"]').prop('selected', true);
        }
    }
    /*************************************************************/
    function Page_Song()
    {
        require( ['jquery', 'common', 'song_manager'], function( $, common, song_manager )
        {
            $(document).on( 'click', '.song-options .play', function(e) // запуск проигрывателя
            {
                var play_box = $( e.target.closest('.play') );
                song_manager.PlayClick( play_box );
            });
            $(document).on( 'click', '.userpanel .btn_play', function(e) // запуск текущей песни
            {
                song_manager.PlayCurrentSong();
            });
            $(document).on( 'click', '.try-free--button', function(e) // разворачивание панели с другими песнями
            {
                e.preventDefault();
                e.stopImmediatePropagation();

                var free_songs = $('.song-content .try-free');

                if ( free_songs.is(":visible"))
                    free_songs.slideUp( 300 );
                else
                    free_songs.slideDown( 300 );
            });
        });
    }
    /*************************************************************/
    function Page_ContactForm()
    {
        $('.contact-form-submit').click( function(e)
        {
            var btn = $( e.target );
            var form = $('.contact-form');
            var name = $(form.find('input[name=user_name]')[0]);
            var email = $(form.find('input[name=user_email]')[0]);
            var subject = $(form.find('input[name=subject]')[0]);
            var message = $(form.find('textarea[name=message]')[0]);
            var alert = $(form.find('.alert')[0]);

            alert.slideUp( 100 );

            DisableControls();

            // Validate input
            if ( name.val() == '' || email.val() == '' || subject.val() == '' || message.val() == '' )
            {
                alert.html( '<span>Please, fill all required fields</span>' );
                alert.removeClass( 'success' );
                alert.addClass('danger');
                alert.slideDown( 200 );

                EnableControls();
                return;
            }

            var request = JSON.stringify({
                action : 'contact_form_send',
                api_pass : common.settings.api_pass,
                user_name : name.val(),
                user_email : email.val(),
                subject : subject.val(),
                message : message.val()
            });

            api.SendRequest( request, onSuccess, onError, onNetworkError );

            function onSuccess( data )
            {
                name.val('');
                email.val('');
                subject.val('');
                message.val('');

                alert.html('Message sent.</br>Thank you! We\'ll get back to you as soon as possible.' );
                alert.removeClass( 'danger' );
                alert.addClass('success');
                alert.slideDown( 200 );

                EnableControls();
            }
            function onError( error_code, error_message )
            {
                alert.text( error_message );
                alert.removeClass( 'success' );
                alert.addClass('danger');
                alert.slideDown( 200 );

                EnableControls();
            }
            function onNetworkError()
            {
                alert.text( 'A network error occured' );
                alert.removeClass( 'success' );
                alert.addClass('danger');
                alert.slideDown( 200 );

                EnableControls();
            }

            function DisableControls()
            {
                // btn.html( '<i class="fa fa-spinner fa-spin fa-2x"></i>' );
                common.util.PutSpinner( btn );
                name.prop('disabled', true);
                email.prop('disabled', true);
                subject.prop('disabled', true);
                message.prop('disabled', true);
            }
            function EnableControls()
            {
                name.prop('disabled', false);
                email.prop('disabled', false);
                subject.prop('disabled', false);
                message.prop('disabled', false);
                btn.text('Send');
            }
        });
    }
    /*************************************************************/
    // ANY PAGE SCRIPT
    function Page_Any()
    {
        Page_SongArray();

        /************************   LOGIN & REGISTER WINDOWS  *************************/
        $(document).on("submit",".fancybox-container #login_form",function(event)
        {
            // stop form from submitting normally
            event.preventDefault();
            event.stopImmediatePropagation();

            alert_container = $($('.fancybox-container')[0]);
            alert_container = alert_container.find('.bottom');
            button = $($(event.target).find('#login_btn')[0]);

            require( ['jquery', 'common', 'api'], function( $, common, api )
            {
                login_reg.Login( $("#user_login").val(),
                                 $("#user_pass").val(),
                                 $('#rememberme').is(':checked'),
                                 button,
                                 alert_container,
                                 common.UpdateUserHeadPanel );
            });
        });
        //--------------------------------------------------------------------------------
        $(document).on("submit",".fancybox-container #register_form",function(event)
        {
            // stop form from submitting normally
            event.preventDefault();
            event.stopImmediatePropagation();

            alert_container = $($('.fancybox-container')[0]);
            alert_container = alert_container.find('.bottom');
            button = $($(event.target).find('#register_btn')[0]);

            // Password verification
            // Agreement vrification

            var username = $("#username").val();
            var email = $("#user_email").val();
            var password = $("#user_pass").val();
            var pass_repeat = $("#user_pass_repeat").val();
            var agreement = $('#agreement').is(':checked');

            // Validate credentials
            if ( email == '' )
            {
                common.util.message.Alert( 'Please, enter your email', 'warning', alert_container, false );
                return;
            }
            if ( password == '' )
            {
                common.util.message.Alert( 'Please, enter password', 'warning', alert_container, false );
                return;
            }
            if ( password != pass_repeat )
            {
                common.util.message.Alert( 'Password doesn\'t match', 'warning', alert_container, false );
                return;
            }
            if ( agreement == false )
            {
                common.util.message.Alert( 'You have to read and agree to terms of service', 'warning', alert_container, false );
                return;
            }

            // Send request
            login_reg.Register( username, email, password, button, alert_container, common.UpdateUserHeadPanel );
        });
        //--------------------------------------------------------------------------------
        // switch to register
        $(document).on("click",".fancybox-container #login_form .register_link",function(event)
        {
            event.preventDefault();
            event.stopImmediatePropagation();

            $('.fancybox-container .fancybox-button--left').click();
            return false;
        });
        //--------------------------------------------------------------------------------
        // switch to login
        $(document).on("click",".fancybox-container #register_form .login_link",function(event)
        {
            event.preventDefault();
            event.stopImmediatePropagation();

            $('.fancybox-container .fancybox-button--right').click();
            return false;
        });
        //*****************************  MOBILE MENU  ************************************
        $(document).on( 'click', '#mobile-menu-toggle', function(e)
        {
            e.preventDefault();

            var menu = $('#mobile-menu');

            if ( menu.is(':visible'))
                menu.slideUp( 200 );
            else
                menu.slideDown( 300 );
        });

        /*******************************  FANCYBOX  *************************************/
        // for popup windows
        /*$('.fancybox-form').fancybox({
            wrapCSS : 'fancybox-form',
            scrolling : 'yes',
            afterClose: function(){
                $(window).trigger('fancyboxClosed'); // bind to this event to handle callbacks
            }
        });
        //--------------------------------------------------------------------------------
        // for login / reg windows
        $('.auth_form').fancybox({
            wrapCSS : 'fancybox-form',
            scrolling : 'yes',
            'showCloseButton': false,
            helpers: {
                overlay: {
                    locked: false
                }
            },
            afterClose: function(){
                common.login_reg.onAuthFancyboxClose();
            }
        });
        /********************************************************************************/

    } // Page_Any
    /*************************************************************/
});
// Guitar Midi Player interface implementation
//
// ATTENTION!!!
// Callback functions which may get called from the player class
// are marked with "GUI_" prefix

//*************************************************************************************
// Init
function PlayerGUI()
{
    var self = this;
    var player = null;

    self.cbExit = function (){}; // выставляется в player-dispatch.js
    self.exit_requested = false; // выставляется в true, когда юзер нажимает кнопку close

    // Параметры управления
    var params = {
        volume : null,
        speed : null,
        loop_start : null,
        loop_end : null,
        loop_repeat : false,
        meter : false
    };

    var local_storage_name = {
        volume : 'player_volume',
        speed : 'player_speed',
        loop_start : 'player_loop_start',
        loop_end : 'player_loop_end',
        loop_repeat : 'player_loop_repeat',
        meter : 'player_meter'
    };

    var controls = {
        volume : $( "#slider-volume" ),
        speed : $( "#slider-tempo" ),
        progress : $( "#slider-progress" ),
        range : $( "#slider-range" ), // двойной ползунок фрагмента
        loop_start : $('.player_controls .button.loop_bounds.start'),
        loop_end : $('.player_controls .button.loop_bounds.end'),
    };

    var is_full_screen = false;
    var load_progress = null;
    var load_progress_label = null;

    var alrt = $('.player_container .alert-wrapper');

    //*************************************************************************************
    self.InitPlayerInterface = function( Player, curr_song_is_set /*=false*/ )
    {
        player = Player;

        LoadParamsFromStorage( curr_song_is_set );

        // Range slider
        controls.range.slider({
            range: true,
            min: 0,
            max: player.GetTotalBackbeats(),
            values: [ params.loop_start, params.loop_end ],
            slide: function( event, ui )
            {
                if ( ui.values[0] != params.loop_start )
                {
                    SetLoopStart( ui.values[0] );
                }
                if ( ui.values[1] != params.loop_end )
                {
                    SetLoopEnd( ui.values[1], true, false );
                }
            }
        });

        // Progress slider
        controls.progress.slider({
            range: "min",
            value: params.loop_start,
            min: 0,
            max: player.GetTotalBackbeats(),
            slide: function( event, ui ){
                player.SetCurrentBeat( ui.value );
            }
        });

        // Volume
        controls.volume.slider({
            orientation: "vertical",
            min: 1,
            max: 128,
            value: params.volume,
            slide: function( event, ui ){
                player.SetVolume( ui.value - 1 );
                params.volume = ui.value;
                window.localStorage.setItem( local_storage_name.volume, params.volume );
            }
        });

        // Speed
        controls.speed.slider({
            orientation: "vertical",
            min: 0,
            max: 100,
            value: params.speed,
            slide: function( event, ui ){
                player.SetSpeed( ui.value );
                params.speed = ui.value;
                window.localStorage.setItem( local_storage_name.speed, params.speed );
            }
        });

        // устанавливаем ползунок прогресса
        controls.range.slider( 'values', 0, params.loop_start );
        self.Beat( params.loop_start );
        player.SetCurrentBeat( params.loop_start );

        // Состояние кнопок фрагмента
        if ( params.loop_start > 0 )
            controls.loop_start.addClass( 'enabled' );
        if ( params.loop_end < player.GetTotalBackbeats())
            controls.loop_end.addClass( 'enabled' );

        KeepFocusOnCanvas();

        // $('.slider .ui-slider-handle').draggable(); // jquey Touch Punch lib
    }
    //*************************************************************************************
    function LoadParamsFromStorage( curr_song_is_set ) // берем текущие параметры из local storage
    {
        // Общие параметры
        params.volume = window.localStorage.getItem( local_storage_name.volume );
        params.meter  = window.localStorage.getItem( local_storage_name.meter );
        params.loop_repeat  = window.localStorage.getItem( local_storage_name.loop_repeat );

        // Song dependent params
        if ( curr_song_is_set )
        {
            params.speed        = window.localStorage.getItem( local_storage_name.speed );
            params.loop_start   = window.localStorage.getItem( local_storage_name.loop_start );
            params.loop_end     = window.localStorage.getItem( local_storage_name.loop_end );
        }
        else
        {
            params.speed        = 100;
            params.loop_start   = 0;
            params.loop_end     = player.GetTotalBackbeats();
        }

        // Дефолт
        params.volume       = params.volume != null ? parseInt( params.volume ) : 64;
        params.meter        = params.meter == '1' ? true : false;
        params.speed        = params.speed != null ? parseInt( params.speed ) : 100;
        params.loop_start   = params.loop_start ? parseInt( params.loop_start ) : 0;
        params.loop_end     = params.loop_end ? parseInt( params.loop_end ) : player.GetTotalBackbeats();
        params.loop_repeat  = params.loop_repeat == '1' ? true : false;

        // Устанавливаем значения
        player.SetVolume( params.volume );
        player.SetSpeed( params.speed );
        SetMeter( params.meter );
        SetLoopRepeat( params.loop_repeat );
        SetLoopStart( params.loop_start );
        SetLoopEnd( params.loop_end );
    }
    //*************************************************************************************
    self.IsInFullScreenMode = function()
    {
        return is_full_screen;
    };
    //*************************************************************************************
    $(document).on("click", ".player_controls .panel", function(event)
    {
        event.stopPropagation();
    });
    //*************************************************************************************
    $(document).on("click", ".player_controls", function(event)
    {
        event.stopPropagation();
        self.GUI_PlayPause();

        KeepFocusOnCanvas();
    });
    //*************************************************************************************
    $(document).on("click", ".player_controls .button.playback", function(event)
    {
        player.PlayFromStart();
        KeepFocusOnCanvas()
    });
    //*************************************************************************************
    $(document).on("click", ".player_controls .button.rewind_backward", function(event)
    {
        StepLeft();
        KeepFocusOnCanvas()
    });
    //*************************************************************************************
    $(document).on("click", ".player_controls .button.rewind_forward", function(event)
    {
        event.stopPropagation();
        StepRight();
        KeepFocusOnCanvas()
    });
    //*************************************************************************************
    $(document).on("click", ".player_controls .close", function(event)
    {
        self.Close();
    });
    //********************************  TEMPO  ********************************************
    $(document).on("click", ".tempo .slow", function(event) // НЕ ИСПОЛЬЗУЕТСЯ
    {
        //$('.tempo .bpm span').text(( 2 - player.tempo ).toFixed(1));
    });
    $(document).on("click", ".tempo .fast", function(event) // НЕ ИСПОЛЬЗУЕТСЯ
    {
        //$('.tempo .bpm span').text(( 1 - player.tempo + 1 ).toFixed(1));
    });
    //*************************************************************************************
    $(document).on("keydown", ".player_container", function( e )
    {
        var stop_event = false;

        switch ( e.keyCode )
        {
            case 32: // space bar
                e.preventDefault();
                self.GUI_PlayPause();
                stop_event = true;
                break;

            case 13: // Enter
                e.preventDefault();
                player.PlayFromStart();
                stop_event = true;
                break;

            case 37: // left arrow  (backbeat left)
                StepLeft();
                stop_event = true;
                break;

            case 39: // right arrow  (backbeat right)
                StepRight();
                stop_event = true;
                break;

            case 38: // up arrow  (tempo up)
                var slider = $( "#slider-tempo" );
                var position = slider.slider('value') + 20;
                position = position <= slider.slider( 'option', 'max' ) ? position : slider.slider( 'option', 'max' );
                slider.slider('value', position );

                player.SetSpeed( position );
                stop_event = true;
                break;

            case 40: // down arrow  (tempo down)
                var slider = $( "#slider-tempo" );
                var position = slider.slider('value') - 20;
                position = position >= slider.slider( 'option', 'min' ) ? position : slider.slider( 'option', 'min' );
                slider.slider('value', position );

                player.SetSpeed( position );
                stop_event = true;
                break;

            case 188: // "<" - начало фрагмента
                $('.player_controls .button.loop_bounds.start').click();
                break;
            case 190: // "<" - конец фрагмента
                $('.player_controls .button.loop_bounds.end').click();
                break;
        }

        if ( stop_event )
        {
            e.stopPropagation();
            e.preventDefault();
        }
    });
    //*************************************************************************************
    $(document).on("click", ".player_controls .button.loop_bounds.start", function(event)
    {
        var progress = $( "#slider-progress" ).slider( "option", "value" );

        if ( params.loop_start > 0 )
        {
            controls.range.slider( 'values', 0, 0 ); // устанавливаем ползунок
            SetLoopStart( 0, false );       // Передаем параметр в плеер

            controls.loop_start.removeClass( 'enabled' );
        }
        else
        {
            controls.range.slider( 'values', 0, progress );  // устанавливаем ползунок
            SetLoopStart( progress );               // передаем параметр в плеер

            controls.loop_start.addClass( 'enabled' );
        }

        KeepFocusOnCanvas();
    });
    //*************************************************************************************
    $(document).on("click", ".player_controls .button.loop_bounds.end", function(event)
    {
        var progress = $( "#slider-progress" ).slider( "option", "value" );

        if ( params.loop_end < player.GetTotalBackbeats())
        {
            controls.range.slider( 'values', 1, player.GetTotalBackbeats() ); // устанавливаем ползунок
            SetLoopEnd( player.GetTotalBackbeats(), false, false );  // Передаем параметры в плеер

            controls.loop_end.removeClass( 'enabled' );
        }
        else
        {
            var backbeat = SetLoopEnd( progress, true, true );
            controls.range.slider( 'values', 1, backbeat ); // устанавливаем ползунок

            controls.loop_end.addClass( 'enabled' );
        }

        KeepFocusOnCanvas();
    });
    //*************************************************************************************
    $(document).on("click", ".player_controls .button.repeat", function(event)
    {
        if ( params.loop_repeat )
        {
            SetLoopRepeat( false, $(this));
        }
        else
        {
            SetLoopRepeat( true, $(this));
        }

        KeepFocusOnCanvas();
    });
    //*************************************************************************************
    $(document).on("click", ".player_controls .button.meter", function(event)
    {
        if ( params.meter ) // enabled
        {
            SetMeter( false, $(this));
        }
        else
        {
            SetMeter( true, $(this));
        }

        KeepFocusOnCanvas();
    });
    //*************************************************************************************
    $(document).on("click", "#loop-solid img", function(event) // НЕ ИСПОЛЬЗУЕТСЯ
    {
        if ($(this).hasClass('loop-off'))
        {
            $('#loop-solid .loop-off').hide();
            $('#loop-solid .loop-on').show();

            player.SetLoopSolid( true );
        }
        else
        {
            $('#loop-solid .loop-on').hide();
            $('#loop-solid .loop-off').show();

            player.SetLoopSolid( false );
        }

        KeepFocusOnCanvas();
    });
    //*************************************************************************************
    function ResetState()
    {
        // Кнопка Loop Bounds
        $('.button.loop_bounds').removeClass( 'enabled' );
        $('.button.loop_bounds').removeClass( 'enabled' );
    }
    //*************************************************************************************
    function SetMeter( enabled, btn )
    {
        btn = btn ? btn : $('.player_controls .button.meter');

        if ( enabled )
        {
            btn.addClass('enabled');
            params.meter = true;
            player.EnableMeter( true );
        }
        else
        {
            btn.removeClass('enabled');
            params.meter = false;
            player.EnableMeter( false );
        }

        window.localStorage.setItem( local_storage_name.meter, params.meter ? 1 : 0 );
    }
    //*************************************************************************************
    function SetLoopRepeat( enabled, btn )
    {
        btn = btn ? btn : $('.player_controls .button.repeat');

        if ( enabled )
        {
            btn.addClass('enabled');
            params.loop_repeat = true;
            player.EnableRepeat( true );
        }
        else
        {
            btn.removeClass('enabled');
            params.loop_repeat = false;
            player.EnableRepeat( false );
        }

        window.localStorage.setItem( local_storage_name.loop_repeat, params.loop_repeat ? 1 : 0 );
    }
    //*************************************************************************************
    function StepLeft()
    {
        var slider = $( "#slider-progress" );
        var position = slider.slider('value') - 8;
        position = position >= 0 ? position : 0;
        slider.slider('value', position );

        player.SetCurrentBeat( position );
    }
    //*************************************************************************************
    function StepRight()
    {
        var slider = $( "#slider-progress" );
        var position = slider.slider('value') + 8;
        position = position <= slider.slider( 'option', 'max' ) ? position : slider.slider( 'option', 'max' );
        slider.slider('value', position );

        player.SetCurrentBeat( position );
    }
    //*************************************************************************************
    function SetLoopStart( val, move_pointer )
    {
        if ( typeof move_pointer == 'undefined' )
            move_pointer = true;

        player.SetLoopStart( val, move_pointer );
        params.loop_start = val;

        window.localStorage.setItem( local_storage_name.loop_start, params.loop_start );
    }
    //*************************************************************************************
    function SetLoopEnd( progress, move_pointer, shift_pointer )
    {
        move_pointer = move_pointer || false;

        var backbeat = player.SetLoopEnd( progress, move_pointer, shift_pointer );
        params.loop_end = backbeat;

        window.localStorage.setItem( local_storage_name.loop_end, params.loop_end );

        return backbeat;
    }
    //*************************************************************************************
    // Callback
    //*************************************************************************************
    self.SetLoadProgress = function( value )
    {
        load_progress.progressbar( "value", value );
    }
    //*************************************************************************************
    self.RefreshLoadScreen = function()
    {
        self.SetLoadProgress( 0 );

        alrt.find('.btn-retry').hide();
        alrt.hide();
    }
    //*************************************************************************************
    self.GUI_PlayPause = function() // Play/Pause button click
    {

        var panels = $('.visible_in_pause');

        if ( panels.is(':visible') == false || player.playing ) // играет и мы останавливаем
        {
            panels.fadeIn( 200 );

            // Кнопка Play/Pause
            $('.button-play-pause').removeClass('pause');
            $('.button-play-pause').addClass('play');

            player.Pause();
        }
        else
        if ( is_full_screen && panels.is(':visible') && player.playing == false ) // остановлен и мы запускаем
        {
            panels.fadeOut( 200 );

            $('.button-play-pause').removeClass('play');
            $('.button-play-pause').addClass('pause');

            player.Play();
        }
    }
    //*************************************************************************************
    // Смещение прогрессбара
    self.Beat = function( backbeat )
    {
        // Set progress slider
        controls.progress.slider( "value", backbeat );
    }
    //*************************************************************************************
    self.GoFullScreen = function( cb_Result ) // возвращает в коллбэк true / false
    {
        if ( is_full_screen )
        {
            cb_Result( true );
            return;
        }

        $('.load_screen').show();

        Utils.goFullScreen( document.getElementById("player_container"));

        // FULLSCREEN
        $(document).on( 'mozfullscreenchange webkitfullscreenchange fullscreenchange', function (e)
        {
            var full_screen = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen; // This will return true or false depending on if it's full screen or not.

            if ( full_screen )
            {
                if ( is_full_screen == false )
                {
                    is_full_screen = true;

                    if (
                        typeof screen != 'undefined' &&
                        typeof screen.orientation != 'undefined' &&
                        typeof screen.orientation.lock != 'undefined' )
                    {
                        screen.orientation.lock( 'landscape' );
                    }

                    InitLoader();

                    // Заставка
                    cb_Result( true, true );
                }
            }
            else
            {
                if ( is_full_screen )
                {
                    if (
                        typeof screen != 'undefined' &&
                        typeof screen.orientation != 'undefined' &&
                        typeof screen.orientation.unlock != 'undefined' )
                    {
                        screen.orientation.unlock();
                    }

                    is_full_screen = false;
                    self.Close();
                    cb_Result( true, false );
                }
            }
        });

        $(document).on( 'mozfullscreenerror webkitfullscreenerror fullscreenerror', function ()
        {
            is_full_screen = false;
            self.Close();
            cb_Result( false );
        });
    }
    //*************************************************************************************
    function InitLoader()
    {
        ResetState();

        SetCanvasSize();
        $('#player_container').fadeIn(300);

        // Set progress
        if ( load_progress == null )
        {
            load_progress = $('#load-progress');
            load_progress_label = $('#load-progress .progress-label');

            load_progress.progressbar({
                value: false,
                change: function() {

                    var val = load_progress.progressbar( "value" );

                    load_progress_label.text( load_progress.progressbar( "value" ) + "%" );
                },
                complete: function() {
                    load_progress_label.text( "Complete!" );
                }
            });
        }

        // Did You Know?
        var tip_text = $('.preload .load_screen_tip').text();
        $('.load_screen .didyouknow-text span').text( tip_text );
    }
    //*************************************************************************************
    self.ShowAlert = function( alert_class, text, onClose, onRetry )
    {
        var alrt_box = alrt.find( '.alert' );

        alrt.find('span').text( text );

        // Выставляем класс
        alrt_box.removeClass( 'success' );
        alrt_box.removeClass( 'info' );
        alrt_box.removeClass( 'warning' );
        alrt_box.removeClass( 'danger' );
        alrt_box.addClass( alert_class );

        // Добавляем кнопки
        var btn_close = alrt_box.find( '.return' );
        var btn_retry = alrt_box.find( '.retry' );

        btn_close.click( function (e)
        {
            e.preventDefault();
            onClose();
        });

        if ( onRetry )
        {
            btn_retry.click( function (e)
            {
                e.preventDefault();
                onRetry();
            });
            btn_retry.show();
        }
        else
            btn_retry.hide();

        alrt.fadeIn( 300 );
    };
    //*************************************************************************************
    self.SetSongInfo = function( song_data )
    {
        $('.player_controls .song_thumb').attr( 'src', song_data.thumb );
        $('.player_controls .description .song_name').text( song_data.name );
        $('.player_controls .description .song_artist').text( song_data.artist );
    };
    //*************************************************************************************
    self.Close = function()
    {
        if (player)
            self.GUI_PlayPause();

        if (is_full_screen)
        {
            if ( player == null || player.is_ready == false )
                self.exit_requested = true;

            $('#player_container').hide();
            alrt.hide();

            Utils.exitFullScreen();
        }
        else
        {
            self.cbExit(); // коллбэк
        }
    };
    //*************************************************************************************
    function SetCanvasSize()
    {
        var canvas = document.getElementById("canvas");
        var width = screen.width;
        var height = screen.height;

        if ( canvas.width < window.innerWidth)
             canvas.width = window.innerWidth;

        if ( canvas.height < window.innerHeight)
             canvas.height = window.innerHeight;
    }
    //*************************************************************************************
    function KeepFocusOnCanvas()
    {
        $('#canvas').focus().blur( function (e){
            $(e.target).focus();
        });
    }
    //*************************************************************************************
}

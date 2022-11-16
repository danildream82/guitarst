/**
 * Created by Igor on 21.10.2017.
 *
 * Этот объект инкапсулирует все детали проигрывателя
 * - Midi-Player
 * - Player GUI
 * - Song Loader
 */

// Здесь перечислены все этапы загрузки в процентах. В сумме должно быть 100
var player_load_progress = {

    tabs        : 10, //   10
    soundfont   : 40, //   30
    neck_1      : 56, //   16
    neck_2      : 72, //   16
    font        : 89, //   17
    fly_strips  : 90, //   1
    bckg_img    : 100 //   10
};

var PlayerDispatcher = function ()
{
    var self = this;

    var player = null;
    var GUI = new PlayerGUI();

    self.current_song = null;
    self.loading_song_id = 0;   // ID песни, которая загружается в данный момент
    self.loading_progress = 0;  // здесь суммируется процент загрузки плеера

    var loaded_from_storage = false;

    // эти переменные выставляются снаружи
    self.voc = null; // словарь

    // Коллбэки
    self.cbLoadSongData = null; // задается в SongManager
    self.cbLoadResult = null;   // передается в LoadSong
    self.cbExit = null;         // там же

    //*****************************************************************************************
    self.LoadSong = function( song_id, curr_song_data, OnLoad, OnExit )
    {
        self.loading_song_id = song_id;
        self.cbLoadResult = OnLoad;
        GUI.cbExit = OnExit;
        self.loading_progress = 0;

        // Если данные песни были получены из local storage
        if ( curr_song_data )
        {
            self.current_song = curr_song_data;
            loaded_from_storage = true;
        }
        else
            loaded_from_storage = false;

        InitPlayer( function( result )
        {
            if ( result ) // плеер запущен
            {
                if ( player.InitTabs( self.current_song.tabs ))
                    onPlayerReady( true );
                else
                {
                    GUI.ShowAlert( 'danger', self.voc.player_init_failed, OnCloseLoadScreen, OnLoadRetry );
                }
            }
            else // не удалось получить полный экран
            {
                GUI.Close();
                self.cbLoadResult( false );
            }

            //----------------------------------------------------------------------
            // Плеер запущен, табы заряжены
            function onPlayerReady( result )
            {
                if ( GUI.exit_requested == false )
                {
                    if ( result )
                    {
                        GUI.InitPlayerInterface( player, loaded_from_storage );
                        GUI.SetSongInfo( self.current_song );

                        // callbacks
                        player.cb_PlayPause = GUI.GUI_PlayPause;
                        player.cb_Beat = GUI.Beat;

                        player.InitState();

                        // Снятие заставки
                        $('.load_screen').fadeOut( 500, function ()
                        {
                            if ( GUI.exit_requested == false )
                                GUI.GUI_PlayPause(); // запуск проигрывания сразу после загрузки
                            else
                                GUI.exit_requested = false;
                        });

                        self.cbLoadResult( true );
                    }
                    else
                    {
                        player = null;
                        GUI.ShowAlert( 'danger', self.voc.network_err, OnCloseLoadScreen, OnLoadRetry );
                    }
                }
                else
                    GUI.exit_requested = false;
            }
        });
    }
    //*****************************************************************************************
    self.IsInFullScreenMode = function()
    {
        return GUI.IsInFullScreenMode();
    };
    //*****************************************************************************************
    function InitPlayer( cbResult )
    {
        console.log( 'Init Player' );

        // Переход в полноэкранный режим
        GUI.GoFullScreen( OnFullScreen );

        function OnFullScreen( result, running )
        {
            if ( result ) // успешно
            {
                if ( running )
                {
                    GUI.SetLoadProgress( 0 );

                    // ЗАГРУЖАЕМ ТАБЫ
                    if ( self.current_song && self.loading_song_id == self.current_song.id ) // чтобы два раза не грузить одно и то же
                        onSuccess( self.current_song );
                    else
                    {
                        console.log( 'Load Tabs' );

                        // Коллбэк в SongManager
                        self.cbLoadSongData(
                            self.loading_song_id,
                            onSuccess,
                            function onError( error_code, error_msg )
                            {
                                if ( typeof error_code == 'undefined' || typeof error_msg == 'undefined' )
                                    error_msg = self.voc.error + ' ' + self.voc.try_again;

                                GUI.ShowAlert( 'danger', error_msg, OnCloseLoadScreen, OnLoadRetry );
                            },
                            function onNetworkError()
                            {
                                GUI.ShowAlert( 'danger', self.voc.network_err, OnCloseLoadScreen, OnLoadRetry );
                            });
                    }

                    // Табы загружены успешно
                    function onSuccess( data )
                    {
                        self.current_song = data;

                        DisplayLoadProgress( player_load_progress.tabs );

                        // Проверяем загрузку плеера
                        if ( player == null || player.is_ready == false ) // не загружен
                        {

                            console.log( 'Load MIDI' );

                            // Загружаем плеер
                            MIDI.loadPlugin({
                                soundfontUrl: jsPlayerLibUrl + "soundfont/",
                                // instrument: "acoustic_guitar_nylon",
                                instrument: "acoustic_guitar_steel",
                                onprogress: function ( state, percent )
                                {
                                    var soundfont_percent = player_load_progress.soundfont - player_load_progress.tabs;
                                    var progress = player_load_progress.tabs + Math.floor( percent * soundfont_percent ); // от tabs до soundfont

                                    if ( percent == 1 )
                                    {
                                        self.loading_progress = progress; // 40%
                                        console.log( 'LOAD PROGRESS: ' + self.loading_progress );
                                    }
                                    else

                                        console.log( 'state = ' + state );
                                    console.log( 'LOAD PROGRESS processing percent: ' + percent );
                                    console.log( 'LOAD PROGRESS processing progress: ' + progress );

                                    GUI.SetLoadProgress( progress ); // здесь данные приходят иначе, поэтому мы не можем использовать DisplayLoadProgress()

                                },
                                onsuccess: function ()
                                {
                                    console.log( 'MIDI loaded' );

                                    onMidiLoadSuccess();
                                },
                                onerror: function ()
                                {
                                    console.log( 'MIDI loading error' );
                                    GUI.ShowAlert( 'danger', self.voc.network_err, OnCloseLoadScreen, OnLoadRetry );
                                }
                            }); // load MIDI

                            //----------------------------------------------------------------------------------------------
                            function onMidiLoadSuccess()
                            {
                                if ( player == null )
                                {
                                    // Init the player
                                    player = new Player( DisplayLoadProgress );
                                }

                                // Запуск
                                if ( GUI.exit_requested == false )
                                {
                                    player.Init( function ( result ) // загрузка моделей происходит именно здесь
                                    {
                                        if ( result )
                                            cbResult( true );
                                        else
                                        {
                                            if ( GUI.exit_requested == false )
                                            {
                                                console.log( 'Player loading error' );
                                                GUI.ShowAlert( 'danger', self.voc.network_err, OnCloseLoadScreen, OnLoadRetry );
                                            }
                                            else
                                                GUI.exit_requested = false;
                                        }
                                    });
                                }
                                else
                                    GUI.exit_requested = false;
                            }
                            //----------------------------------------------------------------------------------------------
                        } // плеер не загружен
                        else
                        {
                            DisplayLoadProgress( player_load_progress.soundfont );

                            cbResult( true ); // плеер загружен
                        }
                    } // сфддифсл - табы загружены
                } // плеер запущен
            } // fullscreen
            else
            {
                cbResult( false ); // не удалось получить полный экран
            }
        }
    }
    //*****************************************************************************************
    function DisplayLoadProgress( percent, scope )
    {
        // LOADING PROGRESS
        self.loading_progress = percent;
        GUI.SetLoadProgress( self.loading_progress );

        console.log( 'LOAD PROGRESS: ' + self.loading_progress + ' - ' + scope );
    }
    //*****************************************************************************************
    // Callbacks from alert
    //*****************************************************************************************
    function OnLoadRetry(e)
    {
        GUI.RefreshLoadScreen();
        self.LoadSong( self.loading_song_id, self.cbLoadResult );
    }
    //*****************************************************************************************
    function OnCloseLoadScreen(e)
    {
        GUI.Close();
        self.cbLoadResult( false );
    }
    //*****************************************************************************************
}

var PlayerDispatch = new PlayerDispatcher();
/**
 * Created by TriLineSoft on 05.04.2017.
 */

define("three-glue", ["three", "stats"], function ( three, stats )
{
    window.THREE = three;
    window.Stats = stats;
    return three;
});

// define("three-glue", [ "stats"], function ( stats )
// {
//     window.Stats = stats;
//     return three;
// });

define( ['jquery', 'common', 'api', 'login_reg', 'payment', 'player_dispatch' ], function( $, common, api, login_reg, payment, PlayerDispatch )
{
    // OBJECT
    function SongManager()
    {
        var self = this;

        self.current_page = 1;
        self.player_launched = false;
        self.first_launch = true;
        self.search_params = {};
        self.busy = false;

        var songs_container_height = 0;
        var search_queue = 0; // запрос в очереди

        PlayerDispatch.cbLoadSongData = LoadSongData; // коллбэк для загрузки табов
        PlayerDispatch.cbExit = null;
        PlayerDispatch.voc = common.vocabulary;

        // var times = 1; // FOR TEST

        /*************************************************************/
        // public
        /*************************************************************/
        self.GetSongArray = function( push_history, params, refreshed )
        {
            refreshed = typeof refreshed != 'undefined' ? refreshed : false;

            // Предотвращаем повторный запуск
            if ( self.busy && refreshed == false )
            {
                search_queue = params;
                return;
            }

            // Получаем параметры поиска
            if ( params )
                self.search_params = params;

            if ( refreshed == false )
                DisableInterface();

            // Убираем пейджеры
            RemovePagers( function ()
            {
                // Убираем предыдущие песни
                RemoveSongs( DoSearch );
            });

            function DoSearch()
            {
                SearchInQueue();

                // GA event
                SearchGaEvent( self.search_params );

                // Compile request
                var request = JSON.stringify({
                    action : 'song_search',
                    api_pass : common.settings.api_pass,
                    search_params : {
                        page :          self.search_params.page,
                        keyword :       self.search_params.key,
                        complexity :    self.search_params.lvl,
                        genre :         self.search_params.gnr
                    }
                });

                api.SendRequest( request, onSuccess, onError, onNetworkError );

                function onSuccess( data )
                {
                    if ( SearchInQueue() )
                    {
                        DoSearch(); // повторный поиск уже новой страницы
                        return;
                    }

                    // Количество найденных песен
                    $('.form-search .songs_found_num').text( data.total );

                    DisplaySongs( data.search_results, data.pager, function ()
                    {
                        if ( SearchInQueue() )
                        {
                            self.GetSongArray( push_history, self.search_params, true ); // повторный поиск уже новой страницы
                            return;
                        }

                        EnableInterface();
                    });
                }
                function onError( error_code, error_msg )
                {
                    if ( typeof error_code == 'undefined' || typeof error_msg == 'undefined' )
                        error_msg = common.vocabulary.error + ' ' + common.vocabulary.try_again;

                    common.util.message.Alert( error_msg, 'warning', $($('.page-content')[0]), false );
                    EnableInterface();
                }
                function onNetworkError()
                {
                    common.util.message.Alert( common.vocabulary.network_err,
                        'warning', $($('.page-content')[0]), false );
                    EnableInterface();
                }
                //---------------------------------------------------------------------------
            }
            //---------------------------------------------------------------------------
            function DisableInterface()
            {
                // Убираем алерты
                common.util.message.RemoveAlerts( $('#search-marker'));

                // Блокируем кнопку поиска
                var btn_text = $('.btn-search span');
                btn_text.addClass( 'icon-hidden' );
                common.util.PutSpinner( btn_text );

                self.busy = true;

                // Фиксируем размер контейнера
                var val = $('.song-array').outerHeight();
                $('.song-array').css( 'min-height', val + 'px' );
                $('.song-array').css( 'position', 'relative' );

                // Включаем движущийся фон
                $('.background-dark').fadeOut( 200 );
                $('.background-gradient').fadeIn( 200 );
            }
            //---------------------------------------------------------------------------
            function EnableInterface()
            {
                // Включаем кнопку поиска
                var btn_text = $('.btn-search span');
                btn_text.removeClass( 'icon-hidden' );
                common.util.RemoveSpinner( btn_text );

                self.busy = false;

                // Затеняем фон
                $('.background-dark').fadeIn( 200 );
                $('.background-gradient').fadeOut( 200 );

                if ( self.first_launch == false )
                {
                    // Скрол до пейджера
                    common.util.ScrollTo( $('.songs-block'), 1000, -30 );
                }

                self.first_launch = false;

                // Set history
                if ( push_history )
                {
                    var hist_link = SERVER_ENVIRONMENT == 'LIVE' ? 'https://guitarsteam.com' : 'http://guitarsteam.test';
                    var glue = '?';

                    if ( self.search_params.page > 1 )
                        hist_link += '/page/' + self.search_params.page + '/';
                    if ( self.search_params.key )
                    {
                        hist_link += '?key=' + self.search_params.key;
                        glue = '&';
                    }
                    if ( self.search_params.lvl )
                    {
                        hist_link += glue + 'lvl=' + self.search_params.lvl;
                        glue = '&';
                    }
                    if ( self.search_params.gnr )
                    {
                        hist_link += glue + 'gnr=' + self.search_params.gnr;
                        glue = '&';
                    }

                    hist_link = encodeURI( hist_link );

                    window.history.pushState(
                        { params : self.search_params },
                        '',
                        hist_link
                    );
                }
            }
            //---------------------------------------------------------------------------
            function RemovePagers( callback )
            {
                // Фиксируем высоту контейнера
                var songs_block = $('.songs-block');
                var height = songs_block[0].getBoundingClientRect().height; // 375.563; 383.563 было бы идеально
                songs_block.css( 'height', height );

                var pagers = $('.pagination_container');
                var pager_not_found = true;

                // Прячем пейджеры
                if ( pagers.length > 0 )
                {
                    $.each( pagers, function ( index, value )
                    {
                        var container = $( value );
                        var pager     = container.find('.pagination');
                        var height    = pager[0] ? pager[0].getBoundingClientRect().height : 0;

                        if ( pager.length > 0 )
                        {
                            container.css( 'height', height );

                            pager.fadeOut( 200, function ()
                            {
                                pager.remove();

                                if ( index >= pagers.length - 1 )
                                    callback();
                            });

                            pager_not_found = false;
                        }
                    }); // each

                    if ( pager_not_found )
                        callback();
                }
                else
                    callback();
            }
            //---------------------------------------------------------------------------
            function RemoveSongs( callback )
            {
                var song_timeout = 0;
                var songs = $('.song-array .song-array-element');
                var songs_num = songs.length;

                // Прячем песни
                if ( songs_num > 0 )
                {
                    var effect = ChooseEffect();

                    // Animate
                    $.each( songs, function ( index, value )
                    {
                        var song = $( value );
                        var content = $( song.find('.panel')[0] );

                        var height_1 = song[0].getBoundingClientRect().height + 5;
                        var height_2 = content[0].getBoundingClientRect().height + 5;

                        // Фиксируем высоту элементов
                        song.css( 'height', height_1 >= height_2 ? height_1 : height_2 );

                        setTimeout(function()
                        {
                            content.effect( effect, {mode: 'hide'}, 100, function ()
                            {
                                if ( index >= songs_num - 1 )
                                {
                                    songs.remove();
                                    callback();
                                }
                            });
                        }, song_timeout );

                        song_timeout += 70;
                    });
                }
                else
                    callback();
            }
            //---------------------------------------------------------------------------
            function SearchInQueue()
            {
                var ret = false;

                // если уже был задан другой запрос
                if (
                    search_queue && search_queue.page != self.search_params.page ||
                    search_queue && search_queue.key != self.search_params.key ||
                    search_queue && search_queue.lvl != self.search_params.lvl ||
                    search_queue && search_queue.gnr != self.search_params.gnr )
                {
                    self.search_params = search_queue;
                    search_queue = 0;
                    ret = true;
                }

                return ret;
            }
            //---------------------------------------------------------------------------
            function SearchGaEvent( search_params )
            {
                if ( SERVER_ENVIRONMENT == 'LIVE' && refreshed == false )
                {
                    var log = 'Search: ';
                    if ( search_params.key )
                        log += search_params.key + '; ';
                    if ( search_params.lvl )
                        log += 'level: ' + search_params.lvl + '; ';
                    if ( search_params.gnr )
                        log += 'genre: ' + search_params.gnr + '; ';
                    if ( search_params.page > 0 )
                        log += 'page: ' + search_params.page;

                    gtag(
                        'event',
                        'start', {
                            'event_category': 'Song Search',
                            'event_label': log
                        });
                }
            }
            //---------------------------------------------------------------------------
        }
        /*************************************************************/
        self.SearchParamsDiffer = function( params )
        {
            var ret = false;

            if (
                self.search_params.page != params.page ||
                self.search_params.key != params.key ||
                self.search_params.lvl != params.lvl ||
                self.search_params.grn != params.gnr )
            {
                ret = true;
            }

            return ret;
        };
        /*************************************************************/
        self.PlayClick = function( play_box )
        {
            var song = common.CreateNewSongData( play_box );

            if ( common.IsUserLoggedIn() )
            {
                if ( song.price > 0 ) // if song needs to be bought
                {
                    // PAYMENT form
                    payment.ShowForm( song, OnSongPaid );
                }
                else
                    PlaySong( song.id );
            }
            else // user not logged in
            {
                if ( song.price == 0 ) // free song
                    PlaySong( song.id );
                else
                {
                    // Login callback
                    var callbacks = new Array( function (){
                        // this will result in play start or payment form appearence
                        if ( common.IsUserLoggedIn() )
                            self.PlayClick( play_box );
                    });

                    // Show Login form
                    login_reg.AuthBox( 'window_login', callbacks );
                }
            }
        }
        /*************************************************************/
        self.PlayCurrentSong = function()
        {
            // проверяем наличие табов в local storage
            var song = GetSongFromStorage();

            if ( song )
            {
                PlaySong( song.id, song );
            }
            else // не найдено
            {
                // перематываем на поиск
                $('html, body').animate({
                    scrollTop : ($('#search-form').offset().top)
                }, 500);
            }
        }
        /*************************************************************/
        function PlaySong( song_id, curr_song_data )
        {
            if ( typeof curr_song_data == 'undefined' || curr_song_data == false )
                curr_song_data = GetSongFromStorage();

            if ( curr_song_data && song_id != curr_song_data.id )
                curr_song_data = false;

            common.util.DisableAllAnimations();

            // Засекаем время
            var player_start_time = Math.round( Date.now()/1000 );

            // Launch Player
            PlayerDispatch.LoadSong(
                song_id,
                curr_song_data,
                function( result ) // Load result
                {
                    // если удалось получить полный экран
                    if ( result )
                    {
                        self.player_launched = true;

                        // GA event
                        if ( SERVER_ENVIRONMENT == 'LIVE' )
                        {
                            gtag(
                                'event',
                                'start', {
                                    'event_category': 'GPlayer',
                                    'event_label': PlayerDispatch.current_song.name + '; id=' + PlayerDispatch.current_song.id
                                });
                        }
                    }
                    else
                    if ( result == false && PlayerDispatch.IsInFullScreenMode() == false )
                        common.util.message.Box( common.vocabulary.error, common.vocabulary.fullscree_unavailable );
                },
                function () // Exit
                {
                    if ( self.player_launched )
                    {
                        // GA event
                        var player_stop_time = Math.round( Date.now()/1000 );

                        if ( SERVER_ENVIRONMENT == 'LIVE' )
                        {
                            var time = player_stop_time - player_start_time;

                            if ( time < 30 )                    // 30 сек
                                time = ' < 30 sek';
                            else
                            if ( time >= 30 && time < 60 )      // до минуты
                                time = ' < 1 min';
                            if ( time >= 60 && time < 180 )     // до 3 мниут
                                time = ' < 3 min';
                            if ( time >= 180 && time < 300 )    // до 5 минут
                                time = ' < 5 min';
                            if ( time >= 300 && time < 600 )    // до 10 минут
                                time = ' < 10 min';
                            else
                            if ( time >= 600 )                  // больше 10 минут
                                time = ' > 10 min === GOAL!!!';

                            gtag(
                                'event',
                                'exit', {
                                    'event_category': 'GPlayer',
                                    'event_label': 'time: ' + time
                            });
                        }

                        common.util.EnableAllAnimations();

                        ScrollToSongs();
                    }
                    else // плеер закрыли на заставке
                    {
                        if ( SERVER_ENVIRONMENT == 'LIVE' )
                        {
                            gtag(
                                'event',
                                'exit on load', {
                                    'event_category': 'GPlayer'
                                });
                        }

                        common.util.EnableAllAnimations();

                        ScrollToSongs();
                    }
                }
            );

            function ScrollToSongs()
            {
                // Скрол до пейджера
                var songs = $('.songs-block');
                if ( songs.length > 0 )
                    common.util.ScrollTo( songs, 10, -30 );

                self.player_launched = false;
            }
        }
        /*************************************************************/
        function GetSongFromStorage()
        {
            var song_data = window.localStorage.getItem( 'player_song' );
            var song = false;

            if ( song_data ) // если песня найдена
            {
                try
                {
                    song = JSON.parse( song_data );
                }
                catch( e )
                {
                    alert( 'parse failed' );
                }
            }

            return song;
        }
        /*************************************************************/
        function LoadSongData( song_id, onSuccess, onError, onNetworkError )
        {
            // FOR TEST
            // if ( times > 0 )
            // {
            //     var song = common.CreateNewSongData( $('#panel_song_' + song_id ));
            //
            //     var song_data = {
            //         id : song.id,
            //         name : song.name,
            //         artist : song.original_artist,
            //         tabs : TABS_EYE_OF_THE_TIGER,
            //         tip : 'Hello'
            //     };
            //
            //     // Выставляем Tip
            //     $('.preload .load_screen_tip').text( song_data.tip );
            //
            //     onSuccess( song_data );
            // }
            // else
            // {
            //     times++;
            //     onError( 'action_failed', 'The song is not available any more' );
            // }
            //
            // return;

            // Compile request
            var request = JSON.stringify({
                action : 'song_download',
                api_pass : common.settings.api_pass,
                post_id : song_id
            });

            api.SendRequest( request, onApiSuccess, onError, onNetworkError );

            function onApiSuccess( data )
            {
                var song = common.CreateNewSongData( $('#panel_song_' + song_id +' .play' ));

                var song_data = {
                    id : song.id,
                    name : song.name,
                    artist : song.original_artist,
                    thumb : song.thumb,
                    tabs : data.tabs,
                    tip : data.tip
                };

                // Выставляем Tip
                $('.preload .load_screen_tip').text( song_data.tip );

                // Сохраняем данные в local storage
                window.localStorage.setItem( 'player_song', JSON.stringify( song_data ));

                onSuccess( song_data );
            }
        }
        /*************************************************************/
        // private
        /*************************************************************/
        function DisplaySongs( song_array, pager, callback )
        {
            if ( song_array === false || song_array.length == 0 ) // песен не найдено
            {
                common.util.message.Alert( common.vocabulary.songs_not_found, 'info', $('.songs-block'), false );
                return;
            }

            // Отпускаем высоту контейнера
            $('.songs-block').css( 'height', 'auto' );

            var song_timeout = 0;
            var effect = ChooseEffect();

            song_array.forEach( function( song_data, index )
            {
                var new_song_box = $( $('.preload .song-array-element')[0] ).clone();
                new_song_box.hide();

                setTimeout(function()
                {
                    // Вставляем данные
                    SetupSong( new_song_box, song_data );

                    $('.song-array').append( new_song_box );

                    new_song_box.effect( effect, {mode: 'show'}, 200, function ()
                    {
                        if ( index >= song_array.length - 1 )
                            SetupPagers( pager, function () {
                                callback()
                            });
                    });
                }, song_timeout );

                song_timeout += 70;
            });

            //--------------------------------------------------------
            function SetupPagers( pager, callback )
            {
                var pagers = $('.pagination_container');

                if ( pager == '' )
                {
                    callback();
                    return;
                }

                $.each( pagers, function ( index, value )
                {
                    var container = $( value );

                    container.append( pager );

                    var pager_element = container.find('.pagination');

                    pager_element.hide();

                    if ( index >= pagers.length - 1 ) // последний элемент
                    {
                        pager_element.fadeIn( 300, function () {
                            callback();
                        });
                    }
                    else
                        pager_element.fadeIn( 300 );
                }); // each

                // Определяем текущую страницу
                var pager = $($('.songs-block .pagination')[0]);
                var link_tag = pager.find('li span.current');
                var link = link_tag.text();

                self.current_page = parseInt( link ) || 1;
            }
            //--------------------------------------------------------
            function SetupSong( song_box, song_data )
            {
                // create song class
                var song = common.CreateNewSongData();
                song.InitWithRawData( song_data );
                song_box.attr( 'id', 'panel_song_' + song_data.id );

                // Pending song
                if ( typeof song_data.pending != 'undefined' && song_data.pending == 1 )
                {
                    var panel = song_box.find( '.panel-content' );
                    panel.addClass( 'pending-song' );
                }

                // Thumbnail
                var thumbs = $( song_box.find('.cover'));
                thumbs.css( 'background', 'url(' + song_data.thumb + ') no-repeat center / cover' );

                // Title
                var titles = $( song_box.find('.title h2') );
                titles.text( song_data.name + ' - ' + song_data.original_artist );

                // Link
                var link = $( song_box.find('.title a') );  // название песни
                link.attr( 'href', song_data.url );
                link = $( song_box.find('.cover a') );      // картинка
                link.attr( 'href', song_data.url );

                // User image
                // var node = $( song_box.find('.user-image')[0] );
                // node.attr( 'src', song_data.user_image );

                // Player name
                // var names = $( song_box.find('.player-name'));
                // names.text( song_data.player_name );

                // Genre
                var genre_containers = song_box.find( '.song-tags' );

                song_data.genre.forEach( function( genre )
                {
                    // Берем первый контейнер в качестве шаблона
                    var genre_tmpl = $( song_box.find( '.song-tags' )[0] ).find( '.tmpl' ). clone();

                    genre_tmpl.text( genre );
                    genre_tmpl.removeClass( 'tmpl' );
                    genre_tmpl.removeClass( 'hidden' );

                    genre_containers.append( genre_tmpl );
                });

                // Popularity
                var nodes = $( song_box.find('.popularity'));
                SetStars( nodes, song_data.popularity );

                // Complexity
                node = $( song_box.find('.complexity'));
                SetStars( node, song_data.complexity );

                // Price / Play button
                var play_box = $( song_box.find('.play'));
                var button = $( play_box.find('.play_btn'));
                var price  = $( play_box.find('.price'));

                song.SetDataToNode( play_box );

                if ( song_data.price > 0 )
                {
                    button.hide();
                    price.show();

                    $( price.find('.amount')).text( song_data.price );
                }
                else
                {
                    button.show();
                    price.hide();
                }
            }
            //--------------------------------------------------------
            function SetStars( nodes, level )
            {
                $.each( nodes, function ( index, node )
                {
                    node = $( node );
                    var stars = node.find('.star');

                    for ( var i = 0; i < stars.length; i++ )
                    {
                        if ( i + 1 <= level )
                            $(stars[i]).removeClass( 'empty' );
                        else
                            $(stars[i]).addClass( 'empty' );
                    } // for
                });
            }
            //--------------------------------------------------------
        }
        /*************************************************************/
        function ChooseEffect()
        {
            var effect = 'puff';
            var rand = Math.random() * 100;

            if ( rand >= 20 && rand < 40 )
                effect = 'blind';
            if ( rand >= 40 && rand < 60 )
                effect = 'scale';
            if ( rand >= 60 && rand < 80 )
                effect = 'fade';
            if ( rand >= 80 && rand <= 100 )
                effect = 'drop';

            return effect;
        }
        /*************************************************************/
        function OnSongPaid( succeeded )
        {
            if ( succeeded )
            {
                var songs = payment.cart.GetSongs();
                var song_id = songs[0].id;

                songs.forEach( function( song )
                {
                    var panel = $('#panel_song_' + song.id );

                    // setup button
                    $( panel.find('.play .play_btn')).show();
                    $( panel.find('.play .price')).hide();

                    // allow song to be played
                    var play_box = panel.find('.play');
                    play_box.data( 'price', 0 );
                });

                PlaySong( song_id );
            }
        }
        /*************************************************************/
    };

    return new SongManager();
});
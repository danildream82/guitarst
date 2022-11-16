/**
 * Created by Igor on 05.04.2017.
 */

define( ['jquery', 'fancybox', 'vocabulary', 'util'], function( $, fancybox, voc, util ){

    function Common()
    {
        var self = this;

        /*************************************************************/
        // public
        /*************************************************************/
        self.settings = {
            api_pass : 'KJFHGOFGIUHYFKJDKVBKGLHSLDIFKDJH'
        };

        self.vocabulary = voc;
        self.util = util;

        /*************************************************************/
        self.UpdateUserHeadPanel = function( user_data )
        {
            var html = $('.preload #userpanel_0').html();

            if ( user_data )
            {
                // Prepare Data
                var panel = $('.preload #userpanel_1');

                $(panel.find('.userpic img')[0]).attr( 'src', user_data.user_avatar );
                $(panel.find('.username')[0]).text( user_data.display_name );

                // Update panel content
                html = panel.html();
            }

            $('header .userpanel').html(html);

            // Set login state
            $('body').data('login_state', 1 );
        }
        /*************************************************************/
        self.IsUserLoggedIn = function()
        {
            return $('body').data('login_state') * 1;
        }
        /*************************************************************/
        self.CreateNewSongData = function( node )
        {
            return new Song( node ); // если node пустой, то мы его инициализируем позже
        }
        /*************************************************************/

        /******************  SONG STRUCT  ****************************/
        function Song( node )
        {
            var self = this;

            /*************************************************************/
            self.InitWithRawData = function( song_data )
            {
                if ( typeof song_data != 'undefined' )
                {
                    self.id = song_data.id;
                    self.price = song_data.price;
                    self.name = song_data.name;
                    self.thumb = song_data.thumb;
                    self.original_artist = song_data.original_artist;
                    self.player_name = song_data.player_name;
                    self.user_image = song_data.user_image;
                    self.genre = song_data.genre;
                    self.complexity = song_data.complexity;
                    self.popularity = song_data.popularity;
                    self.url = song_data.url;
                }
            }
            /*************************************************************/
            self.GetDataFromNode = function( node ) // get data attributes of a node
            {
                self.id = node.data( 'song_id' ); // song ID
                self.price = node.data( 'price' );
                self.name = node.data( 'name' );
                self.thumb = node.data( 'thumb' );
                self.original_artist = node.data( 'original_artist' );
                self.player_name = node.data( 'player_name' );
                self.user_image = node.data( 'user_image' );
                self.genre = node.data( 'genre' );
                self.complexity = node.data( 'complexity' );
                self.popularity = node.data( 'popularity' );
                self.url = node.data( 'url' );
            }
            /*************************************************************/
            self.SetDataToNode = function( node ) // set song  data attributes to a node
            {
                node.data( 'song_id', self.id ); // song ID
                node.data( 'price', self.price );
                node.data( 'name', self.name );
                node.data( 'thumb', self.thumb );
                node.data( 'original_artist', self.original_artist );
                node.data( 'player_name', self.player_name );
                node.data( 'user_image', self.user_image );
                node.data( 'genre', self.genre );
                node.data( 'complexity', self.complexity );
                node.data( 'popularity', self.popularity );
                node.data( 'url', self.url )
            }
            /*************************************************************/

            if ( typeof node != 'undefined')
                self.GetDataFromNode( node );
        } // Song
        /*************************************************************/
    };

    return new Common();
});

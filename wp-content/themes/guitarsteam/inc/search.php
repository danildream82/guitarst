<?php
/**
 * Created by PhpStorm.
 * User: Igor
 * Date: 09.07.2019
 * Time: 12:54
 */

define('SONGS_PER_PAGE', 10 );

class gsSearch
{
    public $last_error = [
        'code' => 0,
        'text' => ''
    ];
    public $song_search_params = [];
    public $song_search_result = [];
    public $song_search_pager = '';
    public $song_search_total = 0;

    /***************************************************************************************/
    public function __construct()
    {
    }
    /***************************************************************************************/
    public function SongGeneral( $search_params )
    {
        global $wpdb;
        global $post;
        $paged = [];
        $result = false;

        $this->song_search_params = $search_params;
        $this->song_search_result = [];
        $this->song_search_pager = '';
        $this->song_search_total = 0;

        // paging
        if (!empty($search_params['page']))
        {
            $paged['paged'] = $search_params['page'];
        }
        else
        {
            $paged['paged'] = 1;
        }

        // search params array, it will passed to wp_query
        $searchParam = [];

        //search by FREE text field
        if (!empty($search_params['keyword']))
        {
            $searchParam = [
                's' => (string)$search_params['keyword'],
                'sentence' => 1,
            ];
        }

        //search by TERM field
        if (!empty($search_params['genre']))
        {
            $searchParam['tax_query'] = [[
                'taxonomy' => 'product_cat',
                'field' => 'term_id',
                'terms' => [ $search_params['genre'] ],
                'compare' => 'IN'
            ]];
        }

        //search by META field
        if ( !empty($search_params['complexity']) && $search_params['complexity'] != 'on' )
        {
            $complexity = $search_params['complexity'];
            if ($complexity == false )
            {
                $this->last_error['code'] = ERR_BAD_SEARCH_PARAM;
                $this->last_error['text'] = $search_params['complexity'] . ' is invalid complexity value';
                return false;
            }
            else
            {
                $searchParam['meta_query'] = [[
                    'key' => 'song_complexity',
                    'value' => [$complexity],
                    'compare' => 'IN',
                ]];
            }
        }

        // pager params for search wp_query
        $commonParams = [
            'post_type' => 'product',
            'posts_per_page' => SONGS_PER_PAGE,
            'post_status' => 'publish',

            'meta_key' => 'song_popularity',
            'orderby' => array( // сортировка по двум полям
                'meta_value_num' => 'DESC',
                'date' => 'DESC'
            )
        ];

        $postQuery = new WP_Query( $searchParam + $commonParams + $paged );

        while ($postQuery->have_posts())
        {
            $postQuery->the_post();

            $this->HandleSongResult( $post );
        }

        $this->SongsUnderReview();

        if( !empty( $this->song_search_result ))
        {

            if ($paged['paged'] > $postQuery->max_num_pages)
            {
                $paged['paged'] = 1;
            }

            // Код пейджера
            $big = 999999999;

            $max_page_link = esc_url(get_pagenum_link($big));
            $max_page_link = str_replace( $big, '%#%', $max_page_link );
            $max_page_link = str_replace( '/api', '', $max_page_link );

            $pager = paginate_links(array(
                'base' => $max_page_link,
                'format' => '?paged=%#%',
                'current' => max( 1, $paged['paged'] ),
                'total' => $postQuery->max_num_pages,
                'type' => 'list',
                'prev_text'    => __(''),
                'next_text'    => __('')
            ));
            $pager = str_replace( "<ul class='page-numbers'>", '<ul class="pagination">', $pager );
            $pager = str_replace( get_site_url() . '/page/1/', get_site_url(), $pager );

            $this->song_search_pager = $pager;
            $this->song_search_total = $postQuery->found_posts;

            $result = [
                'search_results' => $this->song_search_result,
                'pager' => $this->song_search_pager,
                'total' => $this->song_search_total
            ];

        } else {

            $result = [ 'search_results' => [] , 'pager' => [], 'total' => 0 ];
        }

        return $result;
    }
    /***************************************************************************************/
    protected function HandleSongResult( $post, $add_to_result = true )
    {
        $postId = $post->ID;
        $song = new gsSong( $postId );

        $complexity = get_post_meta( $postId, 'song_complexity', true );
        $popularity = get_post_meta( $postId, 'song_popularity', true );

        $categoryList = $song->GetSongCategories( 0, true );

        // получение миниатюры
        $thumb = get_the_post_thumbnail_url( null, 'gs-song-thumb' );

        if ( $thumb == false )
            $thumb = get_template_directory_uri() . '/img/song-thumb.jpg';

        // Формирование результата
        $result = [
            'id' => $postId,
            'name' => html_entity_decode( get_the_title()),
            'original_artist' => html_entity_decode( get_post_meta( $postId, 'song_original_artist', true)),
            'thumb' => $thumb,
            'player_name' => html_entity_decode( get_the_author()),
            'genre' => $categoryList,
            'complexity' => $complexity ? $complexity : 0,
            'popularity' => $popularity,
            'price' => 0,
            'url' => get_permalink(),
        ];

        if ( $post->post_status == 'pending' )
        {
            $result['pending'] = 1;
        }

        if ( $add_to_result )
            $this->song_search_result[] = $result;

        return $result;
    }
    /***************************************************************************************/
    protected function SongsUnderReview() // песни, видимые для админа
    {
        global $post;

        if ( current_user_can('administrator'))
        {
            $params = [
                'post_type' => 'product',
                'posts_per_page' => -1,
                'post_status' => 'pending',

                'orderby' => array(
                    'date' => 'DESC'
                )
            ];

            $query = new WP_Query( $params );

            while ( $query->have_posts())
            {
                $query->the_post();
                $song_result = $this->HandleSongResult( $post, false );
                array_unshift( $this->song_search_result, $song_result );
            } // while have posts
        }
    }
    /***************************************************************************************/
}

?>
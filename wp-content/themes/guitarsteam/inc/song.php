<?php
/**
 * Created by PhpStorm.
 * User: Igor
 * Date: 08.07.2019
 * Time: 9:01
 */

class gsSong
{
    public $id = 0;
    public $product = null;

    /************************************************************************************/
    public function __construct( $post_id = 0 )
    {
        if ( $post_id )
        {
            $this->id = $post_id;

            if ( $this->id )
                $this->product = wc_get_product( $this->id );
        }
    }
    /************************************************************************************/
    public function GetSongCategories( $post_id = 0, $text_only = false )
    {
        $post_id = $post_id ? $post_id : $this->id;
        if ( $post_id == 0 )
            return false;

        $categoryAll = get_the_terms( $post_id, 'product_cat');

        $categoryList = [];
        if (is_array($categoryAll))
        {
            foreach ($categoryAll as $keyCat => $valueCat)
            {
                if ( $text_only )
                {
                    $categoryList[] = $valueCat->name;
                }
                else
                {
                    $categoryList[] = $valueCat;
                }
            }
        }

        return $categoryList;
    }
    /************************************************************************************/
    public function GetPrice( $post_id = 0 )
    {
        $post_id = $post_id ? $post_id : $this->id;
        if ( $post_id == 0 )
            return false;

        $price = $this->product->get_price();

        $price = $price ? $price * 1 : 0;

        return $price;
    }
    /************************************************************************************/
    public  function GetPopularity( $post_id = 0 )
    {
        $post_id = $post_id ? $post_id : $this->id;
        if ( $post_id == 0 )
            return false;

        return get_post_meta( $this->id, 'song_popularity', true );
    }
    /************************************************************************************/
    public  function GetComplexity( $post_id = 0 )
    {
        $post_id = $post_id ? $post_id : $this->id;
        if ( $post_id == 0 )
            return false;

        return get_post_meta( $this->id, 'song_complexity', true );
    }
    /************************************************************************************/
    public function GetName( $post_id = 0 )
    {
        $product = $this->product;

        if ( $post_id )
        {
            $product = wc_get_product( $post_id );
        }

        return $product->get_title();
    }
    /************************************************************************************/
    public function GetOrgnArtist( $post_id = 0 )
    {
        $post_id = $post_id ? $post_id : $this->id;
        if ( $post_id == 0 )
            return false;

        return html_entity_decode( get_post_meta( $post_id, 'song_original_artist', true));
    }
    /************************************************************************************/
}

?>
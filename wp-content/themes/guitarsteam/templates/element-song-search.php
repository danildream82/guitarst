<?php
/**
 * Created by PhpStorm.
 * User: Igor
 * Date: 31.03.2017
 * Time: 17:35
 */

global $search;

$display_filters = 'style="display: none"';

if ( $search->song_search_params['complexity'] || $search->song_search_params['genre'] )
    $display_filters = '';
?>


<form id="search-form" action="#" class="form-search">

    <div class="row main-search">
        <input id="search-song" type="text" class="input button edged flat" placeholder="FIND YOUR SONG" value="<?= $search->song_search_params['keyword'] ?>">
        <label for="search-song" class="clear-search-text">&nbsp;</label>
        <button type="submit" class="button wooden edged btn-search">
            <span>Search</span>
        </button>
    </div>

    <div class="search-filters columns-holder" <?= $display_filters ?>>
        <div class="column">
            <div class="form-group">
                <div class="complexity button wooden">
                    <span>Complexity</span>
                    <div id="search-complexity" class="radio-combo-stars" style="white-space: nowrap; text-align: center;">

                        <input id="complex-radio-3" class="star" type="radio" name="complexity" value="3" <?php
                            if ( $search->song_search_params['complexity'] == 3 )
                                echo 'checked';
                        ?>/>
                        <label title="high" for="complex-radio-3"></label>

                        <input id="complex-radio-2" class="star" type="radio" name="complexity" value="2" <?php
                            if ( $search->song_search_params['complexity'] == 2 )
                                echo 'checked';
                        ?>/>
                        <label title="medium" for="complex-radio-2"></label>

                        <input id="complex-radio-1" class="star" type="radio" name="complexity" value="1" <?php
                            if ( $search->song_search_params['complexity'] == 1 )
                                echo 'checked';
                        ?>/>
                        <label title="low" for="complex-radio-1"></label>

                        <input id="reset-complexity" class="stars-reset" type="radio" name="complexity"/>
                        <label class="any-complexity" title="any complexity" for="reset-complexity"></label>

                    </div>
                </div>
            </div>
            <div class="form-group">
                <div class="fake-select">
                    <select id="search-genre" placeholder="Genre" class="button wooden edged">
                        <option name="any" value="">Any Genre</option>
                        <?php

                        $genres = get_terms([ 'taxonomy' => ['product_cat'] ]);

                        foreach( $genres as $genre )
                        {
                            $selected = $genre->term_id == $search->song_search_params['genre'] ? 'selected' : '';
                            echo '<option name="' . $genre->name . '" value="' . $genre->term_id . '" ' . $selected . '>' . $genre->name . '</option>';
                        }

                        ?>
                        <div class="arrow"></div>
                    </select>
                </div>
            </div>
        </div>

    </div>


    <div class="search-bottom">
        <div class="filter-button">
            <a href="#" class="btn btn-primary btn-filter btn-lg">Filters</a>
        </div>
        <div class="sort-box">
            <div class="title">
                <strong class="">Sort by:</strong>
            </div>
            <div class="fake-select">
                <select placeholder="Genre" class="button edged">
                    <option value="Genre1">Rating</option>
                    <option value="Genre2">Date</option>
                </select>
            </div>
            <div class="sort-button">
                <a href="#" class="button edged btn-sort-up"></a>
                <a href="#" style="display: none" class="button edged btn-sort-down"></a>
            </div>
        </div>
        <div class="result-box">
            <strong class="">Found: <span class="songs_found_num"><?= $search->song_search_total ?><span></strong>
        </div>

    </div>

</form>

<?php

?>

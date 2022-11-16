<form role="search" method="get" class="form-search" action="<?php echo home_url('/'); ?>">
  <label>
  	<span class="screen-reader-text"><?php _e( 'Search for:', 'virtue' ); ?></span>
  	<input type="text" value="<?php if (is_search()) { echo get_search_query(); } ?>" name="s" class="search-query" placeholder="<?php _e('Search', 'virtue'); ?>">
  </label>
  <button type="submit" class="search-icon"><i class="icon-search"></i></button>
</form>
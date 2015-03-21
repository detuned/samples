services.factory( 'searchService', [ 'newsService', 'feedsService', function( newsService, feedsService ){
	var searchService = {

		resetAdvancedSearch : function(){
			var options = newsService.clearAdvancedSearchFields();
			return feedsService.getItemsAsync().then( function( feeds ){
				newsService.getFeedListForSearch( feeds, options.feeds.list );
			} )
		}

	};

	return searchService;
}] );
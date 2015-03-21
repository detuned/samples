newsModule
	.filter( 'feedTitle', [ 'feedsService', function( feedsService ){
		return function( input ){
			var
				feed = feedsService.getFeedById( input ),
				out = input;
			if( feed && feed.title ){
				out = feed.title;
			}
			return out;
		}
	} ] );
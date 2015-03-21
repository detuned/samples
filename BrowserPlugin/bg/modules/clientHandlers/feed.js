define( 'clientHandlers/feed', [
	'jquery',
	'log',
	'services/feedBgService'
], function( $, _log, feedBgService ){
	var
		feed = {},
		log = _log.c( 'indexHandler' );

	feed.load = feedBgService.load;
	feed.getNewItemsNum = feedBgService.getNewItemsNum;
	feed.setMaxViewed = feedBgService.setMaxViewed;
	feed.markAllViewed = feedBgService.markAllViewed;

	return feed;
} );
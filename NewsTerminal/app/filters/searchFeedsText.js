newsModule
	.filter( 'searchFeedsText', [ 'feedsService', function( feedsService ){
		return function( input ){
			var
				sids = feedsService.filterSidListByType( input ),
				out = '',
				feed,
				feedsTitles = [];
			if( ! sids.length ){
				feedsTitles.push( GLOBAL.l10n( 'Общая лента' ) );
			}
			else if( sids.length == 1 ){
				feed = feedsService.getFeedById( sids[0] );
				if( feed && feed.title ){
					feedsTitles.push( feed.title );
				}
			}
			else {
				feedsTitles = _.map( sids, function( sid ){
					var feed = feedsService.getFeedById( sid );
					return feed.title;
				} )
			}
			if( ! feedsTitles.length ){
				out = GLOBAL.l10n( 'Результаты поиска' );
			}
			else if( feedsTitles.length == 1 ){
				out = GLOBAL.l10n( 'РЕЗУЛЬТАТЫ ПОИСКА В ЛЕНТЕ' ) + ' «' + feedsTitles[0] + '»';
			}
			else {
				out = GLOBAL.l10n( 'Результаты поиска в лентах' ) + ' ' + feedsTitles.join( ', ' );
			}
			return out;
		}
	} ] );
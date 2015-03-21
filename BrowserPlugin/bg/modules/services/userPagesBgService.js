define( 'services/userPagesBgService', [
	'underscore',
	'jquery',
	'config',
	'log',
	'api/request'
], function( _, $, config, _log, request ){
	var
		userPagesBgService = {},
		log = _log.c( 'userPagesService' );


	userPagesBgService.find = function( options ){
		options = _.defaults( options || {}, {
			//TODO set defaults?
		} );
		log.log( 'search with options', options );
		return request.send( 'userPages::find', options );
	};

	userPagesBgService.getTabsByUrl = function( url ){
		var
			defer = $.Deferred(),
			windows = [],
			res = [];
		chrome.windows.getAll(function ( w ){
			windows = w;
			searchWindow();
		});


		function searchWindow(){
			if ( ! windows || ! windows.length ){
				defer.resolve( res );
				return;
			}
			chrome.tabs.query( { windowId : windows.shift().id }, function( tabs ){
				res = res.concat(  _.filter( tabs, function( item ){
					return item.url === url;
				} ) );
				searchWindow();
			} );
		}

		return defer.promise();
	};

	return userPagesBgService;
} );
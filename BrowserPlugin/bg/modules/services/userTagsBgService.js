define( 'services/userTagsBgService', [
	'underscore',
	'jquery',
	'config',
	'log',
	'api/request',
	'services/userPageBgService'
], function( _, $, config, _log, request, userPageBgService ){
	var
		log = _log.c( 'userTagsService' ),
		userTagsBgService = {},
		tags;

	userTagsBgService.getAllTags = function(){
		var
			defer = $.Deferred();
		log.log( 'getAllTags...' );
		if( tags ){
			defer.resolve( tags );
		}
		else {
			request.send( 'userTags::list' ).then( function( res ){
				if( res ){
					tags = _.isArray( res.tags )
						? res.tags
						: [];
					defer.resolve( tags );
				}
				else {
					defer.reject( res );
				}
			}, defer.reject );

		}
		return defer.promise();
	};

	userTagsBgService.addPageTag = function( data ){
		var defer = $.Deferred();
		if( ! data || ! data.tag || ! data.url ){
			log.warn( 'cannot add wrong tag ', data );
			defer.reject();
		}
		log.log( 'add tag', data.tag, ' for page ', data.url );
		request.send( 'userPage::tagAdd', data ).then( defer.resolve, defer.reject );

		return defer.promise();
	}
	;
	userTagsBgService.removePageTag = function( data ){
		var defer = $.Deferred();
		if( ! data || ! data.tag || ! data.url ){
			log.warn( 'cannot remove wrong tag ', data );
			defer.reject();
		}
		log.log( 'remove tag', data.tag, ' from page ', data.url );
		request.send( 'userPage::tagRemove', data ).then( defer.resolve, defer.reject );

		return defer.promise();
	};

	userTagsBgService.resetTags = function( newTags ){
		log.log( 'got new tags to reset', newTags );
		if( _.isArray( newTags ) ){
			//TODO check every tag validness?
			tags = newTags;
			userPageBgService.broadcast( null, 'sys::tagsReset', { tags : tags } );
		}
	};

	function hasTag( tag ){
		return _.indexOf( tags, tag ) > - 1;
	}

	return userTagsBgService;
} );
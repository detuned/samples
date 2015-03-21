define( 'clientHandlers/userTags', [
	'underscore',
	'jquery',
	'config',
	'log',
	'services/userTagsBgService',
	'services/userPageBgService'
], function( _, $, config, _log, userTagsBgService, userPageBgService ){
	var
		userTags = {},
		log = _log.c( 'userTagsHandler' );

	userTags.list = userTagsBgService.getAllTags;

	userTags.tagAdd = function( data ){
		var
			defer = $.Deferred(),
			tab;
		if( ! data
			|| ! data._tab
			|| ! data._tab.id
			|| ! ( tab = userPageBgService.getTab( data._tab.id ) )
			|| ! tab.getUrl()
			){
			log.warn( 'cannot add tag for unknown tab', data );
			defer.reject();
		}
		else {
			userTagsBgService.addPageTag( {
				tag : data.tag,
				url : tab.getUrl()
			} ).then( defer.resolve, defer.reject );
			if( tab.getPageId() ){
				log.log( 'going to broadcast adding tag', tab.getPageId(), tab );
				userPageBgService.broadcastSameTabs( tab.getPageId(), 'userPage::tagAdd', { tag : data.tag } );
			}
		}
		return defer.promise();
	};

	userTags.tagRemove = function( data ){
		var
			defer = $.Deferred(),
			tab;
		if( ! data
			|| ! data._tab
			|| ! data._tab.id
			|| ! ( tab = userPageBgService.getTab( data._tab.id ) )
			|| ! tab.getUrl()
			){
			log.warn( 'cannot add tag for unknown tab', data );
			defer.reject();
		}
		else {
			userTagsBgService.removePageTag( {
				tag : data.tag,
				url : tab.getUrl()
			} ).then( defer.resolve, defer.reject );
			if( tab.getPageId() ){
				userPageBgService.broadcastSameTabs( tab.getPageId(), 'userPage::tagRemove', { tag : data.tag } );
			}
		}
		return defer.promise();
	};

	return userTags;
} );
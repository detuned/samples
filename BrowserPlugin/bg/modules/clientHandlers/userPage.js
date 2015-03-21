define( 'clientHandlers/userPage', [
	'underscore',
	'jquery',
	'config',
	'log',
	'services/userPageBgService',
	'services/userNotesBgService'
], function( _, $, config, _log, userPageBgService, userNotesBgService ){
	var
		log = _log.c( 'userPageHandler' ),
		userPage = {};

	userPage.getData = function( params ){
		var tabInstance;
		if( params && params._tab && params._tab.id ){
			log.log( 'getting data for tab', params );
			tabInstance = userPageBgService.getTab( params._tab.id );
			if( params.url && ! tabInstance.getUrl() ){
				log.log( 'tab', params._tab.id, 'has no url for some reasons. Now set url and trigger hit' );
				tabInstance.data( { url : params.url } );
			}
			return userPageBgService.loadTabData( params._tab.id );
		}
		else {
			log.warn( 'cannot get data for bad tab ', params );
		}
	};

	userPage.pubNotesView = function( data ){
		var
			defer = $.Deferred(),
			tab;
		if( ! data
			|| ! data._tab
			|| ! data._tab.id
			|| ! ( tab = userPageBgService.getTab( data._tab.id ) )
			|| ! tab.getUrl()
			){
			log.warn( 'cannot update pubNotesView of unknown tab', data );
			defer.reject();
		}
		else {
			userNotesBgService.setPubNotesView( _.extend( data, {
					url : tab.getUrl()
				} ) ).then( function( data ){
					defer.resolve( data );
					if( data.utime && tab.getPageId() ){
						log.log( 'going to broadcast update pubNotesView', tab.getPageId(), data );
						userPageBgService.broadcastSameTabs( tab.getPageId(), 'userPage::pubNotesView', { utime : data.utime } );
					}
				}, defer.reject );
		}
		return defer.promise();
	};

	userPage.send = function( data ){
		var
			defer = $.Deferred(),
			tab;
		if( ! data
			|| ! data._tab
			|| ! data._tab.id
			|| ! ( tab = userPageBgService.getTab( data._tab.id ) )
			|| ! tab.getUrl()
			){
			log.warn( 'cannot update pubNotesView of unknown tab', data );
			defer.reject();
		}

		userPageBgService.send( _.extend( _.omit( data, '_tab' ), {
			url : tab.getUrl()
		} ) ).then( defer.resolve, defer.reject );

		return defer.promise();
	};

	return userPage;
} );
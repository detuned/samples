define( 'services/connectionBgService', [
	'underscore',
	'jquery',
	'config',
	'log',
	'api',
	'api/request',
	'services/userPageBgService'
], function( _, $, config, _log, api, request, userPageBgService ){
	var
		log = _log.c( 'connection' ),
		connectionBgService = {};

	connectionBgService.init = function(){
		api.onConnected( function(){
			log.log( 'cought api connected signal, going to broadcast it to all tabs' );
			userPageBgService.broadcastAllTabs( 'api::connected' );
		} );
		api.onDisconnected( function(){
			log.warn( 'cought api DISconnected signal, going to broadcast it to all tabs' );
			userPageBgService.broadcastAllTabs( 'api::disconnected' );
		} );
	};

	connectionBgService.sendDisconnectSignal = function(){
		return request.send( 'sys::disconnect' );
	};



	return connectionBgService;
} );
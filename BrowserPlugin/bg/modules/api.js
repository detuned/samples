define( 'api', [
	'jquery',
	'config',
	'utils',
	'api/xhr',
	'api/socket',
	'utils/eventsFabric'
], function( $, config, utils, xhr, socket, eventsFabric ){

	var
		isConnected = false,
		events = eventsFabric.getInstance( { name : 'api' } ),
		triggerConnected = events.trigger( 'connected' ),
		triggerDisconnected = events.trigger( 'disconnected' ),
		api = {};

	api.postRequest = xhr.postRequest;
	api.getRequest = xhr.getRequest;

	api.listen = socket.listen;
	api.send = socket.send;
	api.close = socket.close;
	api.ping = socket.ping;
	api.getSock = socket.getSock;
	api.sendAction = function( action, data ){
		return api.send( utils.decodeAction( action, data ) );
	};
	api.init = socket.init;

	api.isConnected = function(){
		return isConnected;
	};

	api.onConnected = events.on( 'connected' );
	api.offConnected = events.off( 'connected' );
	api.onDisconnected = events.on( 'disconnected' );
	api.offDisconnected = events.off( 'disconnected' );

	socket.on( 'open', function( event, data ){
		if( ! isConnected ){
			isConnected = true;
			triggerConnected();
		}
	} );
	socket.on( 'close', function( event, data ){
		if( isConnected ){
			isConnected = false;
			triggerDisconnected();
		}
	} );

	return api;
} );
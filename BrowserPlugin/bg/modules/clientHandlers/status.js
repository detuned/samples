define( 'clientHandlers/status', [
	'underscore',
	'jquery',
	'config',
	'log',
	'api'
], function( _, $, config, log, api ){
	var status = {};

	status.online = function(){
		return {
			online : api.isConnected()
		}
	};

	return status;
} );
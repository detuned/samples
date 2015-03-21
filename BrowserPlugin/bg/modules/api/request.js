/**
 * An abstraction layer for messages
 */
define( 'api/request', [
	'underscore',
	'jquery',
	'config',
	'log',
	'api/messages'
], function( _, $, config, log, messages ){
	var request = {};

	request.send = messages.send;

	return request;
} );
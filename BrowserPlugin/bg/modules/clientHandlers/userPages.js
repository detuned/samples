define( 'clientHandlers/userPages', [
	'underscore',
	'jquery',
	'config',
	'log',
	'services/userPagesBgService'
], function( _, $, config, _log, userPagesBgService ){
	var
		log = _log.c( 'userPagesHandler' ),
		userPages = {};

	userPages.find = function( params ){
		return userPagesBgService.find( params.options );
	};

	return userPages;
} );
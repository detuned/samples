define( 'clientHandlers/sys', [
	'jquery',
	'log'
], function( $, _log ){
	var
		sys = {},
		log = _log.c( 'sysHandler' );

	sys.pong = function( data ){
		log.log(
			'pong received from',
			data && data._tab && data._tab.id
				? 'tab ' + data._tab.id
				: 'unknown tab'
		);
	};


	return sys;
} );
define( 'main', [
	'log',
	'runtime',
	'dispatcher'
], function( _log, runtime, dispatcher ){
	var
		log = _log.c( 'main' ),
		main = {};

	/**
	 * All background activity starts here
	 */
	main.init = function(){
		runtime.init();
		dispatcher.init();
	};
	return main;
} );
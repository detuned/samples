define( 'utils/eventsFabric', [
	'underscore',
	'jquery',
	'config',
	'log'
], function( _, $, config, log ){
	var
		eventsFabric = {};

	function EventsHandler( options ){
		options = _.defaults( options || {}, {} );
		var
			element = $( '<div/>' ),
			instance = {};

		_.map( [ 'on', 'off', 'trigger' ], function( key ){
			instance[key] = function( name, data ){
				return function(){
					var
						args = _.toArray( arguments ),
						extData;
					if( name ){
						args.unshift( name );
					}
					if( key === 'trigger' && data ){
						extData = _.isFunction( data )
							? data()
							: data;
						args[1] = _.extend( args[1] || {}, extData );
					}
					return element[key].apply( element, args );
				}
			};
		} );

		return instance;
	}

	eventsFabric.getInstance = EventsHandler;

	return eventsFabric;
} );
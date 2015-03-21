angular.module( 'index' )
	.service( 'eventsFabricService', [function (){
		var eventsFabricService = {};

		function EventsHandler( options ){
			options = _.defaults( options || {}, {} );
			var
				element = angular.element( '<div/>' ),
				instance = {};

			_.map( [ 'on', 'off', 'trigger' ], function ( key ){
				instance[key] = function ( name, data ){
					return function (){
						var
							args = _.toArray( arguments ),
							extData;
						if ( name ){
							args.unshift( name );
						}
						if ( key === 'trigger' && data ){
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

		eventsFabricService.getInstance = EventsHandler;

		return eventsFabricService;
	}] );
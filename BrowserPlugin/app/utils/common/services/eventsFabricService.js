angular.module( 'utils' )
	.service( 'eventsFabricService', [function (){
		var
			instances = [],
			eventsFabricService = {};

		function EventsHandler( options ){
			options = _.defaults( options || {}, {} );
			var
				element = angular.element( '<div/>' ),
				methods = [ 'on', 'off', 'trigger' ],
				instance = {};

			_.map( methods, function ( key ){
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

			instance.destroy = function (){
				element.off().remove();
				instance = null;
			};

			instances.push( instance );

			return instance;
		}

		eventsFabricService.getInstance = EventsHandler;
		eventsFabricService.destroy = function (){
			while( instances.length ){
				instances.shift().destroy();
			}
		};

		return eventsFabricService;
	}] );
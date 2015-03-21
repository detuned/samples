angular.module( 'utils' )
	.directive( 'keymaster', [
		'$parse',
		'$log',
		function( $parse, $log ){
			var globalId = 0;
			key.filter = function(){ return true };
			return {
				link : function( scope, element, attrs ){
					var
						params = scope.$eval( attrs.keymaster ),
						id = ++ globalId,
						keymasterScope = 'scope_' + id;

					angular.forEach( params, function( action, shortcut ){
						var expression = $parse( action );
						key( shortcut, keymasterScope, function( event ){
							$log.debug( 'keymaster: shortcut', shortcut, 'fired for field id=', id );
							scope.$apply( function(){
								expression( scope, { '$event' : event } );
							} );
							event.stopPropagation();
							event.preventDefault();
						} );
					} );


					element
						.on( 'focus', function( event ){
							key.setScope( keymasterScope );

							//Listen events in the field not on document level as keymaster does
							//It lets us possibility to prevent bubbling
							element
								.off( 'keydown.keymaster', onKeyDown )
								.on( 'keydown.keymaster', onKeyDown );
						} )
						.on( 'blur', function(){
							key.setScope();
							element
								.off( 'keydown.keymaster', onKeyDown );
						} );

					function onKeyDown( event ){
						//Pass event to keymaster's dispatching.
						//Note that by default keymaster hide dispatch method as private
						//so this could work only with patched version where its made public
						if( key.dispatch ){
							key.dispatch( event );
						}
					}
				}
			}

		}] );
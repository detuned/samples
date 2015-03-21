angular.module( 'utils' )
	.directive( 'specialKeyPress', [
		'keyCodes',
		function( keyCodes ){
			return function( scope, element, attrs ){
				var code = keyCodes[ String( attrs.key ).toLowerCase() ] || + atrrs.key;
				element.bind( 'keydown keypress', function( event ){
					if( event.which === code ){
						scope.$apply( function(){
							scope.$eval( attrs.specialKeyPress );
						} );
						event.preventDefault();
					}
				} );
			}
		}] );
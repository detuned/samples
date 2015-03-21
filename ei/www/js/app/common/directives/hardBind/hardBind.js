angular.module( 'index' )
	.directive( 'hardBind', [ function(){
		return function( scope, element, attrs ){
			var
				activated,
				unwatch = scope.$watch( attrs.hardBind, function( value ){
					element.text(
						typeof value === 'undefined'
							? ''
							: value
					);
					if ( ! activated ){
						activated = true;
						scope.$$postDigest( unwatch );
					}
				} );
		}
	} ] );
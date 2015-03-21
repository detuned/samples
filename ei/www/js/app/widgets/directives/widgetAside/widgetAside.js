angular.module( 'index' )
	.directive( 'widgetAside', [
		'$window',
		'configService',
		function( $window, configService ){
			var windowElement = angular.element( $window );
			return {
				link : function( scope, element, attrs ){
					var normalTop = element.offset().top;
					function actualizePosition(){
						var
							offset = 20,
							headerElement = angular.element( '.header' );
						if ( headerElement.length ){
							offset += headerElement.outerHeight();
						}
						element.css( 'top', Math.max( 0, windowElement.scrollTop() - normalTop + offset ) );
					}

					//Disable fixing position for a while
//					windowElement.on( 'scroll', actualizePosition );
//					actualizePosition();
				}
			}

		}] );
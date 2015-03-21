angular.module( 'index' )
	.directive( 'dynamicWidth', [function(){
		return {
			link : function( scope, element, attrs ){
				element
					.css( 'width', ( attrs.prevWidth || 0 ) + '%' )
					.on( '$destroy', scope.$on( 'listRendered', function(){
						var css = {
							'width' : ( attrs.dynamicWidth || 0 ) + '%'
						};
						if ( attrs.minWidth ){
							css.minWidth = attrs.minWidth + 'px';
						}
						element.css( css );
					} ) );
			}
		}
	}] );
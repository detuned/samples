angular.module( 'index' )
	.directive( 'borderIcon', [
		'configService',
		function( configService ){
			return {
				templateUrl : configService._getUrl( '//APP/widgets/directives/borderIcon/borderIcon.html' ),
				replace     : true,
				scope       : {
					model : '=borderIcon'
				},
				link        : function( scope, element, attrs ){
					scope.getIconStyle = function (){
						var css = {};
						if ( scope.model && scope.model.color ){
							css.background = scope.model.color;
							css.height = ( scope.model.width || 1 ) * 4;
						}
						return css;
					};
				}
			}

		}] );
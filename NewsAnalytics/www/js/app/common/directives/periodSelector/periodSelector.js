angular.module( 'index' )
	.directive( 'periodSelector', [ 'configService', function( configService ){
		return {
			templateUrl : configService._getUrl( '//APP/common/directives/periodSelector/periodSelector.html' ),
			replace     : true,
			link        : function( scope, element, attrs ){
				element.on( 'click', '.period__side', function ( event ){
					if ( ! scope.periodData.isRangeView ){
						scope.$apply(function (){
							scope.periodData.isRangeView = true;
						});
						event.preventDefault();
						event.stopPropagation();
					}
				})
			}
		}
	}] );
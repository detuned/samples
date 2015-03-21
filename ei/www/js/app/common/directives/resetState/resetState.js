angular.module( 'index' )
	.directive( 'resetState', [ '$rootScope', 'configService', 'stateService', function( $rootScope, configService, stateService ){
		return {
			templateUrl : configService._getUrl( '//APP/common/directives/resetState/resetState.html' ),
			replace     : true,
			transclude  : true,
			link        : function( scope, element, attrs ){
				scope.isResettable = false;
				scope.resetState = function (){
					if ( scope.isResettable ){
						stateService.resetState();
					}
				};
				$rootScope.$on( 'stateUpdated', function( $event, data ){
					scope.isResettable = ! data.isDefault;
				} );
			}
		}
	}] );
angular.module( 'lite' )
	.directive( 'dashboard', [ 'templateService', function( templateService ){
		return {
			templateUrl : templateService.getUrl( '//lite/dashboard/dashboard' ),
			replace     : true,
			link        : function( scope, element, attrs ){

			}
		}

	}] );
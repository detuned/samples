angular.module( 'lite' )
	.directive( 'litePageGuest', [ 'templateService', function( templateService ){
		return {
			templateUrl : templateService.getUrl( '//lite/common/litePageGuest' ),
			replace     : true,
			link        : function( scope, element, attrs ){

			}
		}

	}] );
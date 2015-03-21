angular.module( 'lite' )
	.directive( 'litePageUser', [
		'$timeout',
		'templateService',
		'dashboardService',
		function( $timeout, templateService, dashboardService ){
			return {
				templateUrl : templateService.getUrl( '//lite/common/litePageUser' ),
				replace     : true,
				link        : function( scope, element, attrs ){
					$timeout( dashboardService.initWidgets );
				}
			}

		}] );
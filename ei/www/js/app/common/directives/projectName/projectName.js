angular.module( 'index' )
	.directive( 'projectName', [ 'configService', function ( configService ){
		return {
			templateUrl : configService._getUrl( '//APP/common/directives/projectName/projectName.html' ),
			replace     : true,
			link : function ( scope, element, attrs ){

			}
		}

	}] );
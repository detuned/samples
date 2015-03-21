angular.module( 'index' )
	.directive( 'counterCode', [ 'configService', function( configService ){
		return {
			templateUrl : configService._getUrl( '//APP/text/directives/counterCode/counterCode.html' ),
			replace     : true,
			link        : function( scope, element, attrs ){}
		}
	}] );
angular.module( 'index' )
	.directive( 'borderSelector', [
		'$timeout',
		'configService',
		function( $timeout, configService ){
			return {
				templateUrl : configService._getUrl( '//APP/widgets/directives/borderSelector/borderSelector.html' ),
				replace     : true,
				scope       : {
					model      : '=',
					borderData : '=',
					onSelect   : '&'
				},
				link        : function( scope, element, attrs ){
				}
			}

		}] );
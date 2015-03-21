angular.module( 'index' )
	.directive( 'widgetHeaderSelector', [
		'$timeout',
		'configService',
		function( $timeout, configService ){
			return {
				templateUrl : configService._getUrl( '//APP/widgets/directives/widgetHeaderSelector/widgetHeaderSelector.html' ),
				replace     : true,
				scope       : {
					model    : '=',
					onSelect : '&'
				},
				link        : function( scope, element, attrs ){
					scope.options = [
						{
							title : 'On top',
							value : true
						},
						{
							title : 'On bottom',
							value : false
						}
					];

				}
			}

		}] );
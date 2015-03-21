angular.module( 'index' )
	.directive( 'widgetPeriodSelector', [
		'$timeout',
		'configService',
		function( $timeout, configService ){
			return {
				templateUrl : configService._getUrl( '//APP/widgets/directives/widgetPeriodSelector/widgetPeriodSelector.html' ),
				replace     : true,
				scope       : {
					model    : '=',
					options  : '=',
					onSelect : '&'
				},
				link : function( scope, element, attrs ){
					scope.radioModel = {
						id : null
					};

					scope.$watch( 'model.id', function (){
						scope.radioModel = angular.copy( scope.model );
					});

					scope.select = function( option ){
						$timeout(function (){
							if ( scope.model.id !== scope.radioModel.id ){
								scope.model = _.find( scope.options, function ( item ){
									return item.id == scope.radioModel.id;
								} );
								scope.onSelect();
							}
						})
					}
				}
			}

		}] );
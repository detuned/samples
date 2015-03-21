angular.module( 'index' )
	.directive( 'widgetBorderRadiusSelector', [
		'$timeout',
		'configService',
		function( $timeout, configService ){
			return {
				templateUrl : configService._getUrl( '//APP/widgets/directives/widgetBorderRadiusSelector/widgetBorderRadiusSelector.html' ),
				replace     : true,
				scope       : {
					model    : '=',
					onSelect : '&'
				},
				link        : function( scope, element, attrs ){
					var optionsRegistry = {};
					scope.options = [
						{
							title : 'Straight',
							value : 0
						},
						{
							title : 'Rounded',
							value : 8
						}
					];
					optionsRegistry = _.indexBy( scope.options, 'value' );

					scope.radioModel = {
						value : null
					};

					scope.$watch( 'model', function(){
						scope.radioModel.value = scope.model;
					} );

					scope.select = function( option ){
						$timeout( function(){
							if( scope.model !== scope.radioModel.value ){
								scope.model = scope.radioModel.value;
								scope.onSelect();
							}
						} )
					}
				}
			}

		}] );
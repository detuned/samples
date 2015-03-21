angular.module( 'index' )
	.directive( 'widgetFormSection', [
		'configService',
		function( configService ){
			return {
				templateUrl : configService._getUrl( '//APP/widgets/directives/widgetFormSection/widgetFormSection.html' ),
				replace     : true,
				transclude  : true,
				scope       : true,
				link        : function( scope, element, attrs ){
					scope.formSection = {
						name   : attrs.widgetFormSection,
						title  : attrs.title,
						open   : 'open' in attrs,
						static : 'static' in attrs
					};

					scope.switchCollapse = function( newState ){
						if ( scope.formSection.static ){
							return;
						}
						scope.formSection.open = arguments.length
							? ! ! newState
							: ! scope.formSection.open;
					};
				}
			}

		}] );
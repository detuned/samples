angular.module( 'index' )
	.directive( 'perpageSelect', [ 'configService', 'utilsService', function( configService, utilsService ){
		return {
			templateUrl : configService._getUrl( '//APP/list/directives/perpageSelect/perpageSelect.html' ),
			replace     : true,
			scope       : {
				model      : '=',
				optionsStr : '@options'
			},
			link        : function( scope, element, attrs ){
				var destructors = utilsService.elementDestructor( element );
				scope.options = [];
				scope.model = Number( scope.model );
				function setOptions(){
					scope.options = _.compact( _.map( ( scope.optionsStr || '' ).split( ',' ), function ( item ){
						var v = parseInt( angular.element.trim( item ) );
						if ( ! isNaN( v ) ){
							return v; //Operating with strings cause model is string
						}
						return null;
					} ) );
				}
				function onChange( v, prev ){
					if ( v != prev && angular.isDefined( attrs.onChange ) ){
						scope.$parent.$eval( attrs.onChange.replace( /\$limit/g, v ) );
					}
				}

				setOptions();
				destructors.push(
					scope.$watch( 'model', onChange ),
					scope.$watch( 'optionsStr', setOptions )
				);
			}
		}

	}] )
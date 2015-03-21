angular.module( 'index' )
	.directive( 'geoLocaleSwitcher', [
		'$timeout',
		'$rootScope',
		'$document',
		'configService',
		'utilsService',
		'geoLocalesService',
		function( $timeout, $rootScope, $document, configService, utilsService, geoLocalesService ){
			return {
				scope : {
					locale : '@geoLocaleSwitcher'
				},
				templateUrl : configService._getUrl( '//APP/common/directives/geoLocaleSwitcher/geoLocaleSwitcher.html' ),
				replace     : true,
				link        : function( scope, element, attrs ){
					scope.geoLocales = geoLocalesService.getGeoLocalesOrdered();
					scope.activeGeoLocale = geoLocalesService.getActiveGeoLocale();
					scope.isOpened = false;
					scope.toggle = function (){
						scope.isOpened = ! scope.isOpened;
						if ( scope.isOpened ){
							onOpen();
						}
						else{
							onClose();
						}
					};

					function onOpen(){
						$document.on( 'mousedown', onClickOutside );
					}

					function onClose(){
						$document.off( 'mousedown', onClickOutside );
					}

					function onClickOutside( event ){
						if ( ! angular.element( event.target ).closest( '.geo-locale-switcher' ).length ){
							scope.$apply(function (){
								scope.toggle();
							})
						}
					}

				}
			}

		}] );
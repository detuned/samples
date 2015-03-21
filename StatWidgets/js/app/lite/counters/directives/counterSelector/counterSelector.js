angular.module( 'lite' )
	.directive( 'counterSelector', [
		'$document',
		'$rootScope',
		'templateService',
		'countersService',
		'dashboardService',
		'utilsService',
		function( $document, $rootScope, templateService, countersService, dashboardService, utilsService ){
			return {
				templateUrl : templateService.getUrl( '//lite/counters/counterSelector' ),
				replace     : true,
				scope       : {
					counterId : '=',
					counters  : '='
				},
				link        : function( scope, element, attrs ){
					var
						elementClass = 'counter-selector',
						destructors = utilsService.elementDestructor( element );

					scope.isActive = false;
					scope.counter = {};

					scope.getCounterTitle = countersService.getCounterTitle;
					scope.getCounterSubTitle = countersService.getCounterSubTitle;


					scope.selectCounter = function( newCounter ){
						if( newCounter.id === scope.counter.id ){
							return;
						}
						scope.counter = newCounter;
						scope.counterId = newCounter.id;
						scope.isActive = false;
						onUpdate();
					};

					function onUpdate(){
						dashboardService.broadcastWidgets( 'counter', scope.counter.id );
					}


					function onClickOutside( event ){
						if( ! angular.element( event.target ).is( '.' + elementClass + ',.' + elementClass + ' *' ) ){
							scope.isActive = false;
							scope.$apply();
						}
					}

					function onCounterIdChange( counterId ){
						var newCounter;
						if( counterId && ( newCounter = _.findWhere( scope.counters, { id : counterId } ) ) ){
							scope.selectCounter( newCounter );
						}
						else{
							scope.selectCounter( scope.counters[0] );
						}
					}


					$rootScope.whenAppReady().then( _.once( function(){
						destructors.push(
							scope.$watch( 'counterId', onCounterIdChange ),
							scope.$watch( 'isActive', function( v ){
								if( v ){
									$document.on( 'click', onClickOutside );
								}
								else {
									$document.off( 'click', onClickOutside );
								}
							} ),
							function(){
								$document.off( 'click', onClickOutside );
							}
						);
					} ) );

				}
			}

		}] );
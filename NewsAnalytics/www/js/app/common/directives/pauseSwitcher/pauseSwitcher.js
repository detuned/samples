angular.module( 'index' )
	.directive( 'pauseSwitcher', [
		'$timeout',
		'$rootScope',
		'configService',
		'listApiService',
		'listService',
		'utilsService',
		function( $timeout, $rootScope, configService, listApiService, listService, utilsService ){
			return {
				templateUrl : configService._getUrl( '//APP/common/directives/pauseSwitcher/pauseSwitcher.html' ),
				replace     : true,
				link        : function( scope, element, attrs ){
					var
						destructor = utilsService.elementDestructor( element ),
						timerIndicatorElement = element.find( '[role="timeIndicator"]' ),
						timers = utilsService.timersManager(),
						updateInterval = listApiService.getUpdateInterval(),
						timeToUpdate = 0,
						progressBar =  new ProgressBar.Circle( timerIndicatorElement[0], {
							strokeWidth : 15,
							duration    : updateInterval,
							color       : '#8DBCE5'
						} ),
						time;

					scope.getTimeToUpdate = function(){
						return listService.isPaused()
							? 0
							: timeToUpdate;
					};

					function startProgressBar(){
						time = listApiService.getTimeToUpdate();
						progressBar.stop();
						progressBar.set( 1 - time / updateInterval );
						progressBar.animate( 1, time );
					}


					destructor.push(
						$rootScope.$on( 'apiUpdateIntervalStart', function (){
							if ( ! listService.isPaused() && ! listService.isFrozen() ){
								startProgressBar();
								tickTime();
							}
						}),
						$rootScope.$on( 'pause', function (){
							timers.resetTimer( 'time' );
							progressBar.stop();
						}),
						$rootScope.$on( 'apiUpdateBegin', function (){
							timers.resetTimer( 'time' );
							progressBar.stop();
						})
					);

					function tickTime(){
						timeToUpdate = Math.ceil( listApiService.getTimeToUpdate() / 1000 ) || Math.round( updateInterval / 1000 );
						timers.setTimer( 'time', tickTime, 1000 );
					}

					tickTime();
				}
			}

		}] );
angular.module( 'utils' )
	.service( 'tickService', [
		'$timeout',
		'$log',
		'eventsFabricService',
		'utilsService',
		function( $timeout, $log, eventsFabricService, utilsService ){
			var
				tickInterval = 5000,
				timers = utilsService.timersManager(),
				events = eventsFabricService.getInstance( { name : 'tick' } ),
				onTick = events.on( 'tick' ),
				triggerTick = events.trigger( 'tick' ),
				isStarted = false,
				tickService = {};

			tickService.onTick = function ( listener ){
				onTick( listener );
				if ( ! isStarted ){
					isStarted = true;
					timers.setTimer( 'tick', tick, tickInterval );
				}
			};
			tickService.offTick = events.off( 'tick' );


			function tick(){
				triggerTick();
				timers.setTimer( 'tick', tick, tickInterval );
				$log.debug( 'tick' );
			}

			tick();

			return tickService;
		}] );
angular.module( 'index' )
	.service( 'beatsService', [
		'$q',
		'$timeout',
		'$http',
		'configService',
		'eventsFabricService',
		'utilsService',
		function( $q, $timeout, $http, configService, eventsFabricService, utilsService ){
			var
				events = eventsFabricService.getInstance( { name : 'beatsService' } ),
				timers = utilsService.timersManager(),
				beatsService = {},
				beats,
				loadDefer;

			beatsService.loadBeats = function(){
				if ( loadDefer ){
					return loadDefer.promise;
				}
				timers.resetTimer( 'beats' );
				loadDefer = $q.defer();
				$http.get( configService.beatsCountUrl ).then(function ( res ){
					if ( res.data.beats_count && res.data.beats_count.length ){
						beats = res.data.beats_count;
						loadDefer.resolve( {
							beats : res.data.beats_count
						} );
						loadDefer = null;
					}
					else{
						beats = [];
						loadDefer.reject();
					}
					events.trigger( 'beatsUpdated' )( {
						beats : beats
					} );
				}, loadDefer.reject );

				if ( configService.beatsCountInterval ){
					timers.setTimer( 'beats', beatsService.loadBeats, configService.beatsCountInterval );
				}
				return loadDefer.promise;
			};

			beatsService.onBeatsUpdate = function ( listener ){
				if ( beats ){
					listener( { beats : beats } );
				}
				else{
					beatsService.loadBeats();
				}
				events.on( 'beatsUpdated' )( listener );
			};

			return beatsService;
		}] );
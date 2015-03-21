angular.module( 'plugin' )
	.service( 'apiService', [
		'$q',
		'$log',
		'$rootScope',
		'dispatchService',
		'eventsFabricService',
		function( $q, $log, $rootScope, dispatchService, eventsFabricService ){
			var
				isOnline = false,
				events = eventsFabricService.getInstance(),
				triggerConnected = events.trigger( 'connected' ),
				triggerDisconnected = events.trigger( 'disconnected' ),
				apiService = {};

			apiService.request = function( action, params ){
				var defer = $q.defer();
				$log.log( 'apiService: ', action, ' request sending with', params );
				chrome.runtime.sendMessage( _.extend( params || {}, { action : action } ), function( res ){
					if ( res.success ){
						$log.log( 'apiService: ', action, ' request succeed:', res );
						defer.resolve( res.data );
					}
					else{
						$log.warn( 'apiService: ', action, ' request failed:', res );
						defer.reject( res.data );
					}
					$rootScope.$apply();
				} );
				return defer.promise;
			};

			apiService.isOnline = function (){
				return isOnline;
			};

			apiService.checkOnline = function (){
				return apiService.request( 'status::online' ).then( function ( res ){
					setOnline( res.online );
				} );
			};

			apiService.checkOnline();

			apiService.onConnected = events.on( 'connected' );
			apiService.offConnected = events.off( 'connected' );
			apiService.onDisconnected = events.on( 'disconnected' );
			apiService.offDisconnected = events.off( 'disconnected' );

			function setOnline( state ){
				if ( ! ! state === isOnline ){
					return;
				}
				isOnline = ! ! state;
				if ( isOnline ){
					triggerConnected();
				}
				else{
					triggerDisconnected();
				}
			}

			dispatchService
				.listen( 'api::connected', _.partial( setOnline, true ) )
				.listen( 'api::disconnected', _.partial( setOnline, false ) );


			return apiService;
		}] );
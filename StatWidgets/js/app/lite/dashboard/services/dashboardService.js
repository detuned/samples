angular.module( 'lite' )
	.service( 'dashboardService', [
		'$window',
		'$document',
		'$q',
		function( $window, $document, $q ){
			var
				dashboardService = {},
				xCoreReadyDefer = $q.defer(),
				broadcastBuffer = {};
			dashboardService.initWidgets = function(){
				if( isWidgetsLoaded() ){
					$window.StatWidget.x.register();
				}
			};

			dashboardService.broadcastWidgets = function( channelId, value ){
				if( ! _.isUndefined( channelId ) && ! _.isUndefined( value ) ){
					broadcastBuffer[channelId] = value;
					xCoreReadyDefer.promise.then( broadcastBuffered );
				}
			};


			function broadcastBuffered(){
				angular.forEach( broadcastBuffer, function( value, channelId ){
					$document.trigger( 'xCoreBroadcast', {
						channel : channelId,
						value   : value
					} );
				} );
				broadcastBuffer = {};
			}

			function isWidgetsLoaded(){
				return $window.StatWidget
					&& $window.StatWidget.x
					&& $window.StatWidget.x.register;
			}

			function isWidgetsInitialized(){
				return $window.StatWidget
					&& $window.StatWidget.x
					&& $window.StatWidget.x.initialized;
			}

			if( isWidgetsInitialized() ){
				xCoreReadyDefer.resolve();
			}
			else {
				$document.on( 'xCoreReady', xCoreReadyDefer.resolve );
			}

			return dashboardService;
		}] );
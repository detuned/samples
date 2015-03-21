angular.module( 'index' )
	.service( 'socketApiService', [ '$q', '$timeout', '$window', '$log', 'socketFactory', 'configService', 'utilsService', function( $q, $timeout, $window, $log, socketFactory, configService, utilsService ){
		var
			CHANNEL_ALL = 'all',
			socketApiService = {},
			listeners = {},
			reconnectByErrorNum = 0,
			eventElement = angular.element( '<div/>' ),
			triggerEvent = _.bind( eventElement.trigger, eventElement ),
			timersManager = utilsService.timersManager(),
			initSocketDefer,
			isPingingOn = false,
			socket;

		function initSocket(){
			if( initSocketDefer ){
				return initSocketDefer.promise;
			}
			initSocketDefer = $q.defer();
			if( socket ){
				initSocketDefer.resolve( socket );
			}
			else {
				socket = socketFactory( {
					url   : 'https:' == $window.location.protocol && configService.socketUrlSsl
						? configService.socketUrlSsl
						: configService.socketUrl,
					debug : configService.debug,
					devel : configService.devel,
					protocols_whitelist: utilsService.parseCsvString( configService.socketProtocolsWhitelist )
				} );
				socket
					.setHandler( 'open', function(){
						$log.log( 'socket: opened' );

						setSilenceTimer();
						setPingTimer();
						triggerEvent( 'open' );
						if( reconnectByErrorNum ){
							triggerEvent( 'reconnect' );
						}
						initSocketDefer.resolve();
						initSocketDefer = null;
					} )
					.setHandler( 'message', function( e ){
						setSilenceTimer();
						timersManager.resetTimer( 'pong' );
						var
							msg = angular.fromJson( e.data ),
							channelId; //Pong messages goes with type in lowercase
						$log.debug( 'socket: message received', msg );
						if( _.isNull( msg ) ){
							msg = {};
						}
						channelId = msg.Type || msg.type; //Pong messages goes with type in lowercase
						if( channelId != 'pong' ){
							$log.log( 'socket: message received type=', channelId, ' id=', msg.id );
							triggerChannelUpdate( channelId, msg );
						}

					} )
					.setHandler( 'close', function(){
						$log.log( 'socket: closed' );

						timersManager
							.resetTimer( 'silence' )
							.resetTimer( 'ping' );
						reconnectByErrorNum ++;
						if( configService.socketReconnectByErrorDelay
							&& ( ! configService.socketMaxReconnectsByError
							|| reconnectByErrorNum < configService.socketMaxReconnectsByError
							) ){

							if( configService.socketMaxReconnectsByError
								&& reconnectByErrorNum >= configService.socketMaxReconnectsByError ){
								$log.log( 'socket: max limit of reconnect tryings reached' );
								initSocketDefer.reject();
							}
							else {
								timersManager.setTimer( 'reconnect', reconnectSocket, configService.socketReconnectByErrorDelay );
							}

						}
					} );
			}
			return initSocketDefer.promise;
		}

		function setSilenceTimer(){
			if( configService.socketReconnectBySilence ){
				$log.log( 'socket: set silence timer to ', configService.socketReconnectBySilence );
				timersManager.setTimer( 'silence', function(){
					$log.log( 'socket: close because server is too silent' );
					socketApiService.close();
				}, configService.socketReconnectBySilence );
			}
		}

		function setPingTimer(){
			if( configService.socketPingDelay && isPingingOn ){
				$log.debug( 'socket: set ping timer to ', configService.socketPingDelay );
				timersManager.setTimer( 'ping', ping, configService.socketPingDelay );
			}
		}

		function ping(){
			var
				sendDataStr = angular.toJson( { type : 'ping' } )
			$log.log( 'socket: ping' );
			$log.debug( 'socket: ping body', sendDataStr );
			timersManager.setTimer( 'pong', function(){
				if( isPingingOn ){
					$log.log( 'socket: close because no pong received' );
					socketApiService.close();
				}
			}, configService.socketReconnectByPing );
			socket.send( sendDataStr );

			//Ping non-stop
			setPingTimer();
		}

		socketApiService.setPingingOn = function(){
			$log.debug( 'set pinging on' );
			isPingingOn = true;
		}
		socketApiService.setPingingOff = function(){
			$log.debug( 'set pinging off' );
			isPingingOn = false;
			timersManager.resetTimer( 'ping' );
		}


		function reconnectSocket(){
			$log.log( 'socket: reconnecting...' );
			socket = null;
			initSocketDefer = null;
			initSocket();
			timersManager.resetTimer( 'reconnect' );
		}

		function triggerChannelUpdate( channelId, msg ){
			function handleChannel( cid ){
				if( listeners[cid] ){
					angular.forEach( listeners[cid], function( callback ){
						callback( msg );
					} );
				}
			}

			if( channelId != CHANNEL_ALL ){
				handleChannel( channelId );
			}
			//All channel's listeners wants to get all updates
			handleChannel( CHANNEL_ALL );
		}

		socketApiService.listen = function(){
			var
				args = _.toArray( arguments ),
				callback = args.pop(),
				channelId = args.pop() || CHANNEL_ALL;

			if( ! listeners[ channelId ] ){
				listeners[ channelId ] = [];
			}
			listeners[ channelId ].push( callback );
			return initSocket()
		}

		socketApiService.unListen = function(){
			var
				args = _.toArray( arguments ),
				callback = args.pop(),
				channelId = args.pop() || CHANNEL_ALL;

			if( listeners[ channelId ] ){
				listeners[ channelId ] = _.filter( listeners[ channelId ], function( item ){
					return item !== callback;
				} )
			}
		}

		socketApiService.send = function( data ){
			var defer = $q.defer();
			initSocket().then( function(){
				var
					sendData = {},
					sendDataStr;
				//Server understands only string values for now
				angular.forEach( data, function( v, k ){
					if( ! angular.isObject( v ) ){
						sendData[k] = String( v );
					}
					else {
						sendData[k] = v;
					}
				} );
				sendDataStr = angular.toJson( sendData );
				$log.log( 'socket: send id=', sendData.id );
				$log.debug( 'sendData:', sendDataStr );
				socket.send( sendDataStr );
			} );
			return defer.promise;
		}

		socketApiService.on = _.bind( eventElement.on, eventElement );
		socketApiService.off = _.bind( eventElement.off, eventElement );

		socketApiService.close = function(){
			if( socket ){
				socket.close();
			}
		}

		return socketApiService;
	}] )
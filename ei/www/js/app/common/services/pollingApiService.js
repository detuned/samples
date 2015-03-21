angular.module( 'index' )
	.service( 'pollingApiService', [
		'$q',
		'$http',
		'$timeout',
		'$window',
		'$log',
		'$rootScope',
		'utilsService',
		'configService',
		function( $q, $http, $timeout, $window, $log, $rootScope, utilsService, configService ){
			var
				CHANNEL_ALL = 'all',
				listeners = {},
				eventElement = angular.element( '<div/>' ),
				timers = utilsService.timersManager(),
				currentUrl,
				currentRequest,
				currentId,
				pollingApiService = {},
				nextUpdateTime;

			pollingApiService.listen = function(){
				var
					args = _.toArray( arguments ),
					callback = args.pop(),
					channelId = args.pop() || CHANNEL_ALL;

				if( ! listeners[ channelId ] ){
					listeners[ channelId ] = [];
				}
				listeners[ channelId ].push( callback );
			};

			pollingApiService.unListen = function(){
				var
					args = _.toArray( arguments ),
					callback = args.pop(),
					channelId = args.pop() || CHANNEL_ALL;

				if( listeners[ channelId ] ){
					listeners[ channelId ] = _.filter( listeners[ channelId ], function( item ){
						return item !== callback;
					} )
				}
			};

			pollingApiService.send = function( data ){
				currentUrl = getUrl( data );
				$log.debug( 'polling: new data is', data, 'new url is ', currentUrl );
				if( data.id ){
					currentId = data.id;
					delete data.id;
				}
				reset();
				poll();
			};

			pollingApiService.on = _.bind( eventElement.on, eventElement );
			pollingApiService.off = _.bind( eventElement.off, eventElement );

			pollingApiService.setPingingOn = function(){};
			pollingApiService.setPingingOff = function(){};

			pollingApiService.getTimeToUpdate = function(){
				return nextUpdateTime
					? Math.max( 0, nextUpdateTime - new Date().getTime() )
					: 0;
			};

			pollingApiService.getUpdateInterval = function(){
				return configService.pollingInterval;
			};

			pollingApiService.resetUpdateInterval = function(){
				nextUpdateTime = new Date().getTime() + configService.pollingInterval;
				timers.setTimer( 'poll', poll, configService.pollingInterval );
				triggerUpdateIntervalEvent( 'start' );
			};

			function getUrl( data ){
				var
					url = [],
					query = [],
					queryMap = {
						social : 'social_network'
					};

				url.push( 'https:' == $window.location.protocol && configService.pollingUrlSsl
					? configService.pollingUrlSsl
					: configService.pollingUrl
				);

				angular.forEach( data, function( v, k ){
					if( _.isUndefined( v ) || _.isNull( v ) ){
						return;
					}
					var
						param = queryMap[k] || k,
						value = angular.isArray( v )
							? v.join( ',' )
							: String( v );
					if( value ){
						query.push( param + '=' + String( v ) );
					}
				} );

				if( query.length ){
					url.push( '?', query.join( '&' ) );
				}
				return url.join( '' );
			}

			function onMessage( msg ){
				var channelId;
				$log.debug( 'polling: message received', msg );
				if( ! msg.id ){
					msg.id = currentId;
				}
				channelId = msg.Type || msg.type || 'list';
				if( channelId != 'pong' ){
					$log.log( 'polling: message received type=', channelId );
					triggerChannelUpdate( channelId, msg );
				}
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

			function poll(){
				timers.resetTimer( 'poll' );
				nextUpdateTime = 0;
				if( ! currentUrl ){
					$log.warn( 'polling: cannot poll until send' );
					return;
				}
				$log.log( 'polling: request url=', currentUrl );
				currentRequest = $q.defer();
				triggerUpdateIntervalEvent( 'updateBegin' );
				$http.get( currentUrl, { timeout : currentRequest.promise } ).then( function( res ){
					if( res.data ){
						onMessage( res.data );
						triggerUpdateIntervalEvent( 'updateEnd' );
					}
				}, function( res ){
					$log.warn( 'polling: request failed ', res );
				} )['finally']( function(){
					pollingApiService.resetUpdateInterval();
					currentRequest = null;
				} );
			}

			function reset(){
				timers.resetTimer( 'poll' );
				nextUpdateTime = 0;
				triggerUpdateIntervalEvent( 'reset' );
				if( currentRequest ){
					$log.log( 'polling: current request was forced to abort because a new one' );
					currentRequest.resolve();
				}
			}

			function triggerUpdateIntervalEvent( name ){
				$rootScope.$emit( {
					start       : 'apiUpdateIntervalStart',
					reset       : 'apiUpdateIntervalReset',
					updateBegin : 'apiUpdateBegin',
					updateEnd   : 'apiUpdateEnd'
				}[name] );
			}

			return pollingApiService;
		}] );
angular.module( 'plugin' )
	.service( 'dispatchService', [
		'$rootScope',
		'$log',
		function( $rootScope, $log ){
			var
				CHANNEL_ALL = 'all',
				dispatchService = {},
				listeners = {},
				archive = {},
				init = _.once( function(){
					chrome.runtime.onMessage.addListener( function( request, sender, sendResponse ){
						var
							channelId = request.action,
							data = _.omit( request, 'action' );
						$log.log( 'dispatchService: bg message received:', channelId, data );
						triggerChannelUpdate( channelId, data );
					} );
				} );

			dispatchService.listen = function(){
				var
					args = _.toArray( arguments ),
					callback = args.pop(),
					channelId = args.pop() || CHANNEL_ALL;

				if( ! listeners[ channelId ] ){
					listeners[ channelId ] = [];
				}
				listeners[ channelId ].push( callback );
				flushChannelArchive( channelId );
				init();
				return dispatchService;
			};

			dispatchService.unListen = function(){
				var
					args = _.toArray( arguments ),
					callback = args.pop(),
					channelId = args.pop() || CHANNEL_ALL;
				if ( callback && _.isString( callback ) ){
					channelId = callback;
					callback = null;
				}

				if( listeners[ channelId ] ){
					if ( callback ){
						listeners[ channelId ] = _.filter( listeners[ channelId ], function( item ){
							return item !== callback;
						} )
					}
					else{
						listeners[channelId] = [];
					}
				}
				return dispatchService;
			};

			function triggerChannelUpdate( channelId, msg ){
				function handleChannel( cid ){
					if( listeners[cid] && listeners[cid].length ){
						flushChannelArchive( cid );
						angular.forEach( listeners[cid], function( callback ){
							callback( msg );
						} );
					}
					else if ( cid !== CHANNEL_ALL ){
						( archive[cid] = archive[cid] || [] ).push( msg );
					}
				}

				if( channelId != CHANNEL_ALL ){
					handleChannel( channelId );
				}
				//All channel's listeners wants to get all updates
				handleChannel( CHANNEL_ALL );
				$rootScope.$apply();
			}

			function flushChannelArchive( channelId ){
				var callback;
				if( listeners[channelId]
					&& ( callback = listeners[channelId][0] )
					&& archive[channelId]
					&& archive[channelId].length
					){
					while( archive[channelId].length ){
						callback( archive[channelId].shift() );
					}
				}
			}

			dispatchService.listen( 'sys::ping', function (){
				chrome.runtime.sendMessage( { action : 'sys::pong' }  );
			});
			init();

			return dispatchService;
		}] );
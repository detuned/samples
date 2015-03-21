angular.module( 'index' )
	.service( 'listApiService', [ '$log', 'apiService', function( $log, apiService ){
		var
			CHANNEL_ID_LIST = 'list',
			currentConditionsId = 0,
			currentConditions = {},
			listeners = [],
			listApiService = {},
			isInitialized = false,
			apiType = null,//As long as it's not defined, the config's defaultApiTransport will be used
			init = function (){
				if ( isInitialized ){
					return;
				}
				api().listen( CHANNEL_ID_LIST, onMessage );
				api().on( 'reconnect', onReconnect );
				isInitialized =  true;
			},
			destroy = function (){
				api().unListen( CHANNEL_ID_LIST, onMessage );
				api().off( 'reconnect', onReconnect() );
				isInitialized = false;
			};


		function onMessage( msg ){
			if( + msg.id == currentConditionsId ){
				angular.forEach( listeners, function( listener ){
					listener( msg );
				} )
			}
		}

		function onReconnect(){
			var callback = listeners[0];
			if ( callback && currentConditions ){
				listApiService.unListen( callback );
				listApiService.listen( currentConditions, callback );
			}
		}

		listApiService.listen = function( conditions, callback ){
			init();
			listeners = [ callback ];
			currentConditionsId ++;
			currentConditions = angular.copy( conditions );
			if ( conditions.from && conditions.to ){
				api().setPingingOff();
			}
			else{
				api().setPingingOn();
			}
			api().send( angular.extend( { id : currentConditionsId }, conditions ) );
		};

		listApiService.unListen = function( callback ){
			listeners = _.filter( listeners, function( listener ){
				return listener !== callback;
			} );
		};

		listApiService.setApiTransport = function ( type ){
			apiType = type;
			destroy();
			init();
		};

		listApiService.getTimeToUpdate = function (){
			return api().getTimeToUpdate();
		};

		listApiService.getUpdateInterval = function (){
			return api().getUpdateInterval();
		};

		listApiService.resetUpdateInterval = function (){
			return api().resetUpdateInterval();
		};

		function api(){
			return apiService.getInstance( apiType );
		}


		return listApiService;
	}] );
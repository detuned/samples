define( 'dispatcher', [
	'underscore',
	'jquery',
	'log',
	'api',
	'api/tasks',

	'clientHandlers/sys',

	'serverHandlers/sys',

], function( _, $, _log, api, tasks, sysClient, sysServer ){
	var
		ERROR_OK = '0. Ok',
		clientHandlers = {
			sys : sysClient
		},
		serverHandlers = {
			sys : sysServer
		},
		dispatcher = {},
		log = _log.c( 'dispatcher' );


	dispatcher.init = _.once( function(){
		//Dispatching tab message
		chrome.runtime.onMessage.addListener( onTabMessage );

		//Dispatching server message
		api.listen( onServerMessage );
	} );

	dispatcher.getServerDispatchMethod = function( data ){
		return getMethod( data, serverHandlers );
	};

	dispatcher.getClientDispatchMethod = function( data ){
		return getMethod( data, clientHandlers );
	};


	/**
	 * A handler of message received from tab
	 * @param data
	 * @param tab
	 * @param response
	 * @returns {boolean}
	 */
	function onTabMessage( data, tab, response ){
		log.log( 'dispatch tab message', data );
		if( ! _.isObject( data ) ){
			data = { action : data };
		}
		data._tab = tab.tab;
		var
			method = getMethod( data, clientHandlers ),
			reject = function( msg ){
				log.warn( 'reject tab message', msg );
				response( { success : false, data : msg } );
			},
			resolve = function( msg ){
				log.log( 'resolve tab message', msg );
				response( { success : true, data : msg } );
			};
		if( $.isFunction( method ) ){
			$.when( method() ).then( resolve, reject );
		}
		else {
			log.warn( '(client dispatching)', method || 'cannot dispatch server message' + data );
			reject( method );
		}
		return true;
	}

	/**
	 * A handler of message received from server
	 * @param data
	 */
	function onServerMessage( data ){
		var error;
		log.log( 'dispatch server message', data );

		if( data.err && data.err !== ERROR_OK ){
			error = data.err;
			log.warn( 'got server error', data.err );
		}

		var method = getMethod( data, serverHandlers );
		if( $.isFunction( method ) ){
			//Appropriate method found
			if( data.tid ){
				tasks.dispatch( data.tid, method, data );
			}
			else {
				method( error
					? { _error : error }
					: {}
				);
			}
		}
		else {
			//Cannot find appropriate method
			if( data.tid ){
				log.warn( '(server dispatching) cannot dispatch task', data.tid, 'with', data, ' mark it as done' );
				tasks.done( data.tid );//XXX hm
			}
			else {
				log.warn( '(server dispatching)', method || 'cannot dispatch server message' + data );
			}
		}
	}

	function getMethod( data, handlers ){
		var
			caller = {
				method  : 'response',
				handler : null
			},
			params = {},
			parseStr = function( str ){
				var parts = str.split( '::' );
				caller.handler = parts[0];
				caller.method = parts[1];
			},
			parseObj = function( obj ){
				if( data.obj ){
					caller.handler = data.obj;
					if( data.act ){
						caller.method = data.act
					}
					params = _.omit( data, 'obj', 'act' );
				}
				else if( data.action ){
					parseStr( data.action );
					params = _.omit( data, 'action' );
				}
			},
			defer = $.Deferred(),
			promise = defer.promise();

		if( _.isObject( data ) ){
			parseObj( data );
		}
		else {
			parseStr( String( data ) );
		}

		if( ! caller.handler || ! caller.method ){
			return 'bad message received' + data;
		}

		if( ! handlers[ caller.handler ] ){
			return 'bad handler ' + caller.handler;
		}

		if( ! _.isFunction( handlers[ caller.handler ][ caller.method ] ) ){
			return 'handler ' + caller.handler + ' has no method ' + caller.method;
		}

		return function( extParams, omitParams ){
			var sendParams = _.extend( params, extParams || {} );
			if( omitParams ){
				sendParams = _.omit( sendParams, omitParams );
			}
			return handlers[ caller.handler ][ caller.method ]( sendParams );
		};
	}

	return dispatcher;
} );
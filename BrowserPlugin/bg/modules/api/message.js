define( 'api/message', [
	'underscore',
	'jquery',
	'config',
	'log',
	'utils',
	'api'
], function( _, $, config, _log, utils, api ){

	var
		globalId = 0,
		log = _log.c( 'message' );

	function Message( action, data, options ){
		data = data || {};
		options = _.defaults( options || {}, {} );
		var
			msg = {},
			mid = data.mid || generateId(),
			state = {
				sent : false,
				done : false
			},
			sentDefer = $.Deferred(),
			doneDefer = $.Deferred(),
			actionData;

		msg.whenDone = doneDefer.promise().then;
		msg.whenSent = sentDefer.promise().then;

		msg.getId = function(){
			return mid;
		};

		msg.send = function(){
			api.send( actionData ).then( function( params ){
				_.extend( data, params || {} );
				state.sent = true;
				sentDefer.resolve();
			} );
		};

		msg.done = function( params ){
			var doneData = ( params || {} ).data || {};
			log.log( 'done action=', action, ' mid=' + mid, ' params=', doneData );
			if( _.isArray( doneData ) ){
				doneData = {
					data : doneData
				};
			}
			_.extend( data, doneData );
			state.done = true;
			doneDefer.resolve( data );
		};

		msg.error = function( error ){
			log.warn( 'error mid=' + mid + ':' + error );
			state.done = true; //If server responded with error we obviously don't want to listen it again
			doneDefer.reject( { error : error } );
		};

		msg.export = function(){
			return {
				action  : action,
				data    : data,
				options : options,
				state   : state,
				mid     : mid
			}
		};

		function restore( stored ){
			action = stored.action;
			data = stored.data;
			options = stored.options;
			state = stored.state;
			mid = stored.mid;
		}

		function actualize(){
			actionData = _.extend( utils.decodeAction( action, data ), { mid : mid } );
			if( state.sent ){
				sentDefer.resolve();
			}
			if( state.done ){
				doneDefer.resolve( data );
			}
		}

		if( arguments.length == 1 && _.isObject( arguments[0] ) ){
			restore( arguments[0] );
		}

		if( ! mid ){
			mid = data.mid || generateId();
		}
		actualize();

		return msg;
	}

	function generateId(){
		return [ Date.now(), ++ globalId ].join( '-' );
	}

	return Message;
} );
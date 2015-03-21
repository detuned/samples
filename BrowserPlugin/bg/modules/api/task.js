define( 'api/task', [
	'underscore',
	'jquery',
	'config',
	'log',
	'api',
	'api/request'
], function( _, $, config, log, api, request ){

	function Task( tid, options ){
		options = _.defaults( options || {}, {
			onDone : function(){}
		} );
		var
			task = {},
			state = {
				received : false,
				acted    : false,
				done     : false
			},
			defers = {
				received : $.Deferred(),
				done     : $.Deferred()
			},
			receivedTimer;

		task.getId = function(){
			return tid;
		};

		task.done = function(){
			if ( receivedTimer ){
				clearTimeout( receivedTimer );
			}
			return request.send( 'sys::done', { tid : tid } ).then( function( data ){
				log.log( 'task', tid, 'mark done' );
				state.done = true;
				defers.done.resolve();
				options.onDone( tid );
			} );
		};

		task.received = function(){
			if ( receivedTimer ){
				clearTimeout( receivedTimer );
			}
			receivedTimer = setTimeout( function (){
				request.send( 'sys::received', { tid : tid } ).then( function(){
					state.received = true;
					defers.received.resolve();
				} );
			}, config.taskMarkReceivedDelay );
		};

		task.act = function( actionMethod ){
			var defer = $.Deferred();

			if( state.acted ){
				log.warn( 'task', tid, 'deny task action because it was acted previously' )
				// Protect from double action
				task.done().always( defer.reject );
			} else {
				state.acted = true;
				// First time action
				log.debug( 'task', tid, 'act' );
				$.when( actionMethod() ).then( function(){
					task.done().always( defer.resolve );
				} );
			}
			return defer.promise();
		};

		task.destroy = function (){
			defers.done = null;
			defers.received = null;
			if ( receivedTimer ){
				clearTimeout( receivedTimer );
			}
			task = null;
		};

		function actualize(){
			_.each( state, function( val, key ){
				if( val ){
					defers[key].resolve();
				}
			} );
		}

		actualize();
		task.received();

		return task;
	}

	return Task;
} );
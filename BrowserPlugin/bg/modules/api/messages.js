define( 'api/messages', [
	'underscore',
	'jquery',
	'config',
	'log',
	'storage',
	'api/message'
], function( _, $, config, _log, storage, message ){
	var
		messages = {},
		registry = {},
		log = _log.c( 'messages' );

	messages.send = function( action, data ){
		var
			defer = $.Deferred(),
			msg = message( action, data );
		saveMessage( msg );
		log.log( 'send', action, 'id=', msg.getId(), 'with data:', data );
		msg.whenDone( defer.resolve, defer.reject );
		msg.send();
		return defer.promise();
	};

	messages.done = function( mid, params ){
		var
			defer = $.Deferred(),
			msg = getMessage( mid );

		if( msg ){
			if( params._error ){
				msg.error( params._error );
			}
			else {
				msg.done( params );
			}
			deleteMessage( mid );
		}
		else {
			log.warn( 'cannot done unknown message ' + mid );
			defer.reject();
		}


		return defer.promise();
	};

	messages.getActiveMessages = function (){
		return registry;
	};

	messages.getActiveMessagesNum = function (){
		return _.keys( registry ).length;
	};

	messages.getMessage = getMessage;

	function getMessage( mid ){
		return registry[mid];
	}

	function saveMessage( msg ){
		registry[ msg.getId() ] = msg;
	}

	function deleteMessage( mid ){
		delete registry[mid];
	}


	return messages;
} );
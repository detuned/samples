define( 'serverHandlers/thread', [
	'underscore',
	'jquery',
	'config',
	'log',
	'services/threadBgService'
], function( _, $, config, _log, threadBgService ){
	var
		log = _log.c( 'threadServerHandler' ),
		thread = {};

	thread.noteAdd = function( params ){
		var defer = $.Deferred();
		if( ! params.thread ){
			log.warn( 'cannot add bad thread note', params )
		}
		else {
			threadBgService.addNoteToThread( params.thread, _.omit( params, 'thread' ) );
		}
		defer.resolve();
		return defer.promise();
	};

	thread.noteUpdate = function( params ){
		var defer = $.Deferred();
		if( ! params.thread ){
			log.warn( 'cannot update bad thread note', params )
		}
		else {
			threadBgService.updateThreadNote( params.thread, _.omit( params, 'thread' ) );
		}
		defer.resolve();
		return defer.promise();
	};

	thread.noteRemove = function( params ){
		var defer = $.Deferred();
		if( ! params.thread ){
			log.warn( 'cannot update bad thread note', params )
		}
		else {
			threadBgService.deleteThreadNote( params.thread, _.omit( params, 'thread' ) );
		}
		defer.resolve();
		return defer.promise();
	};

	thread.userList = function( params ){
		//Temporarily leave it here until server stop sending this deprecated action
		return true;
	};

	thread.userCount = function ( params ){
		var hasErrors = false;
		if ( isNaN( + params.userCount ) ){
			log.warn( 'userCount value is not presented in', params );
			hasErrors = true;
		}
		if( ! params.thread ){
			log.warn( 'cannot update userCount for bad thread', params );
			hasErrors = true;
		}
		if ( ! hasErrors ){
			threadBgService.setUserCount( params.thread, params.userCount );
		}
		return true;
	};

	return thread;
} );
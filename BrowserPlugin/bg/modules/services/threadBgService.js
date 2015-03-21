define( 'services/threadBgService', [
	'jquery',
	'log',
	'api/request',
	'utils/eventsFabric',
	'moment'
], function( $, _log, request, eventsFabric, moment ){
	var
		log = _log.c( 'threadService' ),
		events = eventsFabric.getInstance( { name : 'threadService' } ),
		triggerNoteAdd = events.trigger( 'noteAdd' ),
		triggerNoteUpdate = events.trigger( 'noteUpdate' ),
		triggerNoteDelete = events.trigger( 'noteDelete' ),
		triggerUserCountUpdate = events.trigger( 'userCountUpdate' ),
		threadBgService = {};

	threadBgService.subscribe = function( threadId, options ){
		var
			defer = $.Deferred(),
			sendData = {};
		if( ! threadId ){
			log.warn( 'Cannot subscribe to bad thread', threadId );
			defer.reject();
		}
		else {
			sendData.thread = threadId;
			if( options ){
				_.extend( sendData, _.omit( options, 'threadId' ) );
			}
			log.log( 'subscribing to thread', threadId, ' (url=', sendData.url, ') with data ', sendData );
			request.send( 'thread::subscribe', sendData )
				.then( function( res ){
					defer.resolve( res )
				}, defer.reject );
		}

		return defer.promise();
	};

	threadBgService.unSubscribe = function( threadId, options ){
		var defer = $.Deferred();
		if( ! threadId ){
			log.warn( 'Cannot unSubscribe from bad thread', threadId );
		}
		else {
			log.log( 'unsubscribing from thread', threadId );
			request.send( 'thread::unsubscribe', { thread : threadId } )
				.then( defer.resolve, defer.reject );
		}

		return defer.promise();
	};

	threadBgService.unSubscribeAll = function( options ){
		var defer = $.Deferred();
		log.log( 'going to unsubscribe from all threads' );
		request.send( 'thread::unsubscribeAll', {} )
			.then( defer.resolve, defer.reject );
		return defer.promise();
	};

	threadBgService.addNoteToThread = function( threadId, note ){
		log.log( 'add note to thread', threadId, 'with data', note );

		if( ! note.cre ){
			//XXX its much better to add cre value on server
			note.cre = moment().unix();
		}
		triggerNoteAdd( {
			threadId : threadId,
			note     : note
		} );
	};

	threadBgService.updateThreadNote = function( threadId, note ){
		log.log( 'update note of thread', threadId, 'with data', note );
		triggerNoteUpdate( {
			threadId : threadId,
			note     : note
		} );
	};

	threadBgService.deleteThreadNote = function( threadId, note ){
		log.log( 'remove note from thread', threadId );
		triggerNoteDelete( {
			threadId : threadId,
			note     : note
		} );
	};

	threadBgService.setUserCount = function( threadId, userCount ){
		log.log( 'userCount updated for thread', threadId, 'with', userCount );
		triggerUserCountUpdate( {
			threadId  : threadId,
			userCount : + userCount
		} )
	};

	threadBgService.onNoteAdd = events.on( 'noteAdd' );
	threadBgService.offNoteAdd = events.off( 'noteAdd' );
	threadBgService.onNoteUpdate = events.on( 'noteUpdate' );
	threadBgService.offNoteUpdate = events.off( 'noteUpdate' );
	threadBgService.onNoteDelete = events.on( 'noteDelete' );
	threadBgService.offNoteDelete = events.off( 'noteDelete' );
	threadBgService.onUserCountUpdate = events.on( 'userCountUpdate' );
	threadBgService.offUserCountUpdate = events.off( 'userCountUpdate' );

	return threadBgService;
} );
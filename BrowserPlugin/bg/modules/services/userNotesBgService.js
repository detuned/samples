define( 'services/userNotesBgService', [
	'underscore',
	'jquery',
	'config',
	'log',
	'api/request',
	'moment',
	'utils'
], function( _, $, config, _log, request, moment, utils ){
	var
		log = _log.c( 'userNotesService' ),
		timers = utils.timersManager(),
		userNotesBgService = {};


	userNotesBgService.addPageNote = function( data ){
		var defer = $.Deferred();
		if( ! data || ! data.note || ! data.url ){
			log.warn( 'cannot add wrong note ', data );
			defer.reject();
		}

		if( ! data.note.text ){
			log.warn( 'cannot add note with no text', data );
			defer.reject();
		}

		log.log( 'add note', data.note, ' for page ', data.url );
		request.send( 'userPage::noteAdd', {
			text : data.note.text,
			pub  : data.note.pub,
			url  : data.url
		} ).then( function( res ){
				if( ! res.cre ){
					res.cre = moment().unix();
				}
				defer.resolve( res );
			}, defer.reject );

		return defer.promise();
	};

	userNotesBgService.updatePageNote = function( data ){
		var defer = $.Deferred();
		if( ! data || ! data.note || ! data.note.noteId || ! data.url ){
			log.warn( 'cannot update wrong note ', data );
			defer.reject();
		}

		if( ! data.note.text ){
			log.warn( 'cannot save note with no text', data );
			defer.reject();
		}

		log.log( 'update note noteId=', data.note.noteId, 'with data', data.note, ' for page ', data.url );
		request.send( 'userPage::noteUpdate', {
			noteId : data.note.noteId,
			text   : data.note.text,
			pub    : data.note.pub || false,
			url    : data.url
		} ).then( defer.resolve, defer.reject );

		return defer.promise();
	};


	userNotesBgService.removePageNote = function( data ){
		var defer = $.Deferred();
		if( ! data || ! data.noteId || ! data.url ){
			log.warn( 'cannot remove wrong note ', data );
			defer.reject();
		}

		log.log( 'remove note', data.noteId, ' from page ', data.url );
		request.send( 'userPage::noteRemove', {
			noteId : data.noteId,
			url    : data.url
		} ).then( defer.resolve, defer.reject );

		return defer.promise();
	};

	userNotesBgService.getPublicNotes = function( data ){
		var defer = $.Deferred();
		request.send( 'userPage::pubNotes', _.pick( data, 'limit', 'skip', 'order', 'url' ) ).then( defer.resolve, defer.reject );
		return defer.promise();
	};

	(function(){

		var
			lastPubNotesView = 0,
			urlsData = {};

		function sendPubNotesViewForUrl( urlData ){
			log.log( 'set new lastPubNotesView ', urlData.utime, ' for page ', urlData.url );
			request.send( 'userPage::pubNotesView', {
				utime : urlData.utime,
				url   : urlData.url
			} ).then( function( res ){
					_.map( urlData.defers, function( item ){
						item.resolve( { utime : urlData.utime } );
					} )
				}, function( res ){
					_.map( urlData.defers, function( item ){
						item.reject( res );
					} )
				} );
		}

		userNotesBgService.setPubNotesView = function( data ){
			var defer = $.Deferred();
			if( ! data || ! data.utime || ! data.url ){
				log.warn( 'cannot update pubNotesView because of incorrect data', data );
				defer.reject();
			}

			if( ! urlsData[data.url] ){
				urlsData[data.url] = {
					url    : data.url,
					utime  : 0,
					defers : []
				};
			}

			urlsData[data.url].utime = Math.max( urlsData[data.url].utime, data.utime );
			urlsData[data.url].defers.push( defer );

			timers.setTimer( data.url, function(){
				sendPubNotesViewForUrl( _.clone( urlsData[data.url] ) );
				delete urlsData[data.url];
			}, 300 );


			return defer.promise();
		};


	})();


	return userNotesBgService;
} );
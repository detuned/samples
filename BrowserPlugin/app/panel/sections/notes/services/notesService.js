angular.module( 'plugin.panel' )
	.service( 'notesService', [
		'$log',
		'apiService',
		'userPageService',
		'dispatchService',
		function( $log, apiService, userPageService, dispatchService ){
			var notesService = {};


			notesService.pageNotes = userPageService.pageData.privateNotes;

			notesService.addPageNote = function( note ){
				note.pub = false;
				return apiService.request( 'userNotes::noteAdd', { note : note } );
			};

			notesService.updatePageNote = function( note ){
				return apiService.request( 'userNotes::noteUpdate', { note : note } ).then(function ( res ){
					addOrUpdateNote( note );
					return res;
				})
			};

			notesService.removePageNote = function( noteId ){
				return apiService.request( 'userNotes::noteRemove', { noteId : noteId } ).then(function ( res ){
					removeNoteFromList( noteId );
					return res;
				})
			};

			function addOrUpdateNote( note, list ){
				if( ! note || ! note.noteId ){
					$log.warn( 'notesService: cannot add bad note', note );
					return; // XXX right?
				}
				var oldNote;
				list = list || notesService.pageNotes;
				oldNote = _.find( list, function( item ){
					return item.noteId === note.noteId;
				} );
				if( oldNote ){
					$log.log( 'note with the same noteId', note.noteId, 'was found and updated with', note );
					extendNote( oldNote, note );
				}
				else {
					$log.log( 'new note was prepended to list', note );
					list.unshift( note );
				}
			}


			function removeNoteFromList( noteId, list ){
				if( ! noteId ){
					$log.warn( 'notesService: cannot remove bad note id=', noteId );
					return; // XXX right?
				}
				var noteIndex;
				list = list || notesService.pageNotes;
				_.find( list, function( item, index ){
					if ( item.noteId == noteId ){
						noteIndex = index;
						return true;
					}
				});
				if ( ! isNaN( noteIndex ) ){
					list.splice( noteIndex, 1 );
				}
			}

			function extendNote( note, newNote ){
				angular.forEach( [
					'noteId',
					'text',
					'pub'
				], function( key ){
					if ( key in newNote ){
						note[key] = newNote[key];
					}
				} );
			}


			//TODO: use filtered messages listening, only private ones!
			dispatchService
				.listen( 'userPage::noteAdd', function( data ){
					if( data && data.note ){
						if ( ! data.note.pub ){
							$log.log( 'notesService: got command to add private note', data.note );
							addOrUpdateNote( data.note );
						}
					}
					else {
						$log.warn( 'notesService: noteAdd fired with', data, 'but not applied' );
					}
				} )
				.listen( 'userPage::noteUpdate', function( data ){
					if( data && data.note && data.note.noteId ){
						if ( ! data.note.pub ){
							$log.log( 'notesService: got command to update private note', data.note.noteId, 'with data', data.note );
							addOrUpdateNote( data.note );
						}
					}
					else {
						$log.warn( 'notesService: noteUpdate fired with', data, 'but not applied' );
					}
				} )
				.listen( 'userPage::noteRemove', function( data ){
					if( data && data.noteId ){
						$log.log( 'notesService: got command to remove note', data.noteId );
						removeNoteFromList( data.noteId );
					}
					else {
						$log.warn( 'notesService: noteRemove fired with', data, 'but not applied' );
					}
				} );

			return notesService;
		}] );
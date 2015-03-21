angular.module( 'plugin.panel' )
	.service( 'chatService', [
		'$log',
		'$timeout',
		'$q',
		'$document',
		'configService',
		'apiService',
		'userPageService',
		'dispatchService',
		'userService',
		'utilsService',
		'eventsFabricService',
		'relationsService',
		function( $log, $timeout, $q, $document, configService, apiService, userPageService, dispatchService, userService, utilsService, eventsFabricService, relationsService ){
			var
				defaultLimit = 30,
				hasArchive = false,
				chatService = {},
				events = eventsFabricService.getInstance( { name : 'chatService' } ),
				newMessagesCount = 0, //For performance issues
				newMessages = {},
				userListCount = 0,
				messagesLastView = 0,
				saveLastView = _.debounce( function(){
					return apiService.request( 'userPage::pubNotesView', { utime : getLastView() } );
				}, 300 ),
				reHandleMessages = _.debounce( function(){
					angular.forEach( chatService.messages, function( msg ){
						handleMessage( msg, 'force' );
					} );
				}, 300 ),
				archiveDefer;

			chatService.messages = [];
			newMessages = {};

			chatService.addMessage = function( note ){
				note.pub = true;
				return apiService.request( 'userNotes::noteAdd', { note : note } );
			};

			chatService.removeMessage = function( noteId ){
				return apiService.request( 'userNotes::noteRemove', { noteId : noteId } ).then( function( res ){
					removeMessageFromList( noteId );
					return res;
				} )
			};

			chatService.updateMessage = function( msg ){
				return apiService.request( 'userNotes::noteUpdate', { note : cleanMessageForExport( msg ) } ).then( function( res ){
					addOrUpdateMessage( msg );
					return res;
				} )
			};


			chatService.hasArchive = function(){
				return hasArchive;
			};

			chatService.getArchive = function( options ){
				if( archiveDefer ){
					return archiveDefer.promise;
				}
				archiveDefer = $q.defer();
				options = _.defaults( options || {}, {
					order : 'desc',
					limit : 30,
					skip  : chatService.messages.length
				} );
				apiService.request( 'userNotes::pubNotes', options ).then( function( res ){

					if( res.data && res.data.length ){
						hasArchive = ( res.data.length >= defaultLimit );
						while( res.data.length ){
							chatService.messages.unshift( handleMessage( res.data.shift() ) );
						}
					}
					else {
						hasArchive = false;
					}
					archiveDefer.resolve();
					archiveDefer = null;
				}, archiveDefer.reject );

				return archiveDefer.promise;
			};

			chatService.getUserOnlineMode = function( userId ){
				return relationsService.isUserOnline( userId )
					? 10
					: 0;
			};


			chatService.isNewMessage = function( msg ){
				return msg && msg.noteId && newMessages[msg.noteId];
			};


			chatService.setMessageViewed = function( message ){
				$log.log( 'chatService: set message viewed', message.cre, message.noteId, message.text );
				if( message && message.noteId ){
					if( newMessages[ message.noteId ] ){
						delete newMessages[ message.noteId ];
						applyNewMessagesCount( Math.max( 0, newMessagesCount - 1 ) );
					}
					setLastView( message.cre );
				}
			};

			chatService.setAllMessagesViewed = function(){
				$log.log( 'chatService: set all messages viewed (have', newMessagesCount, ')' );
				utilsService.clearObject( newMessages );
				applyNewMessagesCount( 0 );
				setLastView( messagesLastView );
			};

			chatService.getNewMessagesCount = function(){
				return newMessagesCount;
			};

			chatService.getOnlineUsersCount = function(){
				return userListCount;
			};

			chatService.on = events.on();
			chatService.off = events.off();


			function emptyList(){
				utilsService.clearArray( chatService.messages );
				utilsService.clearObject( newMessages );
				applyNewMessagesCount( 0 );
			}


			function addOrUpdateMessage( msg, list ){
				if( ! msg || ! msg.noteId ){
					$log.warn( 'chatService: cannot add bad message', msg );
					return; // XXX right?
				}
				var
					oldMsg,
					newMsg;
				list = list || chatService.messages;
				oldMsg = _.find( list, function( item ){
					return item.noteId === msg.noteId;
				} );
				if( oldMsg ){
					$log.log( 'chatService: message with the same noteId', msg.noteId, 'was found and updated with', msg );
					newMsg = handleMessage( msg );
					extendMessage( oldMsg, newMsg );
				}
				else {
					newMsg = addMessage( handleMessage( msg ), list );
				}
				return newMsg;
			}

			function addMessage( msg, list ){
				var addedMessage;
				if( ! msg || ! msg.noteId ){
					$log.warn( 'chatService: cannot add bad message', msg );
					return; // XXX right?
				}
				list = list || chatService.messages;
				$log.log( 'chatService: new message was appended to list', msg );
				addedMessage = handleMessage( msg );
				list.push( addedMessage );
				return addedMessage;
			}

			function handleMessage( msg, force ){
				if( angular.isUndefined( msg.isOwn ) || force ){
					msg.isOwn = msg.uid && ( msg.uid + '' === userService.uid + '' );
				}
				if ( msg.uid && ! msg.avatar ){
					msg.avatar = utilsService.urlTemplate( configService.avatarUrl, { uid : msg.uid } );
				}
				if( angular.isUndefined( msg.isEditable ) || force ){
					//Could be changed with more smart checking grants
					msg.isEditable = userService.hasGrant( 'changeAnyChatMessages' )
						|| ( msg.isOwn && userService.hasGrant( 'changeOwnChatMessages' ) );
				}
				if( angular.isUndefined( msg.isDeletable ) || force ){
					//Could be changed with more smart checking grants
					msg.isDeletable = userService.hasGrant( 'deleteAnyChatMessages' )
						|| ( msg.isOwn && userService.hasGrant( 'deleteOwnChatMessages' ) );
				}
				if( ! msg.name || force ){
					msg.name = msg.name || utilsService.l10n( 'user_anonymous_name' );
				}
				return msg;
			}

			function cleanMessageForExport( msg ){
				return _.omit( utilsService.cleanAngularObject( msg ), 'isOwn', 'isOwn', 'isEditable', 'isDeletable', 'name' );
			}


			function removeMessageFromList( noteId, list ){
				if( ! noteId ){
					$log.warn( 'chatService: cannot remove bad message id=', noteId );
					return; // XXX right?
				}
				var msgIndex;
				list = list || chatService.messages;
				_.find( list, function( item, index ){
					if( item.noteId == noteId ){
						msgIndex = index;
						return true;
					}
				} );
				if( ! isNaN( msgIndex ) ){
					list.splice( msgIndex, 1 );
				}
				if( newMessages[noteId] ){
					delete newMessages[noteId];
					applyNewMessagesCount( _.keys( newmessages ).length );
				}

			}

			function extendMessage( msg, newMsg ){
				angular.forEach( [
					'noteId',
					'text',
					'pub',
					'name'
				], function( key ){
					if( key in newMsg ){
						msg[key] = newMsg[key];
					}
				} );
			}

			function getLastView(){
				return userPageService.pageData.lastPubNotesView || 0;
			}

			function setLastView( value ){
				if( value && ( value > getLastView() ) ){
					$log.log( 'chatService: setLastView to ', value, '(old:', getLastView(), ')' );
					userPageService.pageData.lastPubNotesView = value;
					saveLastView();
				}
			}

			function actualizeNewMessages( force ){
				var
					lastView = getLastView(),
					msg;
				$log.log( 'chatService: actualize new messages according new value of lastView', lastView );
				if( force ){
					utilsService.clearObject( newMessages );
					applyNewMessagesCount( 0 );
					for( var i = chatService.messages.length - 1; i >= 0; i -- ){
						msg = chatService.messages;
						if( ! markMessage( msg, true ) ){
							break;
						}
					}
					applyNewMessagesCount( _.keys( newMessages ).length );
				}
				else {
					_.each( newMessages, function( msg, noteId ){
						if( ! lastView || ! msg.cre || msg.cre < lastView ){
							delete newMessages[noteId];
						}
					} );
					applyNewMessagesCount( _.keys( newMessages ).length );
				}
			}

			function markMessage( msg, quite ){
				var lastView = getLastView();
				if( msg.cre ){
					if( msg.cre > messagesLastView ){
						messagesLastView = msg.cre;
					}
					if( ! msg.isOwn && msg.cre > lastView ){
						newMessages[ msg.noteId ] = msg;
						if( ! quite ){
							applyNewMessagesCount( _.keys( newMessages ).length );
							$log.log( 'chatService: mark message as new', msg, 'new newMessagesCount is', newMessagesCount );
						}
						return true;
					}
					else if( ! quite ){
						$log.log( 'chatService: skip marking msg as new', msg, 'lastView is', lastView );
					}
				}
				return false;
			}

			userPageService.listenPubNotesView( function( event, data ){
				actualizeNewMessages( ! ! data.force );
			} );


			dispatchService

				.listen( 'thread::resetPublicNotes', function( data ){
					var addingMessages = [];
					if( data && data.notes ){
						if( ! data.notes.length ){
							// The nothing is a result too!
							data.notes = [];
						}

						emptyList();
						$log.debug( 'chatService: loaded messages:', data.notes );
						addingMessages = _.map( data.notes.reverse(), function( msg ){
							markMessage( handleMessage( msg ), true );
							return msg;
						} );
						applyNewMessagesCount( _.keys( newMessages ).length );
						$log.log( 'chatService: got command to reset. Got', data.notes.length, 'message(s). Total new messages count now is', newMessagesCount );
						utilsService.updateArray( chatService.messages, addingMessages );

						if( chatService.messages.length >= defaultLimit ){
							hasArchive = true;
						}
					}
					else {
						$log.warn( 'chatService: resetPublicNotes fired with', data, 'but not applied' );
					}
				} )
				.listen( 'thread::addPublicNote', function( data ){
					var addedMessage;
					if( data && data.note && data.note.noteId ){
						$log.log( 'chatService: got command to add message', data.note );
						addedMessage = addMessage( data.note );
						markMessage( addedMessage );
						events.trigger( 'newMessage' )( addedMessage );
					}
					else {
						$log.warn( 'chatService: noteAdd fired with', data, 'but not applied' );
					}
				} )
				.listen( 'thread::updatePublicNote', function( data ){
					var updatedMessage;
					if( data && data.note && data.note.noteId ){
						$log.log( 'chatService: got command to update message', data.note );
						updatedMessage = addOrUpdateMessage( data.note );
						if( updatedMessage ){
							markMessage( updatedMessage );
						}
						events.trigger( 'updateMessage' )( updatedMessage );
					}
					else {
						$log.warn( 'chatService: updatePublicNote fired with', data, 'but not applied' );
					}
				} )
				.listen( 'thread::deletePublicNote', function( data ){
					if( data && data.note && data.note.noteId ){
						$log.log( 'chatService: got command to delete message', data.note );
						removeMessageFromList( data.note.noteId );
						events.trigger( 'deleteMessage' )( data.note );
					}
					else {
						$log.warn( 'chatService: deletePublicNote fired with', data, 'but not applied' );
					}
				} )

				.listen( 'thread::publicUserCountUpdate', function( data ){
					if( data && ! isNaN( + data.userCount ) ){
						userListCount = + data.userCount;
						$log.debug( 'chatService: got command to update userCount',userListCount );
					}
					else {
						$log.warn( 'chatService: publicUserCountUpdate fired with', data, 'but not applied' );
					}
				} );

			userService.on( 'userChange', reHandleMessages );


			function applyNewMessagesCount( v ){
				var title;
				newMessagesCount = v;
				//Update document title
				title = document.title.replace( /^[0-9]+:: /, '' );
				if ( newMessagesCount > 0 ){
					title = newMessagesCount + ':: ' + title;
				}
				document.title = title;
			}

			return chatService;
		}] );
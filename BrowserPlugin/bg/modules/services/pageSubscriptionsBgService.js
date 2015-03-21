define( 'services/pageSubscriptionsBgService', [
	'underscore',
	'jquery',
	'config',
	'log',
	'services/userPageBgService',
	'services/threadBgService'
], function( _, $, config, _log, userPageBgService, threadBgService ){
	var
		/**
		 * By page id as key
		 */
			subscriptions = {},
		log = _log.c( 'pageSubscriptions' ),
		pageThreads = {
			publicNotes  : {
				actions   : {
					notesReset      : {
						name : 'thread::resetPublicNotes',
						options : {
							activeOnly : true
						}
					},
					noteAdd         : {
						name : 'thread::addPublicNote'
					},
					noteUpdate      : {
						name : 'thread::updatePublicNote'
					},
					noteDelete      : {
						name : 'thread::deletePublicNote'
					},
					userCountUpdate : {
						name    : 'thread::publicUserCountUpdate',
						options : {
							activeOnly : true,
							preserve   : true
						}
					}
				},
				getId     : function( pageId ){
					return 'page-pub-' + pageId;
				},
				getPageId : function( threadId ){
					var m = threadId.match( /^page-pub-(.+)$/ );
					return m
						? m[1]
						: false;
				},
				broadcast : function( actionId, threadId, data ){
					var action = this.actions[ actionId ];
					userPageBgService.broadcastSameTabs(
						this.getPageId( threadId ),
						action.name,
						data,
						action.options || {}
					);
				}
			},
			privateNotes : {
				actions   : {
					noteAdd    : {
						name : 'thread::addPrivateNote'
					},
					noteUpdate : {
						name : 'thread::updatePrivateNote'
					},
					noteDelete : {
						name : 'thread::deletePrivateNote'
					}
				},
				getId     : function( pageId ){
					return 'page-pri-' + pageId;
				},
				getPageId : function( threadId ){
					var m = threadId.match( /^page-pri-(.+)$/ );
					return m
						? m[1]
						: false;
				},
				broadcast : function( action, threadId, data ){
					userPageBgService.broadcastSameTabs(
						this.getPageId( threadId ),
						this.actions[ action ],
						data
					);
				}
			}
		},
		basePageThreads = [
			'publicNotes' //TODO change to private
		],
		pageSubscriptionsBgService = {};

	userPageBgService.onRegisterTab( function( event, tab ){
		actualizePageSubscribe( tab.getPageId() );
	} );

	userPageBgService.onUnregisterTab( function( event, tabData ){
		actualizePageUnSubscribe( tabData.pageId );
	} );

	threadBgService.onNoteAdd( function( event, data ){
		handleNoteEvent( 'noteAdd', data );
	} );

	threadBgService.onNoteUpdate( function( event, data ){
		handleNoteEvent( 'noteUpdate', data );
	} );

	threadBgService.onNoteDelete( function( event, data ){
		handleNoteEvent( 'noteDelete', data );
	} );

	threadBgService.onUserCountUpdate( function( event, data ){
		handleNoteEvent( 'userCountUpdate', data );
	} );


	pageSubscriptionsBgService.init = _.once( function(){
		//TODO
	} );

	pageSubscriptionsBgService.subscribePage = subscribePage;

	pageSubscriptionsBgService.unSubscribePage = unSubscribePage;

	function actualizePageSubscribe( pageId ){
		if( ! pageId ){
			return;
		}
		var tabs = userPageBgService.getTabsByPageId( pageId );
		if( tabs.length /*&& ! ( subscriptions[ pageId ] || ! subscriptions[ pageId ].threads.length )*/ ){
			// It's specially. Subscribe every time even if
			// it has already. It's needed to get fresh initial data for page
			subscribePage( pageId );
		}
	}

	function actualizePageUnSubscribe( pageId ){
		if( ! pageId ){
			return;
		}
		var tabs = userPageBgService.getTabsByPageId( pageId );
		if( ! tabs.length && subscriptions[ pageId ] && subscriptions[ pageId ].threads.length ){
			unSubscribePage( pageId );
		}
	}

	function subscribePage( pageId, threads ){
		if( ! subscriptions[pageId] ){
			subscriptions[pageId] = {
				threads : []
			};
		}
		threads = threads || basePageThreads;
		log.log( 'going to subscribe page', pageId, ' to ', threads );
		return $.when.apply( $, _.map( threads, function( threadName ){
			var
				pageThread = pageThreads[threadName],
				threadId = pageThread.getId( pageId );
			return threadBgService.subscribe( threadId, {
				url : userPageBgService.getPageUrl( pageId )
			} )
				.then( function( data ){
					subscriptions[pageId].threads.push( threadId );
					pageThread.broadcast( 'notesReset', threadId, {
						// The nothing is a result too!
						notes : data && data.data && data.data.length
							? data.data
							: []
					} );
				} );
		} ) );
	}

	function unSubscribePage( pageId, threads ){
		if( ! subscriptions[pageId] || ! subscriptions[pageId].threads.length ){
			return;
		}
		threads = threads || subscriptions[pageId].threads;
		log.log( 'going to unsubscribe page', pageId, ' from ', threads );
		return $.when.apply( $, _.map( threads, function( threadId ){
			return threadBgService.unSubscribe( threadId ).then( function(){
				subscriptions[pageId].threads = _.filter( subscriptions[pageId].threads, function( item ){
					return item !== threadId;
				} );
			} )
		} ) );
	}

	function handleNoteEvent( action, data ){
		if( ! data || ! data.threadId ){
			log.info( 'cannot handle thread note of action', action, 'with data', data );
			return;
		}
		var
			pageThread = getThreadHandlerById( data.threadId );

		if( ! pageThread ){
			log.info( 'unknown type of thread', data.threadId );
			return;
		}
		pageThread.broadcast( action, data.threadId, data );
	}

	function getThreadHandlerById( threadId ){
		return _.find( pageThreads, function( t ){
			return t.getPageId( threadId );
		} )
	}


	return pageSubscriptionsBgService;
} );
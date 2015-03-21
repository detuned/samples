(function( global ){
	var UsersRegistry = global.UsersRegistry;
	/**
	 * Main controller and namespace
	 * Includes all chat functionality
	 *
	 * Note that presented here is short incomplete version.
	 */
	global.ChatController = (function(){
		var
			/**
			 * Main chat container
			 * @type {jQuery} */
				$chat,
			/** @type {Insulator()} */
				isr,

			/** @type {UsersRegistry.UserModel()} */
				activeUser,

			/**
			 * Storage of main chat params that must be preserved
			 * even between page reloads
			 */
				state = (function(){
				var
					_defaultState = {
						open            : false,
						height          : 500,
						typefieldHeight : 60,
						sendCtrlEnter   : false,
						hideCitations   : false
					},
					_state = $.extend( {}, _defaultState );

				function saveState(){
					if( ! window.localStorage ){
						return false;
					}
					window.localStorage.setItem( 'chat.state', $.toJSON( _state ) );
				}

				function loadState(){
					if( ! window.localStorage ){
						return false;
					}
					var
						loaded;
					try{
						loaded = $.parseJSON( window.localStorage.getItem( 'chat.state' ) );
					}
					catch( e ) {
					}

					if( loaded ){
						_state = $.extend( {}, loaded );
					}
				}

				loadState();

				return {

					reset : function(){
						_state = $.extend( {}, _defaultState );
						if( window.localStorage ){
							window.localStorage.del( 'chat.state' );
						}
					},

					'set' : function( key, value, save ){
						if( $.isPlainObject( key ) ){
							$.extend( _state, key );
						}
						else if( value === null ){
							delete _state[ key ];
						}
						else {
							_state[ key ] = value;
						}
						if( save !== false ){
							saveState();
						}
					},
					'get' : function( key, defaultValue ){
						var value = _state[ key ];
						return typeof value != 'undefined'
							? value
							: defaultValue || _defaultState[ key ];
					}
				}
			})(),

			/**
			 * Controller of the smile choosing panel
			 */
				smilePanel = (function(){
				var
					isOpen = false,
					instance = $.eventDriven( {
						init : function(){
							isr.c( 'smile-button' )
								.on( 'click', toggle )
								.on( 'mousedown', function( /* Event */e ){
									$( instance ).trigger( 'preOpen' );
								} );
							isr.c( 'smile-panel' ).on( 'click', isr.cl( 'smile' ), function( /* Event */e ){
								var
									$target = $( this ).find( '>.smile' );
								$( instance ).trigger( 'smileSelect', {
									code : $target.data( 'code' )
								} );
								close();
							} );
						}
					} );

				function open(){
					isr.c( 'smile-panel' ).fadeIn( 200 );
					isr.c( 'smile-button' ).addClass( isr._vv( 'smile-button', 's', 'active' ) )
					$( document ).on( 'click.chatSmilePanel', function( /* Event */e ){
						if( ! $( e.target ).is( j(
							isr.cl( 'smile-button' ), ', ',
							isr.cl( 'smile-panel' ), ', ',
							isr.cl( 'smile-panel' ), ' *'
						) ) ){
							close();
						}

					} );
					isOpen = true;
				}

				function close(){
					isr.c( 'smile-panel' ).fadeOut( 200 );
					isr.c( 'smile-button' ).removeClass( isr._vv( 'smile-button', 's', 'active' ) );
					$( document ).off( 'click.chatSmilePanel' );
					isOpen = false;
				}

				function toggle(){
					if( isOpen ){
						close();
					}
					else {
						open();
					}
				}

				function triggerEvent( event, eventData ){
					isr.c( 'smile-panel' ).triggerHandler( event, [ eventData ] );
				}

				return instance;
			})(),


			/**
			 * Controller of sidebar contains user list
			 */
				usersList = (function(){
				var
					_usersListOptions = {
						visibleNum : 4
					},
					/**
					 * Controller of user list item
					 * @param {UsersRegistry.UserModel()} user
					 */
						UserListItem = function( user ){
						var
							_user = user,
							/** @type {jQuery} */
								$user = $( j( '<li class="', isr._clp( 'users-list.item' ), '" />' ) ),
							/**
							 * Public of UserListItem instance
							 */
								instance = $.eventDriven( {
								/**
								 * @param {jQuery} $parent
								 */
								appendTo      : function( $parent ){
									$user.appendTo( $parent );
									handleContainer();
								},
								prependTo     : function( $parent ){
									$user.prependTo( $parent );
									handleContainer();
								},
								setState      : setState,
								hasState      : hasState,
								expand        : function(){
									setState( 'invisible', true );
									setState( 'collapsed', false );

									setTimeout( function(){
										setState( 'invisible', false );
									}, 50 )
								},
								collapse      : function(){
									setState( 'collapsed', true );
								},
								user          : _user,
								triggerActive : function(){
									if( ! hasState( 'active' ) ){
										$( instance ).trigger( 'setActive', instance );
									}
								},
								moveTop       : function(){
									instance.prependTo( $user.parent() );
								},
								remove        : function(){
									$user.remove();
								},
								getHeight     : function(){
									return $user.outerHeight( true );
								}
							} );

						user
							.getData( [ 'avatar', 'name', 'unread', 'online' ] )
							.done( render );
						user
							.on( 'change:unread', function( /* Event */e, unread ){
								if( ! hasState( 'active' ) || ! unread ){
									$user.find( isr.cl( 'users.unread-num' ) ).html( unread || 0 );
									setState( 'unread', ! ! Number( unread ) );
								}
							} )
							.on( 'change:online', function( /* Event */e, online ){
								setState( 'online', online );
							} );

						// XXX Maybe listen userNewMessagesIn only?
						messagesController.on( j( 'userNewMessages:', user.data.id ), function( /* Event */e, newMessages ){
							moveUserItemToTop( _user );
						} );

						function render(){
							$user.html( j(
								'<span class="', isr._clp( 'users.avatar-wrap' ), '">',
								'<img src="', _user.data.avatar, '" alt="" class="', isr._clp( 'users.avatar' ), '" />',
								'</span>',
								'<span class="', isr._clp( 'users.name' ), '">', _user.data.name, '</span>',
								'<span class="', isr._clp( 'users.info' ), '">',
								'<span class="', isr._clp( 'users.unread-num' ), '">',
								_user.data.unread || 0,
								'</span>',
								'<span class="', isr._clp( 'users.status' ), '" />',
								'</span>'
							) );

							_user.data.online && setState( 'online', true );
							Number( _user.data.unread ) && setState( 'unread', true );
						}

						function setState( state, bool ){
							$user.toggleClass( isr._vv( 'users-list.item', 's', state ), ! ! bool );
						}

						function hasState( state ){
							return $user.hasClass( isr._vv( 'users-list.item', 's', state ) );
						}

						function handleContainer(){
							$user
								.off( '.userListItemEvent' )
								.on( 'click.userListItemEvent', function(){
									instance.triggerActive();
								} )
								.on( 'click.userListItemEvent', isr.cl( 'users.delete' ), function( /* Event */e ){
									e.stopPropagation();
									$( instance ).trigger( 'delete', instance );
								} )
						}

						return instance;
					},
					/** @type {UserListItem()[]} */
						items = [],
					itemsByUserId = {},
					totalItems = 0,
					loadedItems = 0,
					/** @type {UserListItem()} */
						activeItem,
					/** @type {$.Deferred()} */
						refreshing = $.Deferred(),
					isFull = false,

					/**
					 * Public of usersList instance
					 */
						instance = $.eventDriven( {
						init     : function(){
							isr.c( 'users.expand' ).click( function(){
								var
									itemHeight = items[0].getHeight(),
									duration = 500;

								if( hasState( 'collapsed' ) ){
									isr.c( 'users-list' )
										.height( isr.c( 'users-list' ).height() );
									$.each( items.slice( _usersListOptions.visibleNum ), function(){
										this.expand();
									} );
									isr.c( 'users-list' )
										.animate( { height : itemHeight * items.length  }, {
											duration : duration,
											complete : function(){
												isr.c( 'users-list' ).css( 'height', '' );
												setState( 'collapsed', false );
												$( instance ).trigger( 'expand' );
											},
											easing   : 'swing'
										} );
								}
								else {
									isr.c( 'users-list' )
										.animate( { height : itemHeight * _usersListOptions.visibleNum  }, {
											duration : duration,
											complete : function(){
												$.each( items.slice( _usersListOptions.visibleNum ), function(){
													this.collapse();
												} );
												isr.c( 'users-list' ).css( 'height', '' );
												setState( 'collapsed', true );
												$( instance ).trigger( 'collapse' );
											},
											easing   : 'swing'
										} );
								}
							} );

							clear();
							setState( 'collapsed', true );
							actualize();

							/* Listening to new messages received */
							messagesController.on( 'userNewMessages', function( /* Event */e, /* Object */newMessages ){
								var
								/* UserListItem() */
									item;
								if( newMessages.user && ! itemsByUserId[ newMessages.user.data.id ] ){
									/* Received messages for user has not list item */
									item = addItem( newMessages.user, true );
								}
							} );

							instance.on( 'expand', function(){
								isr.c( 'users' )
									.on( 'scroll.userList', function( /* Event */e ){
										if( ( refreshing && 'pending' == refreshing.state() ) || isFull ){
											return //TODO
										}
										var
											height = isr.c( 'users' ).height(),
											scrollHeight = isr.c( 'users' ).prop( 'scrollHeight' ),
											scrollTop = isr.c( 'users' ).scrollTop(),
											maxScroll = 0.9 * scrollHeight;
										if( scrollTop + height > maxScroll ){
											instance.refresh();
										}
									} );
							} );
							instance.on( 'full collapse', function(){
								isr.c( 'users' ).off( 'scroll.userList' );
							} );
						},
						/**
						 * Load and then render list
						 */
						refresh  : function( options ){
							var
								dfd = $.Deferred(),
								_options = {
									success  : function(){
									},
									complete : function(){
									},
									reset    : false,
									limit    : 10,
									offset   : loadedItems
								};
							options && $.extend( _options, options );
							if( _options.reset ){
								clear();
								_options.offset = 0;
								loadedItems = 0;
							}

							refreshing = $.ajax( {
								type : 'GET',
								url  : '/users/correspondents',
								data : {
									limit  : _options.limit,
									offset : _options.offset
								}
							} )
								.done( function( res ){
									var
										isCollapsed = hasState( 'collapsed' ),
										loaded = 0;
									if( res ){
										if( res.total ){
											totalItems = Number( res.total );
										}
										if( $.isArray( res.items ) ){
											loaded = res.items.length;
											$.each( res.items, function( itemNum, itemData ){
												var
													/** @type {UsersRegistry.UserModel()} */
														user = UsersRegistry.UserModel( itemData ),
													/** @type {UserListItem()} */
														item;
												if( user && ! itemsByUserId[ user.data.id ] ){
													item = instance.append( user );
													if( isCollapsed && items.length > _usersListOptions.visibleNum ){
														item.setState( 'collapsed', true );
													}
												}
											} );
											actualize();
										}
										loadedItems += loaded;
										if( loadedItems >= totalItems ){
											isFull = true;
											$( instance ).trigger( 'full' );
										}
									}
									_options.success();
									dfd.resolve();
									if( ! items.length ){
										$( instance ).trigger( 'empty' );
									}
								} )
								.always( _options.complete )
						},
						/**
						 * Activates user (start chat)
						 */
						activate : function( /* UsersRegistry.UserModel() */user, options ){
							var
								_options = {
									moveTop : false
								},
								/** @type {UserListItem()} */
									item = itemsByUserId[ user.data.id ];
							options && $.extend( _options, options );
							if( ! item ){
								/* Adding new item */
								item = instance.prepend( user );
							}
							if( activeItem ){
								activeItem.setState( 'active', false );
							}
							activeItem = item;
							activeItem.setState( 'active', true );
							if( _options.moveTop ){
								moveUserItemToTop( user );
							}
						},

						/**
						 * Removes user from list
						 */
						remove         : function( /* UsersRegistry.UserModel() */user ){
							var
								isActive,
								isCollapsed;
							if( itemsByUserId[ user.data.id ] ){
								isActive = itemsByUserId[ user.data.id ].hasState( 'active' );
								isCollapsed = itemsByUserId[ user.data.id ].hasState( 'collapsed' );
								itemsByUserId[ user.data.id ].remove();
								activeItem = null;
							}
							$.each( items, function( num, /* UserListItem() */item ){
								if( item.user.data.id == user.data.id ){
									items.splice( num, 1 );
									return false;
								}
							} );
							if( isActive && items[ 0 ] ){
								items[ 0 ].triggerActive();
							}
							if( ! isCollapsed && hasState( 'collapsed' ) ){
								/* Expand first of collapsed instead of one deleted */
								$.each( items, function( num, /* UserListItem() */item ){
									if( item.hasState( 'collapsed' ) ){
										item.setState( 'collapsed', false );
										return false;
									}
								} );
								actualize();
							}
						},
						append         : function( user ){
							return addItem( user );
						},
						prepend        : function( user ){
							return addItem( user, true );
						},
						getUserByIndex : function( index ){
							var dfd = $.Deferred();
							if( refreshing ){
								refreshing.done( function(){
									dfd.resolve(
										items[ index ]
											? items[ index ].user
											: undefined
									);
								} )
							}
							else {
								dfd.resolve(
									items[ index ]
										? items[ index ].user
										: undefined
								);
							}
							return dfd;
						},
						isEmpty        : function(){
							return ! items.length;
						}
					} );

				/**
				 *
				 *
				 * @param {UsersRegistry.UserModel()} user
				 * @param {Boolean} isPrepend
				 * @return {UserListItem}
				 */
				function addItem( user, isPrepend ){
					var
						item = UserListItem( user ),
						isEmpty = ! items.length;
					item.on( 'setActive', function( /* Event */e, /* UserListItem() */item ){
						$( instance ).trigger( 'setActive', item.user );
					} );
					itemsByUserId[ user.data.id ] = item;
					if( isPrepend ){
						items.unshift( item );
						item.prependTo( isr.c( 'users-list' ) );
					}
					else {
						items.push( item );
						item.appendTo( isr.c( 'users-list' ) );
					}
					if( isEmpty ){
						$( instance ).trigger( 'notEmpty' );
						item.triggerActive();
					}
					return item;
				}


				/**
				 * Places user item container to the top of list
				 * and actualizes users array
				 *
				 * @param user
				 */
				function moveUserItemToTop( user ){
					var
						index = getItemIndexByUser( user ),
						item;
					if( ! isNaN( index ) && ( item = items[ index ] ) ){
						item.prependTo( isr.c( 'users-list' ) );
						items.splice( index, 1 );
						items.unshift( item );

						item.expand();
						scrollTop();
					}
				}

				function clear(){
					isr.c( 'users-list' ).empty();
					items = [];
					itemsByUserId = {};
				}

				function actualize(){
					setState(
						'almostempty',
						! ! ( ! items.length || items.length <= _usersListOptions.visibleNum )
					);
				}

				function scrollTop(){
					isr.c( 'users' ).animate( {
						scrollTop : 0
					}, {
						duration : 200
					} );
				}

				function setState( state, bool ){
					isr.c( 'users' ).toggleClass( isr._vv( 'users', 's', state ), ! ! bool );
				}

				function hasState( state ){
					return isr.c( 'users' ).hasClass( isr._vv( 'users', 's', state ) );
				}

				/**
				 * @param {UsersRegistry.UserModel()}
				 */
				function getItemIndexByUser( user ){
					var res;
					$.each( items, function( index ){
						if( this.user.data.id == user.data.id ){
							res = index;
							return false;
						}
					} )
					return res;
				}

				return instance;
			})(),

			Message = function( data ){
				var
					_data = {
						/**
						 * Message id
						 * @type {Number}
						 */
						id   : undefined,
						/**
						 * Raw message text recieved from server
						 * @type {String}
						 */
						text : undefined,
						/**
						 * Message html ready to render
						 * (defining inside)
						 * @type {String}
						 */
						html : undefined,
						/**
						 * Send timestamp
						 * @type {Number} */
						ts   : undefined,
						/**
						 * Send date (counting inside based on ts)
						 * @type {Date}
						 */
						date : undefined,
						/**
						 * Is message outgoing
						 * @type {Boolean}
						 */
						out  : undefined
					},
					/** @type {Date} */
						date,
					instance,
					/** @type {jQuery} */
						$message = $( j( '<div class="', isr._cl( 'message' ), '" />' ) ),
					timer;


				function prepareText( text ){
					var res = Utilities.clearText( text );
					res = Utilities.codes2smiles( res );
					return res;
				}

				function render(){
					$message
						.html( j(
							'<div class="', isr._cl( 'message.date' ), '" />',
							'<div class="', isr._cl( 'message.body' ), '">',
							'<div class="', isr._cl( 'message.text' ), '">',
							_data.html,
							'</div>',
							'<span class="', isr._cl( 'message.cite' ), '" title="', GLOBAL.l10n( 'chatCitationsAdd' ), '" />',
							'<span class="', isr._cl( 'message.nose' ), '" />',
							'</div>'
						) );
				}

				function actualize(){
					$message
						.find( isr.cl( 'message.date' ) )
						.html( _data.date
							? getDateDiffStr( _data.date )
							: ''
						)
						.attr( 'title', _data.date
							? _data.date.format( 'd.m.Y H:i:s' )
							: ''
						);
				}

				function unsetTimer(){
					if( timer ){
						timer = null;
						clearTimeout( timer );
					}
				}

				function setTimer(){
					unsetTimer();
					if( ! $message.is( ':visible' ) || ! _data.date ){
						return;
					}
					var
						diffSec = ( ( new Date ).getTime() - _data.date.getTime() ) / 1000,
						interval;
					if( diffSec < 10 ){
						interval = 5;
					}
					else if( diffSec < 60 ){
						interval = 10;
					}
					else if( diffSec < 300 ){
						interval = 60;
					}
					else if( diffSec < 600 ){
						interval = 120;
					}
					else if( diffSec < 3600 ){
						interval = 300;
					}

					if( interval ){
						timer = setTimeout( function(){
							actualize();
							setTimer();
						}, interval * 1000 );
					}
				}

				function setState( state, bool ){
					$message.toggleClass( isr._vv( 'message', 's', state ), ! ! bool );
				}

				function onAddToDom(){
					actualize();
					setTimer();
					$message
						.off( '.MessageEvent' )
						.on( 'click.MessageEvent', isr.cl( 'message.cite' ), function(){
							$( instance ).trigger( 'cite', instance );
						} )
				}

				function setValue( k, v ){
					var prev = _data[ k ];
					_data[ k ] = v;
					if( prev != v ){
						$( instance ).trigger( j( 'change:', k ), v );
					}
				}

				instance = $.eventDriven( {
					getData   : function( key ){
						if( key ){
							return _data[ key ];
						}
						return $.extend( {}, _data );
					},
					setData   : function( d, v ){
						if( $.isPlainObject( d ) ){
							$.each( d, setValue );
						}
						else {
							setValue( d, v );
						}
						$( instance ).trigger( 'change', _data );
					},
					appendTo  : function( parent ){
						$message.appendTo( parent );
						onAddToDom();
					},
					prependTo : function( parent ){
						$message.prependTo( parent );
						onAddToDom();
					},
					setState  : setState
				} );

				instance.on( 'change:ts', function( /* Event */e, ts ){
					_data.date = new Date( + _data.ts );
					actualize();
					setTimer();
				} );
				instance.on( 'change:text', function( /* Event */e, text ){
					_data.html = prepareText( text );
					$mesage
						.find( isr.cl( 'message.text' ) )
						.html( _data.html );
				} )


				data && $.extend( _data, data );
				_data.html = prepareText( _data.text );
				render();

				if( _data.ts ){
					_data.date = new Date( + _data.ts );
					actualize();
					setTimer();
				}
				setState( 'out', _data.out );
				return instance;

			},

			messagesController = (function(){
				var
					/**
					 * Storage of all loaded messages
					 * Keyed by user id
					 */
						messages = {},
					addQueues = {},
					_data = {
						lastMsgId : undefined,
						userId    : undefined,
						token     : undefined
					},
					poller = (function(){
						var
							defaultBuildDelay = 200,
							buildDelay = defaultBuildDelay,
							maxBuildDelay = 5000,
							stepBuildDelay = 1000,
							buildTimer,
							request,
							instance = $.eventDriven( {
								run   : function(){
									if( ! request || 'pending' != request.state() ){
										build();
									}
								},
								reset : function(){
									destroy();
									build();
								},
								abort : function(){
									destroy();
								}
							} );

						function build( force ){
							resetBuildTimer();
							if( force !== true ){
								buildTimer = setTimeout( function(){
									build( true );
								}, buildDelay );
								return;
							}
							request = $.ajax( {
								type     : 'POST',
								url      : '/getmessages',
								data     : $.toJSON( {
									user_id : _data.userId,
									token   : _data.token,
									m       : _data.lastMsgId
								} ),
								timeout  : 90000,
								dataType : 'json',
								cache    : false
							} );

							request
								.done( function( res ){
									resetBuildDelay();
									$( instance ).trigger( 'data', { msgs : res } );
									//				    				instance.run();
								} )
								.fail( function( xhr, textStatus, errorThrown ){
									switch( errorThrown ){
										case 'abort':
											break;
										case 'timeout':
											resetBuildDelay();
											instance.reset();
											break;
										default :
											if( xhr.status == 401 ){
												$.removeCookie( 'PHPSESSID', { path : '/' } );
												SitePage.refresh();
											}
											else if( ! textStatus ){
												increaseBuildDelay();
												instance.reset();
											}
											break;
									}
								} )
						}

						function destroy(){
							if( request && 'pending' == request.state() ){
								resetBuildTimer();
								request.abort();
								request = null;
							}
						}

						function resetBuildTimer(){
							if( buildTimer ){
								clearTimeout( buildTimer );
								buildTimer = null;
							}
						}

						function increaseBuildDelay(){
							buildDelay = Math.min( maxBuildDelay, buildDelay + stepBuildDelay );
						}

						function resetBuildDelay(){
							buildDelay = defaultBuildDelay
						}

						return instance;
					})(),
					/**
					 * @param {UsersRegistry.UserModel()} user
					 */
						AddQueue = function( user ){
						var
							queue = [],
							req,
							queueDfd = $.Deferred().resolve(),
							instance = $.eventDriven( {
								push      : function( /* Message() */msg ){
									var
										dfd = $.Deferred();
									if( 'resolved' == queueDfd.state() ){
										queueDfd = $.Deferred();
									}

									queue.push( {
										dfd : dfd,
										msg : msg
									} );
									next();
									return dfd;
								},
								whenEmpty : function(){
									return queueDfd;
								}
							} );

						function next(){
							if( req ){
								/* Already sending */
								return false;
							}
							var
								item = queue.shift();
							if( ! item ){
								/* Queue is empty, nothing to do */
								queueDfd.resolve();
								return false;
							}
							req = $.ajax( {
								url  : '/messages/send',
								type : 'POST',
								data : {
									companion_id : user.data.id,
									text         : item.msg.getData( 'text' )
								}
							} )
								.done( function( res ){
									item.dfd.resolve( res );
								} )
								.fail( function( res ){
									item.dfd.reject( res );
								} )
								.always( function(){
									req = null;
									next();
								} );
						}

						return instance;
					},
					/**
					 * @return AddQueue()
					 */
						getUserAddQueue = function( /* UsersRegistry.UserModel() */user ){
						if( ! addQueues[ user.data.id ] ){
							addQueues[ user.data.id ] = AddQueue( user );
						}
						return addQueues[ user.data.id ];
					},
					getSlicedUserMessages = function( user, limit, offset ){
						var
							msgs = messages[ user.data.id ],
							start, end, length;
						if( ! msgs || ! msgs.messages || ! ( length = msgs.messages.length ) ){
							return [];
						}
						start = Math.max( 0, length - ( limit + offset ) );
						end = Math.max( start, length - offset );
						return msgs.messages.slice( start, end );
					},
					/**
					 * @param {UsersRegistry.UserModel()} user
					 * @param {Array} message model instances
					 */
						saveUserMessages = function( user, newMessages, options ){
						var
							dfd = $.Deferred(),
							_options = {
								/**
								 * True for history messages
								 */
								prepend  : false,
								reqNum   : 0,
								totalNum : 0
							},
							addedMessages = [],
							addedMessagesIn = [],
							addedMessagesOut = [],
							userMessages = messages[ user.data.id ];

						options && $.extend( _options, options );

						if( ! userMessages ){
							userMessages = messages[ user.data.id ] = {
								messages  : [],
								maxId     : 0,
								minId     : Number.POSITIVE_INFINITY,
								loadedNum : 0,
								totalNum  : 0
							};
						}
						if( _options.reqNum ){
							userMessages.loadedNum += _options.reqNum;
						}
						if( _options.totalNum ){
							userMessages.totalNum = _options.totalNum;
						}

						$.each( _options.prepend
							? newMessages.slice().reverse()
							: newMessages,
							function( msgNum, /* Message() */msg ){
								var
									msgId = Number( msg.getData( 'id' ) ),
									msgOut = msg.getData( 'out' );
								if( ! msgId ){
									/* Cannot store message without id */
									return;
								}
								if( _options.prepend && msgId < userMessages.minId ){
									userMessages.messages.unshift( msg );
									userMessages.minId = msgId;
									addedMessages.unshift( msg );
									if( msgOut ){
										addedMessagesOut.unshift( msg );
									}
									else {
										addedMessagesIn.unshift( msg );
									}
								}
								else if( ! _options.prepend && msgId > userMessages.maxId ){
									userMessages.messages.push( msg );
									userMessages.maxId = msgId;
									addedMessages.push( msg );
									if( msgOut ){
										addedMessagesOut.push( msg );
									}
									else {
										addedMessagesIn.push( msg );
									}
								}
							} );

						if( Number( userMessages.maxId ) > Number( _data.lastMsgId ) ){
							_data.lastMsgId = Number( userMessages.maxId );
							$( instance ).trigger( 'updateLastMsgId', _data.lastMsgId );
						}

						dfd.resolve( {
							addedMessages    : addedMessages,
							addedMessagesIn  : addedMessagesIn,
							addedMessagesOut : addedMessagesOut
						} );
						return dfd;
					},
					instance = $.eventDriven( {
						init                 : function( data ){
							data && $.extend( _data, data );
							poller
								.on( 'data', function( /* Event */e, data ){
									var msgsByUsers = {};
									if( data.msgs && data.msgs.length ){
										$.each( data.msgs, function( num, msgData ){
											var
												isOwn = + msgData.sender_id == + _data.userId,
												userId = isOwn
													? msgData.companion_id
													: msgData.sender_id,
												/** @type {Message()} */
													msg = Message( {
													id   : msgData.id,
													text : msgData.text,
													ts   : msgData.ts,
													out  : isOwn
												} );
											if( ! msgsByUsers[ userId ] ){
												msgsByUsers[ userId ] = [];
											}
											msgsByUsers[ userId ].push( msg );
										} );
										$.each( msgsByUsers, function( userId, msgs ){
											var user = UsersRegistry.UserModel( { id : userId } );
											instance.addUserMessages( user, msgs )
												.done( function( msgsData ){
													if( ! isNaN( user.data.unread ) ){
														user.setData(
															'unread',
															Number( user.data.unread ) + msgsData.addedMessagesIn.length
														);
													}
													triggerUserEvents( user, 'userNewMessages', msgsData.addedMessages );
													triggerUserEvents( user, 'userNewMessagesIn', msgsData.addedMessagesIn );
													triggerUserEvents( user, 'userNewMessagesOut', msgsData.addedMessagesOut );
												} )
										} );
									}
									poller.run();
								} )
								.run();
							instance.on( 'updateLastMsgId', function( /* Event */e, lastMsgId ){
								poller.reset();
							} )
						},
						getUserMessages      : function( /* UsersRegistry.UserModel() */user, options ){
							var
								dfd = $.Deferred(),
								_options = {
									offset  : 0,
									history : false
								},
								sendData = {
									companion_id : user.data.id,
									limit        : 10,
									offset       : 0
								},
								savedMessages = messages[ user.data.id ];
							options && $.extend( _options, options );
							if( _options.offset ){
								sendData.offset = _options.offset;
							}
							else if( _options.history && savedMessages.loadedNum ){
								sendData.offset = savedMessages.loadedNum;
							}


							if( savedMessages && savedMessages.loadedNum >= ( sendData.offset + sendData.limit ) ){
								dfd.resolve( {
									messages : getSlicedUserMessages( user, sendData.limit, sendData.offset ),
									user     : user
								} );
							}
							else {

								$.ajax( {
									type : 'POST',
									url  : '/messages',
									data : sendData
								} )
									.done( function( reqRes ){
										if(
											savedMessages
												&& savedMessages.loadedNum < sendData.limit
												&& ! sendData.offset
											){

											/**
											 * If messages of this user was stored
											 * but less than required number,
											 * we just reload all of them,
											 * reset storage and save new loaded messages
											 * instead of them
											 */
											savedMessages = messages[ user.data.id ] = {
												messages  : [],
												maxId     : 0,
												minId     : Number.POSITIVE_INFINITY,
												loadedNum : 0
											}

										}
										var res = [];
										if( reqRes.messages && reqRes.messages.length ){
											$.each( reqRes.messages, function( num, msgData ){
												res.push( Message( msgData ) );
											} );
										}
										getUserAddQueue( user ).whenEmpty().done( function(){
											saveUserMessages( user, res, {
												prepend  : ! ! sendData.offset,
												reqNum   : sendData.limit,
												totalNum : reqRes.total
											} )
												.done( function(){
													dfd.resolve( {
														messages : getSlicedUserMessages( user, sendData.limit, sendData.offset ),
														user     : user
													} );
												} )
										} );
									} );
							}
							return dfd;
						},
						/**
						 * Adds messages with id only!
						 *
						 * @param {UsersRegistry.UserModel()} user
						 * @param {Array} msgs
						 */
						addUserMessages      : function( user, msgs ){
							var
								dfd = $.Deferred(),
								queue = getUserAddQueue( user );
							queue.whenEmpty().done( function(){
								/* Message has id that means it was saved on server */
								saveUserMessages( user, msgs )
									.done( function( msgsData ){
										dfd.resolve( msgsData );
									} )
							} );
							return dfd;
						},
						/**
						 * Adds user message and saves it on server if it's not
						 *
						 * @param {UsersRegistry.UserModel()} user
						 * @param {Message()} msg
						 */
						addUserMessage       : function( user, msg ){
							var
								dfd = $.Deferred(),
								queue;
							if( msg.getData( 'id' ) ){
								instance.addUserMessages( user, [ msg ] )
									.done( function(){
										dfd.resolve( msg );
									} )
							}
							else {
								/* Message has no id, so need to be saved on server */
								queue = getUserAddQueue( user );
								queue
									.push( msg )
									.done( function( res ){
										if( ! res.id ){
											dfd.reject();
											return false;
										}
										msg.setData( 'id', res.id );
										if( res.ts && ! isNaN( Number( res.ts ) ) ){
											msg.setData( 'ts', Number( res.ts ) );
										}
										saveUserMessages( user, [ msg ] )
											.done( function( msgsData ){
												triggerUserEvents( user, 'userNewMessages', msgsData.addedMessages );
												triggerUserEvents( user, 'userNewMessagesIn', msgsData.addedMessagesIn );
												triggerUserEvents( user, 'userNewMessagesOut', msgsData.addedMessagesOut );
											} )
										dfd.resolve( msg );
									} );
							}
							return dfd;
						},
						markUserMessagesRead : function( /* UsersRegistry.UserModel() */user ){
							var dfd = $.Deferred();
							$.ajax( {
								url  : '/messages/read',
								type : 'POST',
								data : {
									companion_id : user.data.id
								}
							} )
								.done( function( res ){
									user.setData( 'unread', 0 );
									dfd.resolve();
								} )
							return dfd;
						},
						resetPolling         : function(){
							poller.reset();
						}
					} );


				function triggerUserEvents( user, eventName, messages ){
					if( messages.length ){
						$( instance ).trigger( j( eventName, ':', user.data.id ), { messages : messages, user : user } );
						$( instance ).trigger( eventName, { messages : messages, user : user } );
					}
				}

				return instance;
			})(),

			/**
			 * Public of ChatController
			 */
				instance = $.eventDriven( {
				Message   : Message,
				Utilities : Utilities,
				init      : function(){
					if( $chat ){
						/* Already initialized */
						return false;
					}
					$chat = $( '#chat-container' );
					isr = Insulator( {
						container : $chat,
						prefix    : 'chat'
					} );


					/* Setting up resizable areas */
					/* ..main container */
					$chat
						.resizable( {
							handles   : 's',
							minHeight : 300,
							stop      : function( /* Event */e, ui ){
								state.set( 'height', ui.size.height )
							}
						} );

					/* Listening to events */
					isr.c( 'minimizer' ).on( 'click', function(){
						instance.close();
					} );

					isr.c( 'typebox.send-shortcut.field' ).on( 'click', function(){
						state.set(
							'sendCtrlEnter',
							! ! Number( isr.c( 'typebox.send-shortcut.field' ).filter( ':checked' ).val() )
						);
					} );
					isr.c( 'citations-toggler' ).on( 'click', function(){
						var cl = isr._vv( '', 's', 'hide-citations' );
						$chat.toggleClass( cl );
						state.set( 'hideCitations', $chat.hasClass( cl ) )
					} );


					/* Initializing engines */

					/* ..usersList */
					usersList.init();
					usersList
						.on( 'setActive', function( /* Event */e, /* UsersRegistry.User() */user ){
							activateUser( user );
						} );

					/* ..smilePanel */
					smilePanel.init();

					/* ..typeField */
					typeField.init();
					typeField.bind( 'change', function( /* Event */e, eventData ){
						isr.c( 'typebox.citation' ).toggleClass( isr._cl( 'active' ), ! ! trimStr( strip_tags( eventData.html, [ 'p', 'span', 'div', 'br' ] ) ) )
					} );


					/* ..messenger */
					messenger.init();
					messenger.on( 'cite', function( /* Event */e, /* Message() */msg ){
						ChatCitations.add( {
							text : Utilities.clearText( msg.getData( 'text' ) )
						} )
					} );

					/* ..add message */
					isr.c( 'typebox-button' ).click( function(){
						var html = typeField.exportHtml();
						if( html ){
							messenger.addMessage( {
								text : html,
								out  : true
							} );
							typeField.empty();
						}
					} );

					/* ..messagesController */
					messagesController.init( {
						lastMsgId : GLOBAL.user.lastMsgId,
						userId    : GLOBAL.user.id,
						token     : $.cookie( 'PHPSESSID' )
					} );


					/* Applying state (saved if exists, or default) */
					$chat.height( state.get( 'height' ) );
					$chat.toggleClass(
						isr._vv( '', 's', 'hide-citations' ),
						! ! state.get( 'hideCitations' )
					);
					isr.c( 'typefield-wrap' ).height( state.get( 'typefieldHeight' ) );
					actualizeMsgboxHeight();

					isr.c( 'typebox.send-shortcut.field' )
						.prop( 'checked', false )
						.filter( j( '[value="', Number( ! ! state.get( 'sendCtrlEnter' ) ), '"]' ) )
						.prop( 'checked', true );

					function onHashUpdate( /* LocationHash.Data() */hashData ){
						if( hashData.parts[0] == 'chat' ){
							if( ! state.get( 'open' ) ){
								instance.open();
							}
						}
						else {
							if( state.get( 'open' ) ){
								instance.close();
							}
						}
					}

					if( state.get( 'open' ) ){
						/* Let's switch this off for a while */
						state.set( 'open', false, true );
					}
					LocationHash.addListener( onHashUpdate );
					onHashUpdate( LocationHash.getData() );

					/* Starting listen external events */
					GLOBAL.dispatcher.on( GLOBAL.dispatcher.events.USER_IGNORE, function( /* Event */e, userData ){
						removeUser( userData.id );
						messagesController.resetPolling();
					} );

					/* Starting listen inner events and translate */
					messagesController.on( 'userNewMessages', function( /* Event */e, /* Object */newMessages ){
						$( instance ).trigger( 'userNewMessages', newMessages );
					} );
				},
				open      : function( options ){
					var
						_options = {
							animate   : true,
							saveState : true,
							complete  : function(){
							},
							/**
							 * User to activate on open
							 * @type {UsersRegistry.User()}
							 */
							user      : undefined,
							scroll    : true
						};
					options && $.extend( _options, options );
					if( _options.saveState ){
						state.set( 'open', true, false );
						LocationHash.extend( { parts : [ 'chat' ] } )
					}
					if( _options.animate ){
						$chat
							.addClass( isr._vv( '', 's', 'inaction' ) )
							.slideDown( 400, function(){
								$chat.removeClass( isr._vv( '', 's', 'inaction' ) )
								completeOpen();
							} );
					}
					else {
						$chat.show();
						completeOpen();
					}
					function completeOpen(){
						$( document.body ).addClass( 'chat-opened' );
						onOpen();
						_options.complete();
						if( _options.user ){
							activateUser( _options.user, { moveTop : true } );
						}
						else if( ! activeUser ){
							usersList.getUserByIndex( 0 ).done( activateUser );
						}
						if( _options.scroll ){
							$( 'html' ).animate( { 'scrollTop' : 0 }, { duration : 400 } );
						}
						messenger.enable();
					}
				},
				close     : function( options ){
					var
						_options = {
							animate   : true,
							saveState : true,
							complete  : function(){
							}
						};
					options && $.extend( _options, options );
					messenger.disable();
					if( _options.saveState ){
						state.set( 'open', false, false );
					}
					if( _options.animate ){
						$chat
							.addClass( isr._vv( '', 's', 'inaction' ) )
							.slideUp( 400, function(){
								$( document.body ).removeClass( 'chat-opened' );
								$chat.removeClass( isr._vv( '', 's', 'inaction' ) )
								_options.complete();
								if( _options.saveState ){
									/*
									 * Need to clear hash after animation to avoid
									 * premature scrolling to top
									 */
									LocationHash.extend( { parts : [] } )
								}
							} );
						$( 'html' ).animate( {scrollTop : 0 }, { duration : 400 } );
					}
					else {
						$chat.hide();
						$( document.body ).removeClass( 'chat-opened' );
						if( _options.saveState ){
							LocationHash.extend( { parts : [] } )
						}
						_options.complete();
					}
				},
				toggle    : function( options ){
					if( ! state.get( 'open' ) ){
						this.open( options );
					}
					else {
						this.close( options );
					}
				}
			} );

		function actualizeMsgboxHeight(){
			isr.c( 'msgbox' ).css( 'bottom', isr.c( 'typebox' ).outerHeight() );
		}

		function onOpen(){
			if( ! arguments.callee._isInit ){
				/* First open */
				if( ! ChatCitations.isOnceLoaded() ){
					ChatCitations.initLoad();
				}
				usersList.refresh();
			}
			actualizeMsgboxHeight();
			typeField.focus();
			arguments.callee._isInit = true;
		}

		function activateUser( /* UsersRegistry.UserModel() */user, options ){
			var _options = {
				moveTop : false
			};
			options && $.extend( _options, options );
			if( ! isNaN( + user ) ){
				/* Not object but id given */
				user = UsersRegistry.UserModel( { id : + user } );
			}
			if( ! user || ! user.data || ! user.data.id ){
				/* Cannot activate invalid user */
				return;
			}
			activeUser = user;
			usersList.activate( user, { moveTop : _options.moveTop } );
			messenger.setUser( user );
			typeField.focus();
		}

		function removeUser( /* UsersRegistry.UserModel() */user, options ){
			var _options = {
			};
			options && $.extend( _options, options );
			if( ! isNaN( + user ) ){
				/* Not object but id given */
				user = UsersRegistry.UserModel( { id : + user } );
			}
			if( ! user || ! user.data || ! user.data.id ){
				/* Cannot activate invalid user */
				return;
			}
			usersList.remove( user );
		}


		return instance;
	})();
})( this );
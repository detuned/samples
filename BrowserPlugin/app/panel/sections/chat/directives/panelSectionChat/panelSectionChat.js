angular.module( 'plugin.panel' )
	.directive( 'panelSectionChat', [
		'$timeout',
		'pluginService',
		'chatService',
		'utilsService',
		function( $timeout, pluginService, chatService, utilsService ){
			return {
				templateUrl : pluginService.getTemplateUrl( '//panel/sections/chat/panelSectionChat' ),
				replace     : true,
				scope       : true,
				link        : function( scope, element, attrs ){
					var
						destructors = utilsService.elementDestructor( element ),
						fieldElement = element.find( '[role=addMessageField]' ),
						listElement = element.find( '[role="messagesList"]' ),
						listContentElement = element.find( '[role="messagesListContent"]' ),
						onScroll = _.debounce( function(){
							if( isBottomVisible() ){
								$timeout( function(){
									chatService.setAllMessagesViewed();
								}, 1000 );
							}
						}, 300 );

					scope.newMessage = {
						text : ''
					};
					scope.state = {
						adding         : false,
						addFocus       : false,
						loadingArchive : false
					};

					scope.messages = chatService.messages;

					scope.addMessage = function(){
						if( ! scope.newMessage.text || scope.state.adding ){
							return;
						}
						scope.state.adding = true;
						chatService.addMessage( scope.newMessage ).then( function(){
							scope.newMessage.text = '';
						}, function(){
							//TODO handle adding error
						} )['finally']( function(){
							scope.state.adding = false;
							onStart();
						} )
					};

					scope.showMore = function(){
						if( scope.state.loadingArchive ){
							return;
						}
						var
							topMessageElement, topBefore;
						scope.state.loadingArchive = true;
						chatService.getArchive().then(function(){
							topMessageElement = element.find( '[role="chatMessage"]:first' );
							topBefore = topMessageElement.position().top;
							$timeout( function(){
								listElement.scrollTop( topMessageElement.position().top - topBefore );
							} )
						} ).finally( function(){
								scope.state.loadingArchive = false;
							} );
					};
					scope.hasMore = chatService.hasArchive;


					function updateLayout(){
						$timeout( function(){
							scope.$broadcast( 'panelContentUpdated' );
						} );
					}

					function updateScroll(){
						listElement.scrollTop( Math.max( 10000, listContentElement.height() ) ); //Too much
						onScroll();
					}


					chatService.on( 'newMessage', onNewMessage );
					listElement.on( 'scroll', onScroll );

					destructors.push(
						scope.$watch( 'newMessage.text', function( v, prev ){
							if( ( v && ! prev ) || ( ! v && prev ) ){
								updateLayout();
							}
						} ),
						scope.$watch( 'messages.length', function( v, prev ){
							$timeout( function(){
								if( v > 0 && ! prev ){
									updateScroll();
								}
								updateLayout();
							}, 300 );
						} ),

						//One of messages turn to edit mode. We need to measure
						//whether it's fully visible and if not scroll list to fix it
						scope.$on( 'messageSetEdit', function ( $event, data ){
							var
								msgElement,
								bottom,
								maxBottom;
							if ( data && ( msgElement = data.messageElement ) && msgElement.length ){
								bottom = msgElement.position().top + msgElement.outerHeight();
								maxBottom = listElement.height();
								if ( bottom > maxBottom ){
									listElement.animate( { 'scrollTop' : listElement.scrollTop() + ( bottom - maxBottom ) }, { duration : 200 } );
								}
							}
						} ),
						function(){
							chatService.off( 'newMessage', onNewMessage );
						}
					);

					function onNewMessage( event, msg ){
						if( isBottomVisible() ){
							$timeout( function(){
								updateScroll();
								$timeout( function(){
									chatService.setMessageViewed( msg );
								}, 1000 )
							} );

						}
					}

					function isBottomVisible(){
						if ( ! listElement.is( ':visible' ) || 'chat' !== scope.activeSection.name ){
//							If element is invisible bottom is so too of course, nothing to check
							return;
						}
						var
							scrollTop = listElement.scrollTop(),
							listHeight = listElement.height(),
							contentHeight = listContentElement.height(),
							delta = 10;
						return scrollTop + listHeight >= ( contentHeight - delta );
					}

					//Start
					scope.$on( 'sectionActivated_chat', onStart );

					if( 'chat' === scope.activeSection.name ){
						onStart();
					}

					function onStart(){
						$timeout( function(){
							fieldElement.focus();
							if( scope.messages.length ){
								updateScroll();
							}
						}, 200 )
					}
				}
			}

		}] );
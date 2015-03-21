angular.module( 'plugin.panel' )
	.directive( 'pnChatMessage', [
		'$timeout',
		'$rootScope',
		'pluginService',
		'chatService',
		'relationsService',
		function( $timeout, $rootScope, pluginService, chatService, relationsService ){
			return {
				templateUrl : pluginService.getTemplateUrl( '//panel/sections/chat/pnChatMessage' ),
				replace     : true,
				scope       : {
					message : '=pnChatMessage'
				},
				link        : function( scope, element, attrs ){
					var
						fieldElement = element.find( '[role="textField"]' );
					scope.state = {
						edit     : false,
						loading  : false,
						deleting : false
					};

					scope.getUserRelState = function(){
						return relationsService.getRelState( scope.message.uid );
					};
					scope.getUserRelTitle = function(){
						return relationsService.getRelTitle( scope.message.uid );
					};

					scope.getUserName = function (){
						return relationsService.getUserName( scope.message.uid ) || scope.message.name
					};

					scope.isNew = function(){
						return scope.message && chatService.isNewMessage( scope.message );
					};


					scope.getClass = function(){
						var res = [];
						if( scope.isNew() ){
							res.push( 'pn-chat-message_new' );
						}
						if( scope.message.isEditable ){
							res.push( 'pn-chat-message_editable' );
						}
						if( scope.message.isDeletable ){
							res.push( 'pn-chat-message_deletable' );
						}
						if( scope.message.isOwn ){
							res.push( 'pn-chat-message_my' );
						}
						else {
							res.push(
								'pn-chat-message_user-online-mode-' + chatService.getUserOnlineMode( scope.message.uid ),
								'pn-chat-message_user-rel-' + scope.getUserRelState()
							);
						}
						return res.join( ' ' );
					};

					scope.switchEditMode = function( isEdit ){
						var
							newIsEditMode = arguments.length
								? ! ! isEdit
								: ! scope.state.edit;

						if( newIsEditMode ){
							onSetEdit();
						}
						scope.state.edit = newIsEditMode;
					};

					scope.onSubmit = function(){
						if( ! scope.editMessage.text ){
							return;
						}
						scope.state.loading = true;
						chatService.updateMessage( scope.editMessage ).then( function(){
							scope.switchEditMode( false );
						} )
							['finally']( function(){
							scope.state.loading = false;
						} );
					};

					scope.switchDeletingMode = function( isDeleting ){
						var
							newIsDeletingMode = arguments.length
								? ! ! isDeleting
								: ! scope.state.deleting;

						scope.state.deleting = newIsDeletingMode;
					};

					scope.deleteMessage = function(){
						scope.state.loading = true;
						chatService.removeMessage( scope.message.noteId )
							.finally( function(){
								scope.state.loading = false;
							} );

					};

					scope.relAction = function(){
						if( scope.message.isOwn || + scope.getUserRelState() ){
							return;
						}
						if ( relationsService.isGrantedToSetRelations() ){
							relationsService.changeState( {
								relId   : scope.message.uid,
								hisName : scope.message.name
							}, relationsService.STATES.INVITED );
						}
						else{
							//User has no rights to set relations
							//(most probably because didn't fill his name)
							//So we just navigate him to the Profile tab
							$rootScope.sectionControl.activate( 'settings', { tab : 'friends' } );
						}
					};

					scope.shareMessage = function(){
						scope.$parent.activateSection( 'share', { shareWithFriends : { note : [ scope.message.name, scope.message.text ].join( ': ' ) } } )
					};

					function onSetEdit(){
						scope.editMessage = _.clone( scope.message );
						$timeout( function(){
							fieldElement.focus();
							scope.$emit( 'messageSetEdit', { messageElement : element } );
						} );
					}

				}
			}

		}] );
angular.module( 'plugin.panel' )
	.directive( 'panelMenuItemChat', [
		'pluginService',
		'panelSectionsService',
		'chatService',
		function( pluginService, panelSectionsService, chatService ){
			return {
				templateUrl : pluginService.getTemplateUrl( '//panel/sections/chat/panelMenuItemChat' ),
				replace     : true,
				scope       : true,
				link        : function( scope, element, attrs ){
					scope.section = panelSectionsService.getSectionConfig( 'chat' );
					scope.getOnlines = chatService.getOnlineUsersCount;
					panelSectionsService.Section( 'chat' ).setMarked( function(){
						return chatService.messages.length > 0;
					} );
					panelSectionsService.Section( 'chat' ).setUpdates( chatService.getNewMessagesCount );
				}
			}

		}] );
angular.module( 'plugin.panel' )
	.service( 'pageInteractionService', [
		'$log',
		'$rootScope',
		'tagsService',
		'panelReopenTasksService',
		function( $log, $rootScope, tagsService, panelReopenTasksService ){
			var
				pageInteractionService = {},
				actions = {};

			actions.reopen = function( period ){
				$log.log( 'pageInteraction: reopen after', period );
				panelReopenTasksService.addTask({
					offset : + period
				});
			};

			actions.addTag = function( tag ){
				$log.log( 'pageInteraction: addTag', tag );
				tagsService.addPageTag( tag );
			};

			actions.openDiscussion = function (){
				$log.log( 'pageInteraction: openDiscussion' );
				$rootScope.sectionControl.activate( 'chat' );
			};

			pageInteractionService.handleAction = function( actStr ){
				var
					pattern = /([a-zA-Z0-9_]+)(?:\(([^\)]+)\))?/,
					m, params, actionName;
				if( ! actStr ){
					$log.warn( 'pageInteraction: incorrect action got', actStr );
					return;
				}
				if( m = actStr.match( pattern ) ){
					actionName = m[1];
					if( m[2] ){
						params = _.map( String( m[2] ).split( / *, */ ),function ( item ){
							return _.str.trim( item, '"\'' );
						} );
					}
					if( actions[actionName] ){
						actions[actionName].apply( null, params );
						$rootScope.$apply();
					}
					else {
						$log.warn( 'pageInteraction: unknown action', actionName );
					}

				}
			};

			return pageInteractionService;
		}] );
angular.module( 'plugin.panel' )
	.directive( 'panelMenuItemReopen', [
		'$log',
		'panelSectionsService',
		'panelReopenTasksService',
		function( $log, panelSectionsService, panelReopenTasksService ){
			return {
				link : function( scope, element, attrs ){
					panelSectionsService.Section( 'reopen' ).setMarked( function (){
						return panelReopenTasksService.reopenTasks.length > 0; //FIXME get only reopen tasks somehow
					} );
				}
			}

		}] );
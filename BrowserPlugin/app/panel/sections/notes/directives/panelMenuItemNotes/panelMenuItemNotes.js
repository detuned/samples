angular.module( 'plugin.panel' )
	.directive( 'panelMenuItemNotes', [
		'$log',
		'panelSectionsService',
		'notesService',
		function( $log, panelSectionsService, notesService ){
			return {
				link : function( scope, element, attrs ){
					panelSectionsService.Section( 'notes' ).setMarked( function (){
						return notesService.pageNotes.length > 0;
					} );
				}
			}

		}] );
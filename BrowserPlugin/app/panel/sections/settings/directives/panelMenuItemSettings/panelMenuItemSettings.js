angular.module( 'plugin.panel' )
	.directive( 'panelMenuItemSettings', [
		'$log',
		'panelSectionsService',
		'relationsService',
		function( $log, panelSectionsService, relationsService ){
			return {
				link : function( scope, element, attrs ){
					var list = relationsService.getList( relationsService.STATES.INVITED_BY );
					panelSectionsService.Section( 'settings' ).setUpdates( function (){
						return list.length;
					} );
				}
			}

		}] );
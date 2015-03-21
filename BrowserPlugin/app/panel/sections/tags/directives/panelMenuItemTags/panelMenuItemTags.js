angular.module( 'plugin.panel' )
	.directive( 'panelMenuItemTags', [
		'$log',
		'tagsService',
		'panelSectionsService',
		function( $log, tagsService, panelSectionsService ){
			return {
				link : function( scope, element, attrs ){
					panelSectionsService.Section( 'tags' ).setMarked( function (){
						return tagsService.pageTags.length > 0;
					} );
				}
			}

		}] );
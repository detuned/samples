angular.module( 'plugin' )
	.directive( 'hardL10n', [
		'utilsService',
		function( utilsService ){
			return function( scope, element, attrs ){
				element.text( utilsService.l10n( attrs.hardL10n ) );
			}
		}] );
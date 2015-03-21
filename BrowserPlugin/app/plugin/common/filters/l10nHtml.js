angular.module( 'plugin' )
	.filter( 'l10nHtml', [
		'$sce',
		'utilsService',
		function( $sce, utilsService ){
			return function (){
				return $sce.trustAsHtml( utilsService.l10n.apply( utilsService, arguments ) )
			};
		}] );
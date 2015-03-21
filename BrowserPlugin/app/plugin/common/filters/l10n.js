angular.module( 'plugin' )
	.filter( 'l10n', [ 'utilsService', function ( utilsService ){
		return utilsService.l10n;
	}] );
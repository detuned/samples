angular.module( 'plugin' )
	.filter( 'l10nPlural', [ 'utilsService', function ( utilsService ){
		return utilsService.l10nPlural;
	}] );
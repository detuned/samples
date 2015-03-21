angular.module( 'plugin' )
	.filter( 'clearUrl', [
		'utilsService',
		function( utilsService ){
			return utilsService.normalizeUrl;
		}] );
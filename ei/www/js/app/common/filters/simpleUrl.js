angular.module( 'index' )
	.filter( 'simpleUrl', [ 'utilsService', function( utilsService ){
		return utilsService.normalizeUrl;
	}] );
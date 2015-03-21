angular.module( 'index' )
	.filter( 'compactUrl', [ 'utilsService', function( utilsService ){
		return utilsService.compactUrl;
	}] );
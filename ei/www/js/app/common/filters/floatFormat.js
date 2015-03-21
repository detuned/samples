angular.module( 'index' )
	.filter( 'floatFormat', [ 'utilsService', function ( utilsService ){
		return utilsService.floatFormat;
	}] );
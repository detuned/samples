angular.module( 'index' )
	.filter( 'numberFormat', [ 'utilsService', function ( utilsService ){
		return utilsService.numberFormat;
	}] );
angular.module( 'plugin' )
	.filter( 'numberFormat', [ 'utilsService', function ( utilsService ){
		return utilsService.numberFormat;
	}] );
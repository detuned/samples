angular.module( 'index' )
	.filter( 'plural', [ 'utilsService', function ( utilsService ){
		return utilsService.plural;
	}] );
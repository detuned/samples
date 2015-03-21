angular.module( 'utils' )
	.filter( 'prune', [function (){
		return _.str.prune;
	}] );
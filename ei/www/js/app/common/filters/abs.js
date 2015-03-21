angular.module( 'index' )
	.filter( 'abs', function (){
		return function ( v ){
			return Math.abs( Number( v ) );
		}
	} );
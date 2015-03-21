angular.module( 'indexWidget', [ 'index', 'indexConfig' ] )
	.config( [ '$routeProvider', '$locationProvider', function( $routeProvider, $locationProvider ){
		$routeProvider
			.when( '/widget', {} )
			.otherwise( {redirectTo : '/widget'} );
		$locationProvider.html5Mode( true );
	}] );
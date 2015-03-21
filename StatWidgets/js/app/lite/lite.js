angular.module( 'lite', [ 'config', 'ngRoute' ] )

	.config( [
		'$routeProvider',
		function( $routeProvider ){
			$routeProvider
				.when( '/', {} )
				.otherwise( {redirectTo : '/'} );
		} ] )
	.run( [
		'$rootScope',
		'$q',
		'consoleService',
		function( $rootScope, $q, consoleService ){
			consoleService.init();
			var readyDefer = $q.defer();
			$rootScope.whenAppReady = function(){
				return readyDefer.promise;
			};
			$rootScope.appReady = _.once( readyDefer.resolve );
		}] );
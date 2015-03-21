angular.module( 'lite' )
	.service( 'accountService', [
		'$q',
		'$rootScope',
		'apiService',
		function( $q, $rootScope, apiService ){
			var
				STATUS_OK = 'OK',
				STATUS_ERROR = 'error',
				accountService = {};

			accountService.auth = function( data ){
				var defer = $q.defer();
				data.remember = 1;
				apiService.requestPost( '//api/login', data ).then( function( res ){
					if( res.status === STATUS_OK ){
						defer.resolve( res );
						$rootScope.$emit( 'authSuccess', res );
					}
					else {
						defer.reject( res )
					}
				}, defer.reject );
				return defer.promise;
			};

			accountService.getData = function(){
				var defer = $q.defer();
				apiService.requestGet( '//api/account' ).then( function( res ){
					if( res.user && res.user.user ){
						defer.resolve( res );
					}
					else {
						defer.reject( res )
					}
				}, defer.reject );
				return defer.promise;
			};

			accountService.logout = function(){
				var defer = $q.defer();
				apiService.requestGet( '//api/logout' )
					['finally']( function(){
					$rootScope.$emit( 'logoutSuccess' );
					defer.resolve();
				} );
				return defer.promise;
			};

			return accountService;
		}] );
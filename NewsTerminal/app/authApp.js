/**
 * Auth is lightweight app to handle single login page.
 * All it knows is how to authenticate user and what server's response can be like to.
 * And it knows nothing about main app's business logic: feeds, news etc
 */
angular.module( 'authApp', [ 'commonDirectives', 'ngCookies' ] )
	.factory( 'authService', [ '$http', function( $http ){
		return {
			send : function( data ){
				return $http.post( '/api/user/login', data );
			},

			allowAccess : function (){
				return $http.get( '/api/eventhandleruser', { params : { event : 'allowaccess' } } );
			}
		};
	}] )
	.controller( 'authCtrl', [ '$scope', '$window', '$location', '$cookies', 'authService', function( $scope, $window, $location, $cookies, authService ){

		$scope.locale = GLOBAL.locale;

		$scope.popupExpired = {
			opened : false
		}

		$scope.popupForbidden = {
			opened : false
		}

		if ( '/expired' == $location.path() ){
			$scope.popupExpired.opened = true;
			$location.path( '' );
		}

		$scope.submit = function (){
			if ( ! $scope.login || ! $scope.password ){
				// Data is not full
				// No need to send for displaying error message
				fail();
				return;
			}
			$scope.isSending = true;
			authService.send({
				login : $scope.login,
				password : $scope.password,
				remember : Number( $scope.remember )
			}).then(
				function ( res ){
					$scope.isSending = false;
					if ( res.data.forbidden ){
						forbidden();
					}
					else if ( ! + res.data.result ){
						success();
					}
					else{
						fail();
					}
				},
				function (){
					$scope.isSending = false;
					fail();
				}
			);
			function success(){
				// Auth successfull so redirect to the index page
				if ( window.sessionStorage ){
					sessionStorage.setItem( 'login', $scope.login );
				}
				$window.location.href = '/';
			}
			function fail(){
				$scope.isError = true;
			}

			function forbidden(){
				$scope.popupForbidden.opened = true;
			}
		};

		$scope.forceLogin = function (){
			authService.allowAccess().then(function (){
			    $scope.submit();
			})
		}

		$scope.locale = window.sessionStorage ? sessionStorage.getItem('locale') || 'ru' : 'ru';
		
		if ($cookies.locale && $cookies.locale != $scope.locale) {
			$scope.locale = $cookies.locale;
			if (window.sessionStorage) {
				sessionStorage.setItem( 'locale', $cookies.locale );
			}
			$cookies.locale = undefined;
		}
		
		$scope.setLocale = function(loc) {
			if (!loc) {
				loc = 'ru';
			};
			if ( window.sessionStorage ){
				if (sessionStorage.getItem('locale') != loc) {
					sessionStorage.setItem( 'locale', loc );
					$scope.locale = loc;
					location.reload();
				}
			};
		}
	} ])
	/**
	 * Uses to switch submit button's caption when it changes its regime: regular/busy
	 */
	.directive( 'submitButton', [function (){
		return {
			restrict : 'A',
			link : function ( scope, elem ){
				scope.$watch( 'isSending', function ( v ){
					elem.val( v ? GLOBAL.l10n('Вход...') : GLOBAL.l10n('ВОЙТИ'));
				})
			}
		}
	}] )
	.directive( 'autofocus', [function (){
		return {
			restrict : 'A',
			link : function ( scope, elem ){
				elem.select();
			}
		}
	}] )
	
	
	.filter( 'l10n', function(){
		return GLOBAL.l10n;
	});
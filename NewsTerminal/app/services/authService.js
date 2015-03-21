services.factory( 'authService', [ '$http', '$window', '$document', '$timeout', function( $http, $window, $document, $timeout ){

	var
		EVENT_SESSION_EXPIRED = 'userSessionExpired',
		CheckSession = (function(){
			var
				isStarted = false,
				interval = 60000,
				ticker,
				instance = {
					start : function(){
						if( isStarted ){
							return false;
						}
						isStarted = true;
						tick();
					},
					stop  : function(){
						if( ticker ){
							$timeout.cancel( ticker );
						}
						isStarted = false;
					}
				};

			function tick(){
				// XXX Using $rootScope for global events is better but
				// $document now is more usable cause allow emulate event
				// by browser console
				resetTicker();
				$http.get( '/api/ping' ).then( function( res ){
					if( Number( res.data.logout ) ){
						// Session has expired! Get out!
						instance.stop();
						$document.trigger( EVENT_SESSION_EXPIRED );
					}
					else {
						ticker = $timeout( tick, interval );
					}
				}, function(){
					ticker = $timeout( tick, interval );
				} )
			}

			function resetTicker(){
				if( ticker ){
					$timeout.cancel( ticker );
				}
			}

			return instance;
		})(),
		authService = {
			EVENT_SESSION_EXPIRED : EVENT_SESSION_EXPIRED,
			logout                : function( options ){
				var _options = {
					redirect : '/login.html'
				};
				options && angular.extend( _options, options );
				this.stopCheckingSession();
				$http.post( '/api/user/logout' ).then( function( res ){
					if( ! + res.data.result ){
						if( $window.sessionStorage ){
							$window.sessionStorage.removeItem( 'login' );
						}
						if( _options.redirect ){
							$window.location.href = _options.redirect;
						}
					}
				} );
			},

			startCheckingSession : function(){
				CheckSession.start();
			},

			stopCheckingSession : function(){
				CheckSession.stop();
			}

		};

	return authService;
}] );
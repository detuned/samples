// Declare app level module which depends on filters, and services
var newsModule = angular.module( 'myApp', ['myApp.services', 'myApp.directives', 'commonDirectives'] );

newsModule
	.config( function( $routeProvider, $locationProvider ){
		$routeProvider
			.when( '/feed/:feedId', { action : 'getFeedById', reloadOnSearch : false} )
			.when( '/feed/:feedId/news/:newsId', { action : 'getFeedNewsById'} )
			.when( '/object/:feedId', { action : 'getObjectById'} )
			.when( '/object/:feedId/news/:newsId', { action : 'getObjectNewsById'} )
			.when( '/news/:newsId', { action : 'getOneNewsById'} )
			.when( '/print/:newsId', { templateUrl : 'files/print.html', controller : 'ArticleCtrl', action : 'printNewsById'} )
			.when( '/search', { action : 'getSearchByQuery'} )
			.when( '/archive', { action : 'getArchiveByDate'} )
			.when( '/search/news/:newsId', { action : 'getSearchNewsById'} )
			.when( '/search/feed/:feedId/news/:newsId', { action : 'getSearchFeedNewsById'} )
			.when( '/', { action : 'home'} )
			.otherwise( {redirectTo : '/'} );

		$locationProvider.html5Mode( false );

	} )
	.run( [ '$rootScope', '$document', '$timeout', '$route', 'cometListenService', 'userSettingsService', 'authService', 'newsUtils', function( $rootScope, $document, $timeout, $route, cometListenService, userSettingsService, authService, newsUtils ){
		console.log( 'run' );


		/* Using heartbeat for detecting JS paused and then again started */
		(function(){
			var
				lastActionTime,
				beatInterval = 500,
				edgeInnacurateFactor = 10,
				eventName = 'jsResurrection',
				timer;

			function tick(){
				if( timer ){
					$timeout.cancel( timer );
				}
				lastActionTime = ( new Date ).getTime();
				timer = $timeout( function(){
					var
						now = ( new Date ).getTime(),
						innacurance = now - lastActionTime - beatInterval;
					if( innacurance > beatInterval * edgeInnacurateFactor ){
						console.log( 'JS resurrection detected after pausing' );
						$document.trigger( eventName, { delay : innacurance } );
					}
					lastActionTime = now;
					tick();
				}, beatInterval );
			}

			$timeout( tick, 1000 );

		})();


		/* Handling resurrection event */
		$document.on( 'jsResurrection', function( e ){
			$rootScope.isAppBusy = true;
			/* Stopping comet until restarting to avoid unpredictable consequences*/
			authService.stopCheckingSession();
			newsUtils.reachServer().then( function( reachData ){
				$rootScope.forceRefresh = true;
				cometListenService.start();
				authService.startCheckingSession();
				$route.reload();
				$rootScope.isAppBusy = false;
			} );
		} );

		$document.on( authService.EVENT_SESSION_EXPIRED, function( e ){
			authService.logout( {
				redirect : '/login.html#/expired'
			} );
		} );
		authService.startCheckingSession();

	}] );


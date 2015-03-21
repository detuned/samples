newsModule.controller('FeedsCtrl', ['$rootScope','$scope', '$routeParams', '$location', '$http', '$window', '$document', '$timeout', 'NEWST', 'feedsService', 'newsService', 'userSettingsService', 'authService',
	function($rootScope, $scope, $routeParams, $location, $http, $window, $document, $timeout, NEWST, feedsService, newsService, userSettingsService, authService ) {
		$scope.feedsList = feedsService.initFeedsItems();
		$scope.favoritesList = feedsService.getFavorites();
		$scope.SelectFeed = function(id){
			userSettingsService.setUserSettings({'selectedFeedId': id});
			feedsService.setClearUnread(id);
			newsService.clearAdvancedSearchFields();
			$location.search('sid', null);
			$location.search('query', null);
			$location.search('match', null);
			$location.search('fields', null);
			$location.search('date_start', null);
			$location.search('date_end', null);
			$location.path('/feed/'+id);
			$rootScope.objectLoaded = {sid: null};
		};

		$rootScope.ShowFeedSettings = function($event){
			$event.stopPropagation();
			$rootScope.showFeedSettings = !$rootScope.showFeedSettings;
			$rootScope.sidebar.opened = false;
			$timeout(function (){
				$document.trigger( 'layoutUpdate' );
			},100);
		};
		$rootScope.$on('handleFeedNewsUpdateDataEmit', function(event, args) {
			console.log('feeds update emit '+ args.sids.join( ',' ) );
			$scope.$apply( feedsService.setUnread( args.sids, args.article ) );
		});

		$scope.OpenFeedback = function(){
			$scope.popupFeedback.opened = true;
			$rootScope.sidebar.opened = false;
		};

		$scope.Logout = function(){
			authService.logout();
		}
		$scope.hasUserFeeds = function (){
			return ! ! _.find( $scope.feedsList, function ( feed ){
				return ! ! ( feed.type == NEWST.FEED_TYPE_USER && feed.id != NEWST.FEED_COMMONUSER_ID );
			} );
		}

		$scope.isUserFeed = function ( feed ){
			return ! ! ( feed.type == NEWST.FEED_TYPE_USER && feed.id != NEWST.FEED_COMMONUSER_ID );
		}
	}]);
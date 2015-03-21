newsModule.controller('SubscribeCtrl', ['$rootScope','$scope', '$routeParams', '$location', 'newsService', 'feedsService',
	function($rootScope, $scope, $routeParams, $location, newsService) {
		$scope.subscribeOptions = newsService.getSubscribeOptions();
		$scope.Subscribe = function( onComplete ){
			newsService.subscribeToUserFeed($scope.subscribeOptions.sid, $scope.subscribeOptions.email, $scope.subscribeOptions.includeBody)
				.then(function () {
					$rootScope.currentFeedSubscribed = true;
					onComplete && $scope.$eval( onComplete );
				});

		};
		$scope.Unsubscribe = function( onComplete ){
			newsService.unsubscribeFromUserFeed($scope.subscribeOptions.sid)
				.then(function () {
					$rootScope.currentFeedSubscribed = false;
					onComplete && $scope.$eval( onComplete );
				});

		};
		$scope.Edit = function(){
			$scope.subscribeOptions.edit = true;
		};
	}]);
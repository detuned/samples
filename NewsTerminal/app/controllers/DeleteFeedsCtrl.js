newsModule.controller('DeleteFeedsCtrl', ['$rootScope','$scope', '$routeParams', '$location', 'newsService', 'feedsService',
	function($rootScope, $scope, $routeParams, $location, newsService, feedsService) {

		$scope.options = newsService.getDeleteOptions();

		$scope.DeleteFavorites = function( onComplete ){
			console.log('deleting favorites '+$scope.options.title);
			var prm = {sid: $scope.options.sid};
			feedsService.deleteFavoritesFromServer(prm).then(function(id){
				onComplete && $scope.$eval( onComplete );
				// reload feeds
				feedsService.getFeedsFromServer().then(function(){
					$location.path('/feed/common');
				});
			});
		};
		$scope.DeleteFeeds = function( onComplete ){
			console.log('deleting feeds '+$scope.options.title);
			var prm = {sid: $scope.options.sid};
			feedsService.deleteFeedsFromServer(prm).then(function(id){
				onComplete && $scope.$eval( onComplete );
				// reload feeds
				feedsService.getFeedsFromServer().then(function(){
					$location.path('/feed/common');
				});
			});
		};
		$scope.DeleteArticleFromFavorites = function( onComplete ){
			var openedFeedId = feedsService.selectedFeedId;
			newsService.deleteNewsFromFavoritesToServer(openedFeedId, [$scope.options.sid]).then(function(){
				onComplete && $scope.$eval( onComplete );
				$location.path('/feed/' + openedFeedId);
			});
		};
	}]);
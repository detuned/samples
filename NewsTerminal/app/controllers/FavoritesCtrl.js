
newsModule.controller('FavoritesCtrl', ['$rootScope','$scope', '$routeParams', '$location', 'feedsService', 'newsService', 'articleService',
	function($rootScope, $scope, $routeParams, $location, feedsService, newsService, articleService) {

		$scope.CreateFavorites = function(){
			console.log('creating favorites '+$scope.popupCreateFavorite.title);
			var prm = {title: $scope.popupCreateFavorite.title};
			feedsService.createFavoritesToServer(prm).then(function(id){

				// need to add
				if (feedsService.favoritesListForAdd.length > 0){
					feedsService.addToFavoritesToServer(feedsService.favoritesListForAdd, id).then(function(){
						// reload feeds
						feedsService.getFeedsFromServer();
					});
				}else{
					// created from left columns, need to reload feeds and navigate to
					feedsService.getFeedsFromServer().then(function(){
						feedsService.selectFeed(id);
						articleService.setViewMode(true, feedsService.getInfo(id));
						$location.path('/feed/' + id);
					});
				}
			});
		};
		$scope.options = newsService.getDeleteOptions();
		$scope.EditFavorites = function(){
			console.log('editing favorites '+$scope.options.title);
			var prm = {title: $scope.popupEditFavorite.title, sid: $scope.popupEditFavorite.id};
			feedsService.createFavoritesToServer(prm).then(function(id){

				// reload feeds
				feedsService.getFeedsFromServer().then(function(){
					feedsService.selectFeed($scope.popupEditFavorite.id);
					articleService.setViewMode(true, feedsService.getInfo($scope.popupEditFavorite.id));
				});

			});
		};

		$scope.feedSelect = {
			opened : false
		};
	}]);
newsModule.controller('WallCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$window', 'NEWST', 'wallService', 'articleService', 'feedsService', 'newsService', 'userSettingsService',
	function($rootScope, $scope, $routeParams, $location, $window, NEWST, wallService, articleService, feedsService, newsService, userSettingsService) {
		$scope.wallList = wallService.initWallItems();
		$scope.text = wallService.getText();
		$scope.isActive = false;
		$scope.state  = {
			articleLoading : false
		};

		$scope.UpdateWall = function(){
			$scope.isActive = $rootScope.layout.wallOpened;
			if ( $scope.isActive ){
				$scope.newMessages = 0;
				$scope.isActive = true;
				wallService.updateItems().then(function(){
				});
			}else{
				$scope.isActive = false;
			}
		};

		$scope.LoadMoreItems = function(){
			$scope.isLoadingMore = true;
			wallService.loadMoreNews().then(function (){
				$scope.isLoadingMore = false;
			}, function (){
				$scope.isLoadingMore = false;
			});
		};

		$scope.SelectNews = function(id){
			$scope.state.articleLoading = true;
			// need to load article
			wallService.loadText(id ).then(function (){
				$scope.state.articleLoading = false;
			}, function (){
				$scope.state.articleLoading = false;
			});
		};

		$scope.PrintNews = function(item){
			window.open('/#/print/'+item);
		};
		$scope.OpenNewWindow = function(item){
			window.open('/#/news/'+item);
		};
		$scope.ExportNews = function(item, format){
			articleService.exportNews([item], format ).then(function( res ){
				if ( res.url ){
					$window.open( res.url, 'Download' );
				}
			});
		};

		$scope.FavoritesList = feedsService.getFavorites();
		$scope.InitFavoritesList = function(){
			if ($scope.text[0] != null && $scope.text[0].objectsList != null){
				var artSids = [];
				var objects = $scope.text[0].objectsList;
				_.each(objects, function(obj){
					if (obj.type == 'favorite'){
						artSids.push(obj.sid);
					}
				});

				_.each($scope.FavoritesList, function(f){
					f.checked = false;
					_.each(artSids, function(a){
						if (f.id == a){
							f.checked = true;
						}
					})
				});
			}
		};

		$scope.AddToFavorite = function(item, favoriteIds){
			$scope.isFavoritesBusy = true;
			$scope.isFavoritesError = false;
			feedsService.updateToFavoritesToServer([item], favoriteIds).then(function(){
				//feedsService.unCheckFavorites();
				wallService.getFavoritesUpdateFromServer($scope.text[0].id);
				articleService.getFavoritesUpdateFromServer($scope.text[0].id);
				if (feedsService.selectedFeedId != undefined){
					newsService.loadNews( { inherit: true, offset : 0, nextPage : false } );
					feedsService.updateFavoritesFromServer();
				}
				$scope.isFavoritesBusy = false;
				$scope.CloseMenu();
			},function (){
				$scope.isFavoritesError = true;
			});
			feedsService.highlight(favoriteIds);
		};
		$scope.CloseMenu = function(){
			var btn = $(".js-btn-opt");
			var list = btn.parent().children(".js-drop-down");
			if(btn.hasClass("is-active")) {
				btn.removeClass("is-active");
				list.slideUp("fast");
			}
		};

		$scope.GetCheckedFavorite = function(){
			return feedsService.getCheckedFavoritesIds();
		};
		$scope.hasCheckedFavorite = function(){
			return feedsService.hasCheckedFavorites();
		};
		$scope.CreateAndAddToFavorite = function(item){
			feedsService.favoritesListForAdd = [item];
			$scope.popupCreateFavorite.opened = true;
		};

		$scope.newMessages = 0;
		$rootScope.$on('handleFeedNewsUpdateDataEmit', function(event, args) {
			var article = args.article;
			var sids = args.sids;
			var type = args.type;
			console.log('wall feed news update emit '+article.id+' t='+type);
			if (!$scope.isActive){
				$scope.newMessages++;
			}else{
				$scope.$apply(wallService.addFromCometNewsDataToList([article], sids, type));
			}
		});
		$scope.blankSearchPath = function(){
			$location.search('sid', null);
			$location.search('query', null);
			$location.search('match', null);
			$location.search('fields', null);
			$location.search('date_start', null);
			$location.search('date_end', null);
		};
		$scope.OpenLinkObject = function(feedId){
			$scope.blankSearchPath();
			$location.path('/object/' + feedId);
		};
		$scope.OpenLinkFavorite = function(feedId){
			$scope.blankSearchPath();
			$location.path('/feed/' + feedId);
		};
		$scope.GoToSelectedFeed = function($event, feedId){
			$event.stopPropagation();
			// Open selected feed
			console.log('FeedNewsCtrl: go to feed ='+feedId);
			$location.path('/feed/'+feedId);
		};
		$scope.setEmailOptions = function(sid){
			newsService.setEmailOptions([sid]);
		};
		$scope.hasObjectByType = function(type){
			var count = 0;
			if (angular.isDefined($scope.text[0]) && $scope.text[0].objectsList != undefined){
				_.each($scope.text[0].objectsList, function(obj){
					if (obj.type == type){
						count++;
					}
				});
			}

			return count > 0;
		};
		$scope.closePopupWindow = function(){
			$(".wall li").removeClass("is-active");
			$(".window").fadeOut();
			$(".window__arr").removeClass("is-floating").css({"top":21});
		};
		$rootScope.$on('handleCloseMenuForArticleEmit', function(event, args) {
			console.log('feed news need close menus ForArticle');
			$scope.closePopupWindow();
		});
		$rootScope.$on('handleCloseMenuForFeedEmit', function(event, args) {
			console.log('feed news need close menus ForFeed');
			$scope.closePopupWindow();
		});
		$rootScope.$on('handleCloseMenuForNewsEmit', function(event, args) {
			console.log('feed news need close menus ForFeed');
			$scope.closePopupWindow();
		});
	}]);
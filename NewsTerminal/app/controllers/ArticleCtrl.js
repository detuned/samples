newsModule.controller('ArticleCtrl', ['$scope', '$rootScope', 'articleService', 'feedsService', 'newsService', '$location', '$timeout', '$window', 'cometListenService', function($scope, $rootScope, articleService, feedsService, newsService, $location, $timeout, $window, cometListenService ){
	$scope.text = articleService.init();
	$scope.mode = articleService.initOptions();
	$scope.state = articleService.getState();
	$scope.delOptions = newsService.getDeleteOptions();
	$scope.subscribeOptions = newsService.getSubscribeOptions();
	$scope.CloseArticle = function(){
		var
			currentLocationPath = $location.path(),
			currentLocationUrl = $location.url(),
			currentFeedOptions,
			pathParts = [];
		if (currentLocationPath.indexOf('/object/')>=0){
			var urlSplit = currentLocationPath.split('/');
			if (urlSplit.length > 2){
				var feedId = urlSplit[2];
				$location.path('/object/'+feedId);
			}
		} else{
			currentFeedOptions = articleService.getCurrentFeed();
			/* Well, we think if CloseArticle fired that url has to looks like /smth/smth_id/news/news_id/... */
			currentLocationUrl = currentLocationUrl.replace( /\/news\/[^\/\?]+/, '' );
			articleService.setViewMode(true, currentFeedOptions);
			$rootScope.unForceRefresh = true;
			$location.url( currentLocationUrl );
		}
	};
	$scope.PrintNews = function(item){
		if ( $rootScope.isOneNews ){
			/*
			 * It's need to stop all longtime requests when printing
			 * cause Google Chrome delayed appearing print preview dialog
			 * until open requests close
			 */
			cometListenService.abort();
			$window.print();
			$timeout(function (){
				cometListenService.start();
			}, 200)
		}
		else{
			$window.open('/#/print/'+item);
		}
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
		$scope.CloseMenu();
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
			articleService.getFavoritesUpdateFromServer($scope.text[0].id);
			if (feedsService.selectedFeedId > 0 && ! $rootScope.isOneNews ){
				newsService.loadNews( { inherit: true, offset : 0, nextPage : false } );
				feedsService.updateFavoritesFromServer();
			}
			$scope.isFavoritesBusy = false;
			$scope.CloseMenu();
		}, function (){
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
	$scope.isHasObjects = function(){
		return angular.isDefined($scope.text[0]) && $scope.text[0].hasObjects;
	}
	$scope.dateChecker = function(){
		$timeout(function(){
			var newDateValue = $(".js-date-current").val();
			if( newDateValue && newDateValue != $scope.currentArchiveDate){
				console.log('changed date ' + newDateValue);
				$scope.currentArchiveDate = newDateValue;
				$scope.setArchiveFilterByTimer();
			}

			$scope.dateChecker();
		}, 1000);
	}
	$scope.setArchiveFilterByTimer = function(){
		var ddd = new Date();
		ddd.setTime(Date.parse($scope.currentArchiveDate));
		var serverFormatData = ddd.dateFormat( 'Y-m-d' );
		$scope.blankSearchPath();
		var mySid = feedsService.selectedFeedId;
		$location.search('sid', mySid);
		$location.search('date_start', serverFormatData);
		$location.search('date_end', serverFormatData);
		$location.path('/archive');
	}
	$scope.setArchiveFilter = function(sid){
		var dCurrent = $(".js-date-current").val();
		var ddd = new Date();
		ddd.setTime(Date.parse(dCurrent));
		var severFormatData = ddd.getFullYear() + '-' + (parseInt(ddd.getMonth()) + 1) + '-' + ddd.getDate();
		$scope.blankSearchPath();
		var mySid = sid;
		if (mySid == undefined){
			mySid = feedsService.selectedFeedId;
		}
		$location.search('sid', mySid);
		$location.search('date_start', severFormatData);
		$location.search('date_end', severFormatData);
		$location.path('/archive');
	}
	$scope.setDeleteOptions = function(sid, title, favoritesCount){
		console.log('set delete options for ' + sid);
		$scope.delOptions.sid = sid;
		$scope.delOptions.title = title;
		$scope.delOptions.favoritesCount = favoritesCount;
	}
	$scope.DeleteNewsFromFavorite = function(id){
		if ($scope.isLoadedFavorite()){
			var openedFeedId = feedsService.selectedFeedId;
			newsService.deleteNewsFromFavoritesToServer(openedFeedId, [id]).then(function(){
				feedsService.updateFavoritesFromServer().then(function(){
					$location.path('/feed/' + openedFeedId);
				});
			});
		}
	};
	$scope.currentArchiveDate = '';
	$scope.isLoadedFavorite = function(){
		return newsService.isLoadedFavorite();
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
	$scope.setSubscribeOptions = function(sid){
		console.log('set subscribe options for ' + sid);
		var feed = feedsService.getFeedById( sid );
		$scope.subscribeOptions.sid = sid;
		$scope.subscribeOptions.feedTitle = feed.title;
		$scope.subscribeOptions.edit = false;
		newsService.getSubscribeToUserFeedInfo($scope.subscribeOptions.sid).then( function (r) {
			if (r.email) {
				$scope.subscribeOptions.subscribed = true;
				$scope.subscribeOptions.email = r.email;
				$scope.subscribeOptions.includeBody = r.includeBody;
			} else {
				$scope.subscribeOptions.subscribed = false;
				$scope.subscribeOptions.email = '';
				$scope.subscribeOptions.includeBody = false;
			}
		});

	};
}]);
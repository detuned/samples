newsModule.controller('FeedNewsCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$route', '$window', 'NEWST', 'newsService', 'articleService', 'feedsService', 'userSettingsService', '$timeout', '$q',
    function($rootScope, $scope, $routeParams, $location, $route, $window, NEWST, newsService, articleService, feedsService, userSettingsService, $timeout, $q) {
        $scope.newsList = newsService.initNewsItems();
	    $scope.selectedFeed = feedsService.getSelectedFeed();
	    $scope.advancedSearchOpened = false;
        $scope.hasChecked = function(){
            return newsService.isHasChecked();
        };
        $scope.isLoadedFavorite = function(){
            return newsService.isLoadedFavorite();
        };
        $scope.viewNewsOption = newsService.getViewNewsOption();

	    $scope.getTotalItemsNum = function (){
	        return newsService.getTotalItemsNum();
	    }
        $scope.GetCheckedIds = function(){
            return newsService.getCheckedIds();
        };
        $scope.ClearCheckedIds = function(){
            newsService.clearCheckedIds();
        }
        $scope.setUrgent = function(){
            $scope.viewNewsOption.needOnlyUrgent = !$scope.viewNewsOption.needOnlyUrgent;
			newsService.loadNews({
			    inherit : true,
			    offset : 0,
			    nextPage : false
			});
	        userSettingsService.setUserSettings({needOnlyUrgent:$scope.viewNewsOption.needOnlyUrgent});

         };
        $scope.SelectNews = function(id){
            newsService.readNewsSendToServer([id], feedsService.selectedFeedId);
            var feedId = $rootScope.searchMode ? NEWST.FEED_COMMON_ID : newsService.currentFeedId;
            var newPath = '';
            if ($rootScope.searchMode){
                //$location.search('sid', null);
                //$location.search('query', null);
                $location.path('/search/news/'+id);
            }else{
                var currentPath = $location.path();
                var newPath;
                if (currentPath.indexOf('/object/') >= 0){
                    newPath = '/object/'+feedId+'/news/'+id;
                } else {
                    newPath ='/feed/'+feedId+'/news/'+id;
                }

	            $rootScope.unForceRefresh = true;
                $location.path(newPath);
            }
        };
        $scope.GoToSelectedFeed = function($event, feedId){
            $event.stopPropagation();
            // Open selected feed
            console.log('FeedNewsCtrl: go to feed ='+feedId);
            $location.path('/feed/'+feedId);
        };

        $scope.loadMore = function(){
            if ( ! $scope.needLoadMoreProgress && ! newsService.isCurrentLoadingComplete() ){
	            $rootScope.needLoadMoreProgress = true;
	            newsService.loadNews({
		            inherit : true,
		            nextPage : true
	            } ).then(function (){
	                $rootScope.needLoadMoreProgress = false;
	            }, function (){
	                $rootScope.needLoadMoreProgress = false;
	            });
            }
        };

        $scope.CloseViewTypeList = function(opt){
            $scope.viewNewsOption.viewNewsType=opt;
	        userSettingsService.setUserSettings({ viewNewsType : $scope.viewNewsOption.viewNewsType });
            $(".js-drop-down").slideUp("fast");
        };
        $scope.PrintNews = function(items){
            var link = items[0];
            for(var i=1;i<items.length;i++){
                link += ','+items[i];
            };

            window.open('/#/print/'+link);
        };
        $rootScope.$on('handleFeedNewsUpdateDataEmit', function(event, args) {
            var article = args.article;
            var sids = args.sids;
            var type = args.type;
            console.log('feed news update emit '+article.id);
            $scope.$apply(newsService.addFromCometNewsDataToList([article], sids, type));
        });
        //$scope.searchText = '';
        $scope.autoCompleteAdvancedList = newsService.initAutoCompleteAdvancedItems();
        $scope.autoCompleteAdvancedShow = false;
        //$scope.advancedObjectsList= [];
        $scope.advancedText = '';

	    $scope.removeWordFromSearchText = function ( word ){
		    if ( ! word ){
			    return;
		    }
		    var
			    sprt = /[ \s\xA0]+/,
			    pt = new RegExp( '(.?)' + word + '(.?)', 'g' );
		    $scope.advanced.searchText = $scope.advanced.searchText.replace( pt, function ( m0, m1, m2 ){
		        if (
			        ( ! m1 || m1.match( sprt ) )
			        && ( ! m2 || m2.match( sprt ) )
			        ){
			        return m1 + m2;
		        }
			    return m0;
		    } );
		    $scope.advanced.searchText = $.trim( $scope.advanced.searchText );
	    }

        $scope.HideAutoCompleteAdvanced= function(){
            $timeout(function(){
                if ($scope.autoCompleteAdvancedShow){
	                newsService.clearAutoCompleteAdvanced();
                    $scope.autoCompleteAdvancedShow = false;
                }
            }, 200);
        };
        $scope.ClearAdvancedSearchFields = function(){
            newsService.clearAdvancedSearchFields();
        };
	    $scope.SearchSmartSubmit = function (){
		    $scope.advancedSearchOpened = false;
			return newsService.isSearchOptionsAtDefaultState( $scope.advanced )
	            ? $scope.DoSearch()
		        : $scope.DoAdvancedSearch();
	    }

        $scope.DoSearch = function( forceSearchEverywhere ){ // enter and search
	        var
		        selectedFeed = feedsService.getSelectedFeed(),
		        sids = [],
		        params = {};
            $scope.HideAutoComplete();
            $rootScope.searchCount = -1;
            $rootScope.needSearchProgress = true;
            $rootScope.isAdvancedFound = false;
            var currentUrl = $location.url();
            $location.search('sid', null);
            $location.search('match', null);
            $location.search('fields', null);

	        params.query = $scope.advanced.searchText || '';

	        if ( ! forceSearchEverywhere && ( selectedFeed.type == NEWST.FEED_TYPE_COMMON || selectedFeed.type == NEWST.FEED_TYPE_USER ) && selectedFeed.id && selectedFeed.id != NEWST.FEED_COMMON_ID ){
		        /**
		         * @see NEWST-250
		         */
		        sids.push( selectedFeed.id );
	        }

	        if ( $scope.advanced.advancedObjectsList && $scope.advanced.advancedObjectsList.length ){
		        angular.forEach( $scope.advanced.advancedObjectsList, function ( obj ){
					sids.push( obj.sid );
		        } );
	        }

	        params.sid = sids.length ? sids : 'common';

            $location.path('/search').search( params );
            if (currentUrl == $location.url()){
                $route.reload();
            }
        }
        $scope.DoAdvancedSearch = function(){ // click by advanced search button
            $rootScope.searchCount = -1;
            $rootScope.needSearchProgress = true;
            $rootScope.isAdvancedFound = true;
	        $scope.HideAutoComplete();
	        $scope.advancedSearchOpened = false;
            var currentUrl = $location.url();
	        var searchParams = {
		        'match' : $scope.advanced.match,
		        'query' : $scope.advanced.searchText  || ''
	        };

	        /* Fields */
	        (function(){
	            var myFields = [];
	            if($scope.advanced.fields.findTitle){
	                myFields.push('title');
	            };
	            if($scope.advanced.fields.findBody){
	                myFields.push('body');
	            };
	            if($scope.advanced.fields.findKeywords){
	                myFields.push('keywords');
	            };
	            if (myFields.length>0) {
		            searchParams.fields = myFields;
	            }
	        })();

	        /* Sids */
	            (function(){
		            var
			            mySids=[],
			            feedsSelected = newsService.getSelectedFeedsForSearch();
		            _.each( feedsSelected || [], function ( feed ){
		                mySids.push( feed.id );
		            } );
		            _.each($scope.advanced.advancedObjectsList, function(o){
		                mySids.push(o.sid);
		            });
		            searchParams.sid = mySids.length ? mySids : 'common';
	            })();

	        /* Dates */
	            (function(){
		            if ( $scope.advanced.date.from && $scope.advanced.date.to ){
						searchParams.date_start = $scope.advanced.date.from.dateFormat( 'Y-m-d' )
						searchParams.date_end = $scope.advanced.date.to.dateFormat( 'Y-m-d' );
		            }
	            })();

            $location
	            .path('/search')
	            .search( searchParams );
            if (currentUrl == $location.url()){
                $route.reload();
            }
        }


        $scope.advanced = newsService.getAdvancedSearchOptions();
        $scope.AreaSearchWhatText = function(){
            var res = '';
            var opt = $scope.advanced.match;
            if (opt == 'phrase'){
                res = GLOBAL.l10n('совпадение фразы');
            }else if (opt == 'any'){
                res = GLOBAL.l10n('одно из слов');
            }else{
                res = GLOBAL.l10n('Все слова' ).toLocaleLowerCase();
            }
            return res;
        };
        $scope.AreaSearchWhereText = function(){
            var res = GLOBAL.l10n('по всем полям');
            var fieldsArr = [];
            var opt = $scope.advanced.fields;
            if (opt.findTitle){
                fieldsArr.push(GLOBAL.l10n('заголовки'));
            }
            if (opt.findBody){
                fieldsArr.push(GLOBAL.l10n('текст новости'));
            }
            if (opt.findKeywords){
                fieldsArr.push(GLOBAL.l10n('ключевые слова'));
            }

            if (fieldsArr.length > 0){
                res = fieldsArr.join(', ');
            }
            return res;
        };


        $scope.AreaSearchObjectsText = function(){
            var arr = [];
            var res = '';

            _.each($scope.advanced.advancedObjectsList, function(o){
                arr.push(o.title);
            });

            if (arr.length > 0){
                res = arr.join(', ');
            }

            return res;
        };

	    $scope.AreaSearchDateText = function (){
            if ( $scope.advanced.date.from && $scope.advanced.date.to ){
                return ( $scope.advanced.date.from.dateFormat('d M Y') + ' — ' + $scope.advanced.date.to.dateFormat('d M Y') ).toLocaleLowerCase();
            }

			return $scope.advanced.date.dateView;
	    };
        $scope.AreaSearchFeedText = function (){
            return $scope.advanced.feeds.listView;
        };
        $scope.ExportNews = function(items, format){
	        articleService.exportNews( items, format ).then(function( res ){
		        if ( res.url ){
			        $window.open( res.url, 'Download' );
		        }
	        });
        };

        $scope.FavoritesList = feedsService.getFavorites();
        $scope.InitFavoritesList = function(){
            feedsService.unCheckFavorites();
        };
        $scope.AddToFavorite = function(items, favoriteIds){
	        $scope.isFavoritesBusy = true;
	        $scope.isFavoritesError = false;
            feedsService.addToFavoritesToServer(items, favoriteIds).then(function(){
                feedsService.unCheckFavorites();
	            $scope.isFavoritesBusy = false;
                $scope.CloseMenu();
                feedsService.updateFavoritesFromServer();
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
        $scope.UnCheckFavorite = function(){
            feedsService.unCheckFavorites();
        };
        $scope.hasCheckedFavorite = function(){
            return feedsService.hasCheckedFavorites();
        };

        $scope.CreateAndAddToFavorite = function(items){
            feedsService.favoritesListForAdd = items;
	        $scope.popupCreateFavorite.opened = true;
        };

        $scope.feedSelect = {
	        opened : false
        };

        $scope.DeleteNewsFromFavorite = function(ids){
            if ($scope.isLoadedFavorite()){
                var openedFeedId = feedsService.selectedFeedId;
                newsService.deleteNewsFromFavoritesToServer(openedFeedId, ids).then(function(){
                    newsService.loadNews({ feedId : openedFeedId });
                    feedsService.updateFavoritesFromServer();
                    //$location.path('/feed/' + openedFeedId);
                });
            }
        };

        $scope.SelectFeedShow = function($event){
            $event.stopPropagation();
            if ( ! $scope.feedSelect.opened ){
	            $scope.closeAdvancesSearchMenus();
	            if ( ! $scope.advanced.feeds.list.length ){
                    newsService.getFeedListForSearch(feedsService.getItems());
	            }
	            $scope.feedSelect.opened = true;
            }else{
	            $scope.feedSelect.opened = false;
            }
        };

        $scope.datePickerShow = false;

        $scope.UpdateDateViewAtCheck = function($event){
	        if ( ! $scope.datePickerShow ){
	            $scope.closeAdvancesSearchMenus();
	        }
            $event.stopPropagation();
            $scope.datePickerShow = ! $scope.datePickerShow;
        };
        $scope.ApplyDateView = function(){
            var dFrom = $(".js-date-from").data( 'date' );
            var dTo = $(".js-date-to").data( 'date' );
            newsService.applyDateView(dFrom, dTo);
            $scope.datePickerShow = false;
        };
        $scope.closeAdvancesSearchMenus = function(){
            $scope.datePickerShow = false;
	        $scope.feedSelect.opened = false;
	        $scope.HideAutoCompleteAdvanced();
        };
        $scope.setEmailOptions = function(sids){
            newsService.setEmailOptions(sids);
        };
        $scope.checkNewsByDate = function(date, check){
            newsService.checkNewsByDate(date, check);
        };

	    $scope.getSearchFieldPlaceholder = function (){
			return angular.isDefined( $scope.selectedFeed.type )
					&& (
				       $scope.selectedFeed.type == NEWST.FEED_TYPE_COMMON
				       || $scope.selectedFeed.type == NEWST.FEED_TYPE_USER
				       )
					&& $scope.selectedFeed.title
					    ? [ GLOBAL.l10n( 'Поиск в ленте' ), $scope.selectedFeed.title ].join( ' — ' )
					    : GLOBAL.l10n( 'Поиск...' )
	    }

        $rootScope.$on('handleCloseMenuForArticleEmit', function(event, args) {
            console.log('feed news need close menus ForArticle');
	        $scope.advancedSearchOpened = false;
        });
        $rootScope.$on('handleCloseMenuForFeedEmit', function(event, args) {
            console.log('feed news need close menus ForFeed');
	        $scope.advancedSearchOpened = false;
        });
    }]);
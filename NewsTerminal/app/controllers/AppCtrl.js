// Main app controller
newsModule.controller( 'App', ['$scope', '$rootScope', '$route', '$routeParams', '$timeout', 'NEWST', 'feedsService', 'newsService', 'articleService', '$location', '$q', 'userSettingsService', 'searchService', 'cometListenService',
	function( $scope, $rootScope, $route, $routeParams, $timeout, NEWST, feedsService, newsService, articleService, $location, $q, userSettingsService, searchService, cometListenService ){
		// Init
		$scope.CONST = NEWST;
		$scope.locale = GLOBAL.locale;
		$rootScope.isAppStarted = false;
		$rootScope.isAppBusy = false;
		$rootScope.isOneNews = false;
		$rootScope.forceRefresh = true;
		$rootScope.unForceRefresh = false;
		$rootScope.isPrintNews = false;
		$rootScope.searchMode = false;
		$rootScope.needSearchProgress = false;
		$rootScope.needLoadMoreProgress = true;
		$rootScope.isAdvancedFound = false;
		$rootScope.searchCount = - 1;
		$rootScope.showFeedSettings = false;
		$rootScope.showObject = false;
		$rootScope.archiveSearch = false;
		$rootScope.objectLoaded = {sid : null};
		$rootScope.sidebar = {
			opened : false
		};
		$rootScope.layout = {
			leftPanelWidth : null,
			wallOpened     : false
		};


		$scope.popupErrorFeedback = {
			opened : false
		};

		$scope.popupErrorFeedbackOverflow = {
			opened : false
		};

		$scope.popupMedia = {
			opened : false
		};

		$scope.showMediaPopup = function( mediaItem ){
			$scope.popupMedia.opened = true;
			$scope.popupMedia.item = mediaItem;
		}

		$scope.resetMediaPopup = function( mediaItem ){
			$scope.popupMedia.item = {};
		}

		$scope.tutorial = {
			opened : false
		}


		/**
		 * Model of create feed popup
		 * @type {Object}
		 */
		$scope.popupCreateFeed = {
			opened : false,
			title  : ''
		};

		$scope.clearPopupCreateFeedSearchFields = function(){
			newsService.clearAdvancedSearchFields();
			newsService.clearSearchTextField();
		};

		$scope.createFeedBySearch = function(){
			$scope.popupCreateFeed.opened = true;
			$rootScope.sidebar.opened = false;
			$scope.popupCreateFeed.title = '';
			newsService.fillCreateFeedOptionsFromSearch();
		}

		$scope.createFeedBlank = function(){
			$scope.popupCreateFeed.opened = true;
			$rootScope.sidebar.opened = false;
			$scope.popupCreateFeed.title = '';
			newsService.clearCreateFeedOptions();
		}


		/**
		 * Model of create favorite popup
		 * @type {Object}
		 */
		$scope.popupCreateFavorite = {
			opened : false,
			title  : ''
		};

		/**
		 * Model of edit feed popup
		 * @type {Object}
		 */
		$scope.popupEditFeed = {
			opened : false
		};

		/**
		 * Model of delete feed popup
		 * @type {Object}
		 */
		$scope.popupDeleteFeed = {
			opened : false
		};

		/**
		 * Model of edit Favorite popup
		 * @type {Object}
		 */
		$scope.popupEditFavorite = {
			opened : false,
			id     : undefined,
			title  : undefined
		};

		/**
		 * Model of delete favorite popup
		 * @type {Object}
		 */
		$scope.popupDeleteFavoritesFeed = {
			opened : false
		};

		/**
		 * Model of delete article from favorite feed popup
		 * @type {Object}
		 */
		$scope.popupDeleteArticle = {
			opened : false
		};

		/**
		 * Model of subscribe popup
		 * @type {Object}
		 */
		$scope.popupSubscribe = {
			opened : false
		};

		/**
		 * Model of feedback popup
		 * @type {Object}
		 */
		$scope.popupFeedback = {
			opened : false
		};

		/**
		 * Model of feedback popup
		 * @type {Object}
		 */
		$scope.popupSendEmail = {
			opened : false
		};

		$scope.ShowPopupEditFeed = function( feedId, $event ){
			$scope.popupEditFeed.opened = true;
			$scope.popupEditFeed.loading = true;
			$rootScope.sidebar.opened = false;
			newsService
				.getFullFeedData( feedId, feedsService.getItems() )
				.then( onLoadComplete, onLoadComplete );
			function onLoadComplete(){
				$scope.popupEditFeed.loading = false;
			}

			if( $event && $event.stopPropagation ){
				$event.stopPropagation();
			}
		};

		$scope.ShowPopupEditFavoriteFeed = function( feed, $event ){
			$scope.popupEditFavorite.opened = true;
			$rootScope.sidebar.opened = false;
			$scope.popupEditFavorite.title = feed.title;
			$scope.popupEditFavorite.id = feed.id;
			if( $event && $event.stopPropagation ){
				$event.stopPropagation();
			}
		};


		function applyUserSettings( settings ){
			if( angular.isDefined( settings.wallOpened ) ){
				$rootScope.layout.wallOpened = ! ! settings.wallOpened;
			}
			if( angular.isDefined( settings.needOnlyUrgent ) ){
				newsService.viewNewsOption.needOnlyUrgent = ! ! settings.needOnlyUrgent;
			}
			if( angular.isDefined( settings.viewNewsType ) ){
				newsService.viewNewsOption.viewNewsType = Number( settings.viewNewsType );
			}
			if( settings.dragPositionLeft ){
				$rootScope.layout.leftPanelWidth = Number( settings.dragPositionLeft );
			}
		}


		// Listen for changes to the Route.
		$scope.$on(
			"$routeChangeSuccess",
			function( $currentRoute, $previousRoute ){
				console.log( 'on route change render' );
				if( ! $rootScope.isAppStarted ){
					userSettingsService.getUserSettings().then( function( settings ){
						applyUserSettings( settings );
						render().then( function(){
							if( ! settings.tutorial ){
								$timeout( function(){
									$scope.tutorial.opened = true;
									userSettingsService.setUserSettings( { tutorial : 1 } )
								}, 200 );
							}
						} )
						$rootScope.isAppStarted = true;
					}, render );
				}
				else {
					$rootScope.isAppStarted = true;
					render();
				}
			}
		);

		$scope.needToCloseMenusForArticle = function(){
			console.log( 'on body art click' );
			$rootScope.$emit( 'handleCloseMenuForArticleEmit', null );
		};
		$scope.needToCloseMenusForFeed = function(){
			console.log( 'on body feed click' );
			$rootScope.$emit( 'handleCloseMenuForFeedEmit', null );
		};
		$scope.needToCloseMenusForNews = function(){
			console.log( 'on body news click' );
			$rootScope.$emit( 'handleCloseMenuForNewsEmit', null );
		};
	}] );
newsModule.controller( 'PopupEditFeedCtrl', ['$rootScope', '$scope', '$http', '$routeParams', '$location', '$timeout', 'NEWST', 'feedsService', 'newsService', 'articleService',
	function( $rootScope, $scope, $http, $routeParams, $location, $timeout, NEWST, feedsService, newsService, articleService ){

		$scope.createTitle = '';
		$scope.avg = 0;
		$scope.errors = {};
		$scope.options = newsService.getDeleteOptions();
		$scope.getParams = function(){
			var fields = [];
			if( $scope.advanced.fields.findTitle ){
				fields.push( 'title' );
			}

			if( $scope.advanced.fields.findBody ){
				fields.push( 'body' );
			}

			if( $scope.advanced.fields.findKeywords ){
				fields.push( 'keywords' );
			}

			var prm = {
				title                     : $scope.advanced.title,
				sid                       : $scope.advanced.sid,
				query                     : $scope.advanced.searchText,
				match                     : $scope.advanced.match,
				notification_email        : $scope.advanced.notification_email || $scope.advanced.notification_email_new,
				notification_include_body : $scope.advanced.notification_include_body ? 1 : 0
			};
			/* Sids */
			(function(){
				var mySids = [];
				_.each( $scope.advanced.advancedObjectsList, function( o ){
					mySids.push( {'sid' : o.sid} );
				} );
				_.each( $scope.advanced.feeds.list, function( o ){
					if( o.selected ){
						mySids.push( {'sid' : o.id} );
					}
				} );
				if( mySids.length > 0 ){
					prm.list = mySids;
				}
			})();

			if( fields.length > 0 ){
				prm.fields = fields;
			}
			return prm;
		}
		$scope.reset = function(){
			_.each( $scope.errors, function( item, key ){
				delete $scope.errors[key];
			} );
			$scope.avgTimeout = $timeout( $scope.updateAvg, 1000 );
		}
		$scope.EditFeed = function( onComplete, onError ){
			console.log( 'editing feed ' + $scope.advanced.title );
			var prm = $scope.getParams();

			if( $scope.isAvgOverLimit() && ! $scope.advanced.notification_email ){
				delete prm['notification_email'];
			}

			feedsService.createFeedToServer( prm ).then( function( res ){
				// reload feeds
				feedsService.getFeedsFromServer().then( function(){
					feedsService.selectFeed( $scope.advanced.sid );
					articleService.setViewMode( true, feedsService.getInfo( $scope.advanced.sid ) );
				} );
				onComplete && $scope.$eval( onComplete );
			}, function( res ){
				onError && $scope.$eval( onError );
				if( res.error = 'invalidEmail' ){
					if( $scope.advanced.notification_email ){
						$scope.advanced.notification_email_new = $scope.advanced.notification_email;
						$scope.advanced.notification_email = '';
					}
					$scope.errors.notification_email_new = true;
				}
			} );
			return false;
		};

		$scope.DeleteFeed = function(){
			/*
			 * TODO It's better to have separate method somewhere in AppCtrl to set delete feed popup options
			 */
			$scope.options.sid = $scope.advanced.sid;
			$scope.options.title = $scope.advanced.title;
			$scope.options.favoritesCount = 0;
			$scope.popupDeleteFeed.opened = true;
		}

		$scope.feedSelect = {
			opened : false
		};
		$scope.advanced = newsService.getEditFeedOptions();
		$scope.autoCompleteSearchQueryShow = false;
		$scope.autoCompleteSearchObjectShow = false;
		$scope.autoCompleteSearchObjectList = newsService.initAutoCompleteAdvancedItems();
		$scope.advancedText = '';

		$scope.HideAutoCompleteSearchObject = function(){
			if( $scope.autoCompleteSearchObjectShow ){
				$timeout( function(){
					if( $scope.autoCompleteSearchObjectShow ){
						$scope.autoCompleteSearchObjectShow = false;
						newsService.clearAutoCompleteAdvanced();
					}
				}, 200 );
			}
		}

		$scope.DoAutoCompleteSearchObject = function(){ //input
			var query = $scope.advancedText;
			console.log( 'try auto adv complete: ' + query )
			if( ! $scope.autoCompleteSearchObjectShow ){
				$scope.closeAdvancesSearchMenus();
			}
			if( query != '' ){
				newsService.getAutoAdvancedComplete( query );
				$scope.autoCompleteSearchObjectShow = true;
			} else {
				$scope.HideAutoCompleteSearchObject();
			}
		};
		$scope.AddSearchObjectToList = function( obj ){ //click by item add
			var query = obj.title;
			$scope.advanced.advancedObjectsList.push( {title : obj.title, sid : obj.sid} );
			$scope.autoCompleteSearchObjectShow = false;
			$scope.advancedText = '';
		};
		$scope.RemoveSearchObjectFromList = function( sid ){
			var res = [];
			_.each( $scope.advanced.advancedObjectsList, function( o ){
				if( o.sid != sid ){
					res.push( o );
				}
			} );
			$scope.advanced.advancedObjectsList = res;
		};
		$scope.SelectFeedShow = function( $event ){
			$event.stopPropagation();
			if( ! $scope.feedSelect.opened ){
				newsService.getFeedListForSearch( feedsService.getItems(), $scope.advanced.feeds.list );
				$scope.feedSelect.opened = true;
			} else {
				$scope.feedSelect.opened = false;
			}
		};

		$scope.closeAdvancesSearchMenus = function(){
			$scope.feedSelect.opened = false;
			$scope.HideAutoCompleteSearchObject()
		};

		$scope.isAvgOverLimit = function(){
			return $scope.avg >= NEWST.MAX_FEED_MESSAGES_TO_SUBSCRIBE;
		}

		$scope.updateAvg = function(){
			if( ! $scope.popupEditFeed.opened ) return;
			$scope.avgTimeout && $timeout.cancel( $scope.avgTimeout );
			feedsService.getAvgCount( $scope.getParams() )
				.then( function( r ){
					$scope.avg = r.data.avg;
				} );
		};

		$scope.$watch( 'advanced.feeds.listView + advanced.advancedObjectsList', $scope.updateAvg );

	}] );
newsModule.controller( 'PopupCtrl', ['$rootScope', '$scope', '$http', '$routeParams', '$location', '$timeout', 'NEWST', 'feedsService', 'newsService', 'articleService',
	function( $rootScope, $scope, $http, $routeParams, $location, $timeout, NEWST, feedsService, newsService, articleService ){

		$scope.errors = {};
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
				'title'                     : $scope.popupCreateFeed.title,
				'match'                     : $scope.advanced.match,
				'notification_email'        : $scope.advanced.notification_email || $scope.advanced.notification_email_new,
				'notification_include_body' : $scope.advanced.notification_include_body ? 1 : 0
			};

			if( $scope.isAvgOverLimit() ){
				delete prm['notification_email'];
			}

			if( $scope.advanced.searchText != '' ){
				prm.query = $scope.advanced.searchText;
			}
			;

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

		$scope.CreateFeed = function(){
			console.log( 'creating feed ' + $scope.popupCreateFeed.title );
			var prm = $scope.getParams();
			if( $scope.popupCreateFeed.title == '' ){
				return;
			}

			/* Sids */
			(function(){
				var mySids = [];
				_.each( $scope.advanced.advancedObjectsList, function( o ){
					mySids.push( {'sid' : o.sid, 'type' : o.type} );
				} );
				_.each( $scope.advanced.feeds.list, function( o ){
					if( o.selected ){
						mySids.push( {'sid' : o.id, 'type' : o.type} );
					}
				} );
				if( mySids.length > 0 ){
					prm.list = mySids;
				}
			})();

			feedsService.createFeedToServer( prm ).then( function( res ){
				feedsService.selectedFeedId = - 999;
				$location.search( {} );
				$location.path( '/feed/' + res.sid );
				feedsService.getFeedsFromServer();
				$scope.popupCreateFeed.opened = false;
			}, function( res ){
				if( res.error = 'invalidEmail' ){
					if( $scope.advanced.notification_email ){
						$scope.advanced.notification_email_new = $scope.advanced.notification_email;
						$scope.advanced.notification_email = '';
					}
					$scope.errors.notification_email_new = true;
				}
			} );
		};
		$scope.options = newsService.getDeleteOptions();
		$scope.editOptions = {searchText : '', match : 'all',
			fields                       : {findTitle : false, findBody : false, findKeywords : false},
			date                         : {dateView : 'За все время', from : '', to : '', isAllTime : true},
			feeds                        : {listView : 'Все ленты', list : [], isAll : true},
			objects                      : [], advancedObjectsList : []
		};
		$scope.EditFeed = function(){
			console.log( 'editing feed ' + $scope.options.title );
			var prm = {title : $scope.options.title, sid : $scope.options.sid};
			feedsService.createFeedToServer( prm ).then( function( res ){
				// reload feeds
				feedsService.getFeedsFromServer().then( function(){
					feedsService.selectFeed( $scope.options.sid );
					articleService.setViewMode( true, feedsService.getInfo( $scope.options.sid ) );
				} );
			} );
		};

		$scope.feedSelect = {
			opened : false
		};
		$scope.advanced = newsService.getCreateFeedOptions();
		$scope.autoCompleteSearchQueryShow = false;
		$scope.autoCompleteSearchObjectShow = false;
		$scope.autoCompleteSearchObjectList = newsService.initAutoCompleteAdvancedItems();
		$scope.advancedText = '';

		$scope.reset = function(){
			$scope.advanced = newsService.getCreateFeedOptions();
			$scope.advanced.searchText = '';
			_.each( $scope.errors, function( item, key ){
				delete $scope.errors[key];
			} );
			$scope.updateAvg();
		}


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
			$scope.HideAutoCompleteSearchObject();
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
			if( ! $scope.popupCreateFeed.opened ) return;
			feedsService.getAvgCount( $scope.getParams() )
				.then( function( r ){
					$scope.avg = r.data.avg;
				} );
		};
		$scope.$watch( 'advanced.feeds.listView + advanced.advancedObjectsList', $scope.updateAvg );
	}] );
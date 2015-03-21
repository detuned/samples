/* Services */
var services = angular.module( 'myApp.services', [] );
/*------------------ FEEDS SERVICE ------------------*/
services.factory( 'feedsService', ['$rootScope', '$http', '$q', 'NEWST',
	function( $rootScope, $http, $q, NEWST ){
		function FeedItem( data ){
			this.id = data.id;
			this.type = data.type;
			this.feedType = data.feedType;
			this.groupName = data.groupName;
			this.groupType = data.groupType;
			this.title = data.title;
			this.unread = data.unread;
			this.unreadArticles = data.unreadArticles || {};
			this.total = data.total;
			this.isSelected = false;
		}

		var
			selectedFeed = {},
			feedsById = {},
			feedsByGroups = {},
			getItemsPromise;

		function resetFeeds(){
			feeds.all.length = 0;
			feedsById = {};
			feedsByGroups = {};
		}

		function appendFeed( feedItem ){
			feeds.all.push( feedItem );
			feedsById[feedItem.id] = feedItem;
			if( feedItem.groupType ){
				if( ! ( feedItem.groupType in feedsByGroups ) ){
					feedsByGroups[feedItem.groupType] = {};
				}
				feedsByGroups[feedItem.groupType][feedItem.id] = feedItem;
			}
		}

		var feeds = {
			all            : [],
			favoritesList  : [],
			selectedFeedId : - 999,
			myC            : 0,

			initFeedsItems : function(){
				feeds.all = [];
				return feeds.all;
			},

			getItems : function(){
				return feeds.all;
			},

			getItemsAsync : function(){
				if( ! getItemsPromise ){
					this.getFeedsFromServer();
				}
				return getItemsPromise.then( function(){
					return feeds.all;
				} );
			},

			getFavorites : function(){
				return feeds.favoritesList;
			},

			getFeedById : function( sid ){
				return feedsById[sid];
			},

			getFeedByGroupTypeAndId : function( groupType, sid ){
				if( ( groupType in feedsByGroups ) && ( sid in feedsByGroups[groupType] ) ){
					return feedsByGroups[groupType][sid];
				}
				return null;
			},

			getFavoritesForArticle : function( ids ){

				feeds.unCheckFavorites();
				_.each( feeds.favoritesList, function( d ){
					_.each( ids, function( id ){
						if( d.id == id ){
							d.checked = true;
						}
					} );
				} );

				return feeds.favoritesList;
			},
			getCheckedFavoritesIds : function(){
				var res = [];
				_.each( feeds.favoritesList, function( d ){
					if( d.checked ){
						res.push( d.id );
					}
				} );

				return res;
			},
			unCheckFavorites       : function(){
				_.each( feeds.favoritesList, function( d ){
					d.checked = false;
				} );
			},
			hasCheckedFavorites    : function(){
				var res = false;
				_.each( feeds.favoritesList, function( d ){
					if( d.checked ){
						return true;
					}
				} );

				return res;
			},

			updateFromServerItems : function( data ){
				var getGroupName = function( groupType ){
					if( groupType == 0 ){
						return GLOBAL.l10n( 'ПРОДУКТЫ' )
					} else if( groupType == 1 ){
						return GLOBAL.l10n( 'МОИ ЛЕНТЫ' );
					} else return GLOBAL.l10n( 'ПОДБОРКИ' );
				};

				// response from DB
				var groups = data;
				resetFeeds();
				feeds.favoritesList.length = 0;
				var groupIndex = 0;
				angular.forEach( groups, function( group ){
					angular.forEach( group.list, function( item ){
						var
							itemName = item.title,
							feedItem;
						// need localization
						if( item.sid == NEWST.FEED_COMMON_ID ){
							itemName = GLOBAL.l10n( 'Общая лента' );
						} else if( item.sid == NEWST.FEED_COMMONUSER_ID ){
							itemName = GLOBAL.l10n( 'Все мои ленты' );
						}

						feedItem = new FeedItem( {
							id        : item.sid,
							type      : groupIndex,
							feedType  : item.type,
							groupType : group.type,
							groupName : getGroupName( groupIndex ),
							title     : itemName,
							unread    : + item.unread || 0,
							total     : item.count
						} );

						appendFeed( feedItem );

						// if notread > 0 then need to update selected feed
						if( groupIndex == 2 ){
							feeds.favoritesList.push( {title : item.title, id : item.sid, checked : false, total : item.count} );
						}
					} );

					groupIndex ++;
				} );
				feeds.unselectFeed();
			},

			selectFeed : function( id ){
				console.log( 'FeedsServ: try select=' + id );
				$rootScope.sidebar.opened = false;
				if( id < 0 ) return;
				feeds.unselectFeed();
				_.each( feeds.all, function( obj ){
					obj.isSelected = false;
					if( obj.id == id ){
						obj.isSelected = true;
						_.extend( selectedFeed, obj );
						console.log( 'feed selected ' + id );
					}
				} );
				feeds.selectedFeedId = id;
				//$rootScope.$emit('handleSelectedFeedIdEmit', {message: id});
			},

			setUnread : function( sids, article ){
				angular.forEach( sids, function( sid ){
					var feed = feeds.getFeedById( sid );
					if( ! feed ){
						return;
					}
					if( article && article.id && ( article.id in feed.unreadArticles ) ){
						return;
					}
					if( sid != feeds.selectedFeedId ){
						feed.unread ++;
					}
					if( article && article.id ){
						feed.unreadArticles[article.id] = article;
					}
				} );
			},

			highlight : function( sids ){
				angular.forEach( sids, function( sid ){
					var feed = feeds.getFeedById( sid );
					if( feed ){
						feed._highlight = true;
					}
				} );
			},

			updateVirtualFeed : function(){
				var commonIdx = - 1;
				var commonUserIdx = - 1;
				for( var i = 0; i < feeds.all.length; i ++ ){
					var feedId = feeds.all[i].id;
					if( feedId == NEWST.FEED_COMMON_ID ){
						commonIdx = i;
					} else if( feedId == NEWST.FEED_COMMONUSER_ID ){
						commonUserIdx = i;
					}
				}

				for( var t = 0; t < 2; t ++ ){
					var sum = 0;
					for( var i = 0; i < feeds.all.length; i ++ ){
						var feedId = feeds.all[i].id;
						if( feedId != NEWST.FEED_COMMON_ID && feedId != NEWST.FEED_COMMONUSER_ID && feeds.all[i].type == t ){
							sum += feeds.all[i].unread;
						}
					}

					if( t == 0 && commonIdx >= 0 ){
						feeds.all[commonIdx].unread = sum;
					} else if( t == 1 && commonUserIdx >= 0 ){
						feeds.all[commonUserIdx].unread = sum;
					}
				}
			},

			setClearUnread : function( sid ){
				if( angular.isDefined( sid ) ){
					var feed = feeds.getFeedById( sid );
					if( feed ){
						feed.unread = 0;
					}
				}
				else {
					/* Clearing all */
					angular.forEach( feeds.all, function( feed ){
						feed.unread = 0;
					} );
				}
			},

			getSelectedFeed : function(){
				return selectedFeed;
			},

			unselectFeed : function(){
				_.each( selectedFeed, function( el, index ){
					delete selectedFeed[ index ];
				} );
				feeds.selectedFeedId = - 999;
			},

			getInfo : function( id ){
				var
					feed = this.getFeedById( id ),
					res = {};
				if( feed ){
					res = _.pick( feed, 'id', 'title', 'groupName', 'type', 'total' );
					res.group = res.groupName
				}
				return res;
			},

			getFeedsFromServer : function(){
				getItemsPromise = $http.get( '/api/groups' ).then( function( r ){
					console.log( 'got groups data' );
					var response = r.data;
					feeds.updateFromServerItems( response );
				} );
				return getItemsPromise;
			},

			updateFavoritesFromServer : function(){
				return $http.get( '/api/groups' ).then( function( r ){
					console.log( 'got groups data' );
					// response from DB
					var groups = r.data;
					_.each( groups[2].list, function( item ){
						_.each( feeds.all, function( f ){
							if( f.type == 2 && f.id == item.sid ){
								f.total = item.count;
							}
						} );

						_.each( feeds.favoritesList, function( fl ){
							if( fl.id == item.sid ){
								fl.total = item.count;
							}
						} )
					} );

				}, function( e ){
					if( e.status == 404 ){
						console.log( 'unauthorizated!' );
						// need to login
					}
				} );
			},

			createFeedToServer : function( prm ){
				var deferred = $q.defer();
				$http.post( '/api/feed-edit', prm ).then( function( r ){
					if( Number( r.data.result ) == 1 ){
						deferred.reject( { 'error' : 'invalidEmail' } );
					}
					else if( ! r.data.sid ){
						deferred.reject( { 'error' : 'invalidSid' } );
					}
					else {
						deferred.resolve( r.data );
					}
				}, deferred.reject );
				return deferred.promise;
			},

			createFavoritesToServer : function( prm ){
				return $http.post( '/api/favorite-edit', prm ).then( function( r ){
					console.log( 'created new favorite' );
					var newFavId = r.data.sid;
					return newFavId;
				}, function( e ){
					if( e.status == 404 ){
						console.log( 'unauthorizated!' );
						// need to login
					}
				} );
			},

			deleteFavoritesFromServer : function( prm ){
				return $http.post( '/api/favorite-edit/?action=remove', prm ).then( function( r ){
					console.log( 'deleted favorite' );
				}, function( e ){
					if( e.status == 404 ){
						console.log( 'unauthorizated!' );
						// need to login
					}
				} );
			},

			deleteFeedsFromServer : function( prm ){
				return $http.post( '/api/feed-edit/?action=remove', prm ).then( function( r ){
					console.log( 'deleted user feed' );
				}, function( e ){
					if( e.status == 404 ){
						console.log( 'unauthorizated!' );
						// need to login
					}
				} );
			},

			favoritesListForAdd       : [],
			addToFavoritesToServer    : function( newsIds, favSids ){
				var news = newsIds;
				var sids = favSids;
				var prm = {news : news, sid : sids};
				return $http.post( '/api/favorite-edit/?action=add', prm ).then( function( r ){
					console.log( 'added to favorite ' + newsIds.length + ' news  ' + favSids.length + ' favs' );
					feeds.favoritesListForAdd = [];
				}, function( e ){
					feeds.favoritesListForAdd = [];
					if( e.status == 404 ){
						console.log( 'unauthorizated!' );
						// need to login
					}
				} );
			},
			updateToFavoritesToServer : function( newsIds, favSids ){
				var news = newsIds;
				var sids = favSids;
				var prm = {news : news, sid : sids};
				return $http.post( '/api/favorite-edit/?action=update', prm ).then( function( r ){
					console.log( 'updated favorite ' + newsIds.length + ' news  ' + favSids.length + ' favs' );
					feeds.favoritesListForAdd = [];
				}, function( e ){
					feeds.favoritesListForAdd = [];
					if( e.status == 404 ){
						console.log( 'unauthorizated!' );
						// need to login
					}
				} );
			},
			filterSidListByType       : function( sids, type ){
				type = type || NEWST.OBJECT_TYPE_RUBRIC;
				sids = angular.isArray( sids )
					? sids
					: sids
					? sids.toString().split( ',' )
					: [];
				sids = _.filter( sids, function( sid ){
					return ( type == NEWST.OBJECT_TYPE_RUBRIC && feeds.getFeedById( sid ) );
				} );
				return sids;
			},
			filterFeedListByType      : function( feedList, type ){
				type = type || NEWST.OBJECT_TYPE_RUBRIC;
				var res = _.filter( feedList, function( feed ){
					return ( feed.type == type /*&& feeds.getFeedById( feed.sid )*/ );
				} );
				return res;
			},
			getAvgCount               : function( prm ){
				var sid = '';
				for( var i in prm.list ){
					sid += '&sid[]=' + prm.list[i].sid;
				}
				delete prm.sid;
				delete prm.list;
				delete prm.title;

				return $http( {
					method : 'GET',
					url    : '/api/calcavg?' + sid,
					params : prm
				} );
			}
		};

		return feeds;
	}] );
/*---------------- NEWS ITEM SERVICE --------------------------*/
services.factory( 'newsService', ['$rootScope', '$http', '$q', 'feedsService', 'newsUtils', 'NEWST',
	function( $rootScope, $http, $q, feedsService, newsUtils, NEWST ){
		function NewsItem( data ){
			this.id = data.id;
			this.title = data.title;
			this.lead = data.lead;
			this.time = data.time;
			this.fullDate = data.fullDate;
			this.viewDate = data.viewDate;
			this.entry = data.entry;
			this.isRead = (data.isRead || false);
			this.isUrgent = (data.isUrgent || false);
			this.isSelected = ! ! data.isSelected;
			this.isChecked = false;
		}

		var
			/**
			 * Hash of news stored in items.all and keyed by id for fast searching
			 * Need to be sync with items.all
			 * @type {object}
			 */
				registry = {},
			lastLoadingOptions = {},
			totalItemsNum = 0,
			prevTotalItemsNum = 0,
			selectedItemId,
			requestId = 0,

			/**
			 * Gets more appropriate loading engine for specified options
			 */
				LoadingFactory = (function(){
				var
					/**
					 * Collection of registered loading engines
					 * Order matters
					 */
						engines = [],
					/**
					 * Base abstract loading engine
					 * Real engines extends it
					 */
						baseEngine = {
						name          : 'base',
						options       : {},
						url           : undefined,
						urlParams     : [],
						params        : {},
						method        : 'get',
						isAppropriate : function( options ){
							return true;
						},
						init          : function(){},
						basePrepare   : function(){
							this.params.limit = this.options.limit;
							this.params.offset = this.options.offset;
							if( items.viewNewsOption.needOnlyUrgent ){
								this.urlParams.push( 'priority[]=' + NEWST.PRIORITY_MOSTURGENT, 'priority[]=' + NEWST.PRIORITY_URGENT );
							}
						},
						prepare       : function(){},
						request       : function(){
							var
								that = this,
								urlParamsStr = this.urlParams.length
									? '?' + this.urlParams.join( '&' )
									: '',
								deferred = $q.defer(),
								reqId = ++ requestId;

							$http[ that.method ]( that.url + urlParamsStr, { params : that.params } ).then(
								function( res ){
									if( reqId != requestId ){
										/* Request has expired */
										deferred.reject( that.fail( { expired : true } ) )
										return;
									}
									deferred.resolve( that.done( res ) );
								},
								function( res ){
									deferred.reject( that.fail( res ) )
								}
							);
							return deferred.promise;
						},
						load          : function(){
							this.basePrepare();
							this.prepare();
							if( ! this.options.ignoreItems && ! this.options.offset ){
								$rootScope.needLoadMoreProgress = true;
								resetItems(); // Clear news list
							}
							return this.request();
						},
						done          : function( res ){
							if( ! this.options.ignoreItems ){
								items.scrollOptions.total = res.data.count;
								if( ! this.options.offset ){
									resetItems(); // Clear news list
								}
								items.addNewsDataToList( res.data.article );
							}
							$rootScope.needLoadMoreProgress = false;
							return this.onDone( res );
						},
						onDone        : function( res ){ return res;},
						fail          : function( res ){
							if( ! res.expired ){
								$rootScope.needLoadMoreProgress = false;
							}
							return this.onFail( res );
						},
						onFail        : function( res ){ return res;}
					},
					/**
					 * Registers given engine by extending base
					 * and pushing it as next into collection
					 */
						registerEngine = function( eng ){
						var newEngine = $.extend( true, {}, baseEngine, eng );
						engines.push( newEngine );
					},

					/**
					 * Public LoadingFactory's API
					 */
						instance = {
						getEngine : function( options ){
							var engine = _.find( engines, function( eng ){
								return eng.isAppropriate( options );
							} );
							engine = $.extend( true, {}, engine );
							engine.options = $.extend( {}, options );
							engine.init();
							return engine;
						}
					};

				/* Registering simple engine for loading feed items by its id */
				registerEngine( {
					name          : 'getFeedItems',
					isAppropriate : function( options ){
						return ! ! options.feedId;
					},
					prepare       : function(){
						items.currentFeedId = this.options.feedId;
						this.url = '/api/feed/' + this.options.feedId;
					},
					onDone        : function( res ){
						if( res.data.type ){
							items.loadedFeedType = res.data.type;
						}
						return res;
					}
				} );


				/* Registering engine for loading group of items by ids */
				registerEngine( {
					name          : 'getNewsByIds',
					isAppropriate : function( options ){
						return options.newsIds && options.newsIds.length;
					},
					prepare       : function(){
						var that = this;
						this.url = '/api/feed/';
						angular.forEach( this.options.newsIds, function( newsId ){
							that.urlParams.push( 'news[]=' + newsId );
						} );
					}
				} );


				/* Registering complex universal engine for all search types */
				registerEngine( {
					name          : 'search',
					isAppropriate : function( options ){
						return ( options.sid && options.sid.length )
							|| ( options.date_start && options.data_end)
							|| options.query
							|| ( options.fields && options.fields.length )
							|| options.match
					},
					prepare       : function(){
						var that = this;
						this.url = '/api/search/';

						if( angular.isArray( this.options.sid ) ){
							angular.forEach( this.options.sid, function( sid ){
								that.urlParams.push( 'sid[]=' + sid );
							} )
						}
						if( angular.isArray( this.options.fields ) ){
							angular.forEach( this.options.fields, function( value ){
								that.urlParams.push( 'fields[]=' + value );
							} )
						}
						this.params.match = this.options.match;
						if( this.options.date_start && this.options.date_end ){
							this.params.date_start = this.options.date_start;
							this.params.date_end = this.options.date_end;
						}

						this.params.query = this.options.query;
						items.currentFeedId = null;//NEWST.FEED_COMMON_ID; //TODO
					},
					onDone        : function( res ){
						$rootScope.searchCount = res.data.count;
						return res;
					}
				} );

				/* Registering base engine. If none of preceding dit not accept this one will guarantee returned */
				registerEngine( baseEngine );

				return instance;
			})();


		/**
		 * Adds article to appropriate list (creates if it's not exists
		 * @param article
		 * @param isAppend
		 * @return {Boolean}
		 */
		function addItemToList( article, isAppend ){
			if( article.id && registry[ article.id ] ){
				/* Such article already exists in feed, so just update it */
				console.log( 'Skip adding article ', article.id, ' cause it already exists in the feed' );
				_.extend( registry[ article.id ], getNewsItemData() );
				return true;
			}

			if( items.viewNewsOption.needOnlyUrgent && ! newsUtils.isArticleUrgent( article ) ){
				console.log( 'Skip adding article ', article.id, ' cause it not urgent' );
				return true;
			}
			var
				listId = getAppropriateListId( article, isAppend ),
				newsItem,
				list = items.all[listId];

			if( ! list ){
				/* List not specified or not exists */
				return false;
			}
			newsItem = new NewsItem( getNewsItemData() );

			items.all[listId].list[ isAppend ? 'push' : 'unshift' ]( newsItem );

			if( article.id ){
				registry[ article.id ] = newsItem;
			}

			totalItemsNum ++;

			function getNewsItemData(){
				var data = {
					id         : article.id,
					title      : article.title,
					lead       : article.lead,
					time       : article.date.hour + ":" + article.date.min,
					fullDate   : article.date.day + ' ' + article.date.month + ' ' + article.date.year,
					entry      : feedsService.filterFeedListByType( article.list ),
					isUrgent   : newsUtils.isArticleUrgent( article ),
					isRead     : (article.readed > 0) || ( selectedItemId && article.id == selectedItemId ),
					isSelected : selectedItemId && article.id == selectedItemId
				};
				if( list && list.viewDate ){
					data.viewDate = list.viewDate;
				}
				return data;
			}

			return true;
		}

		/**
		 * Searchs for list with the same date as item
		 * Or if it not exists, create it
		 * @param item
		 * @return listId
		 */
		function getAppropriateListId( item, isAppend ){
			var aDay = item.date.day;
			var aMonth = item.date.month - 1;
			var aYear = item.date.year;
			var articleDate = new Date( aYear, aMonth, aDay );

			var listId = undefined;
			for( i = 0; i < items.all.length; i ++ ){
				var elapsed = items.all[i].date - articleDate;
				if( elapsed == 0 ){ // exist
					listId = i;
				}
			}
			var myViewDate = parseViewDate( aYear, aMonth, aDay );
			if( typeof listId == 'undefined' ){
				items.all[ isAppend ? 'push' : 'unshift' ]( {date : articleDate, isChecked : false, viewDate : myViewDate, list : []} );
				listId = isAppend ? items.all.length - 1 : 0;
			}
			return listId
		}

		function resetItems(){
			items.all.length = 0;
			registry = {};
			totalItemsNum = 0
		}

		function resetSearchOptions( searchOptions ){
			if( ! angular.isDefined( searchOptions ) ){
				searchOptions = {};
			}
			searchOptions.match = 'all';
			searchOptions.fields = {findTitle : false, findBody : false, findKeywords : false};
			searchOptions.date = {dateView : GLOBAL.l10n( 'За все время' ), from : '', to : '', isAllTime : true};
			searchOptions.feeds = {listView : GLOBAL.l10n( 'Все ленты' ), list : [], isAll : true};
			searchOptions.objects = [];
			searchOptions.advancedObjectsList = [];
			searchOptions.notification_email = null;
			searchOptions.notification_email_new = null;
			searchOptions.notification_include_body = null;
			return searchOptions;
		}

		/**
		 * Checks is at least one of given advanced search options not at it's default state
		 * Most likely it means user really want to use _advanced_ not simple search
		 * @param searchOptions
		 * @returns {boolean}
		 */
		function isSearchOptionsAtDefaultState( searchOptions ){
			if( ! searchOptions || searchOptions.match != 'all' ){
				return false;
			}
			if( searchOptions.fields
				&& ( searchOptions.fields.findTitle || searchOptions.fields.findBody || searchOptions.fields.findKeywords ) ){
				return false;
			}
			if( searchOptions.feeds && searchOptions.feeds.list && items.getSelectedFeedsForSearch( searchOptions.feeds.list ).length ){
				return false;
			}
			if( searchOptions.date && searchOptions.date.from && searchOptions.date.to ){
				return false;
			}
			return true;
		}

		var items = {
			all                    : [],
			checkedList            : [],
			currentFeedId          : - 999,
			myC                    : 0,
			maxItemsInAutocomplete : 5,
			loadedFeedType         : null,
			viewNewsOption         : {
				needOnlyUrgent : false,
				viewNewsType   : NEWST.NEWS_TYPE_NOLEAD
			},
			scrollOptions          : {total : 0},

			initNewsItems : function(){
				items.all = [];
				registry = {};
				totalItemsNum = 0
				return items.all;
			},

			getItems : function(){
				return items.all;
			},

			getTotalItemsNum : function(){
				return totalItemsNum;
			},

			isCurrentLoadingComplete : function(){
				return prevTotalItemsNum && ( prevTotalItemsNum == this.getTotalItemsNum() );
			},

			isLoadedFavorite : function(){
				return items.loadedFeedType == 'favorite';
			},

			getViewNewsOption : function(){
				return items.viewNewsOption;
			},

			resetSelectedItem : function(){
				selectedItemId = null;
			},

			addFromCometNewsDataToList : function( myNewsArray, sids, type ){

				var isArticleBelongsToOpenedFeed = false;
				angular.forEach( sids, function( sid ){
					if( sid == items.currentFeedId ){
						isArticleBelongsToOpenedFeed = true;
					}
				} );

				if( ! isArticleBelongsToOpenedFeed || $rootScope.searchMode ){
					return false;
				}

				angular.forEach( myNewsArray, addItemToList );
			},

			addNewsDataToList : function( myNewsArray, feedId ){
				_.each( myNewsArray, function( article ){
					addItemToList( article, true );
				} );
			},


			/**
			 * Main and super universal way to load any items
			 * @param options
			 */
			loadNews : function( options ){
				var _options = {
						/**
						 * Flag means this loading has to be based on previous one
						 * @type boolean
						 */
						inherit  : false,
						feedId   : undefined,
						query    : undefined,
						sid      : [],
						offset   : 0,
						nextPage : false,
						limit    : NEWST.NEWS_BASE_COUNT
					},
					loadingEngine,
					res;
				if( options ){
					_options = _.extend(
						_options,
						options.inherit && lastLoadingOptions
							? lastLoadingOptions
							: {},
						options
					);
				}
				if( _options.nextPage ){
					_options.offset = items.getItemsCount();
					if( options.inherit ){
						prevTotalItemsNum = items.getItemsCount();
					}
				}
				else {
					prevTotalItemsNum = 0;
				}

				if( _options.feedId != lastLoadingOptions.feedId ){
					selectedItemId = null;
				}

				optionToArray( 'sid' );
				optionToArray( 'fields' );


				loadingEngine = LoadingFactory.getEngine( _options );

				res = loadingEngine.load();

				/* Preserving used options to allow repeat or continue loading in the future */
				lastLoadingOptions = _.extend( {}, _options );


				function optionToArray( opt ){
					if( _options[opt] && ! angular.isArray( _options[opt] ) ){
						_options[opt] = _options[opt].toString().split( ',' );
					}
				}

				return res;
			},

			selectItem : function( id ){
				console.log( 'newsServ: try to select news=' + id );
				var needMarkAsReadOtherItems = false;
				_.each( items.all, function( objByDate ){
					_.each( objByDate.list, function( obj ){
						obj.isSelected = false;
						if( obj.id == id ){
							obj.isSelected = true;
							obj.isRead = true; // send to server read status and server should to mark old news as read
							needMarkAsReadOtherItems = true;
							console.log( 'newsServ: news selected=' + id );
						}

						if( needMarkAsReadOtherItems ){
							obj.isRead = true; // mark local items as read
						}
					} );
				} );
				$rootScope.$emit( 'handleSelectedNewsIdEmit', {message : id} );
				selectedItemId = id;
			},

			unselectItem : function(){
				var selectedItem;
				if( selectedItemId && ( selectedItem = this.getItemById( selectedItemId ) ) ){
					selectedItem.isSelected = false;
					selectedItemId = null;
				}
			},


			readNewsSendToServer : function( newsIds, feedId ){
				var prm = { news : newsIds, sid : feedId };
				if( lastLoadingOptions ){
					_.extend( prm, _.pick( lastLoadingOptions, 'sid', 'query', 'date_start', 'date_end', 'fields', 'match' ) );
					if( lastLoadingOptions.feedId ){
						if( ! prm.sid ){
							prm.sid = [];
						}
						if( _.indexOf( prm.sid, lastLoadingOptions.feedId ) < 0 ){
							prm.sid.push( lastLoadingOptions.feedId );
						}
					}
				}
				if( prm.sid ){
					if( ! prm.sid.length ){
						delete prm.sid;
					}
					// Waiting for server fix in NEWSTERMINAL-163
//		        else if ( prm.sid.length == 1 ){
//		            prm.sid = prm.sid[0];
//		        }
				}

				return $http.post( 'api/news?action=read', prm ).then( function( r ){
					// response from DB
					console.log( 'NewsServ: sended read items data' );

				}, function( e ){
					if( e.status == 404 ){
						console.log( 'unauthorizated!' );
						// need to login
					}
				} );
			},

			getItemById : function( id ){
				return registry[ id ] || null;
			},

			getItemsCount : function(){
				var res = 0;
				_.each( items.all, function( objByDate ){
					res += objByDate.list.length;
				} );
				return res;
			},

			checkedListUpdate : function(){
				items.checkedList = [];
				_.each( registry, function( obj ){
					if( obj.isChecked ){
						items.checkedList.push( obj.id );
					}
				} );
			},

			isHasChecked : function(){
				this.checkedListUpdate();
				return this.checkedList.length > 0;
			},

			getCheckedIds : function(){
				return this.checkedList;
			},

			clearCheckedIds : function(){
				_.each( items.all, function( objByDate ){
					objByDate.isChecked = false;
					_.each( objByDate.list, function( obj ){
						obj.isChecked = false;
					} );
				} );

				items.checkedList = [];
			},

			checkNewsByDate : function( date, check ){
				_.each( items.all, function( objByDate ){
					if( date == objByDate.date ){
						_.each( objByDate.list, function( obj ){
							obj.isChecked = check;
						} );
					}
				} );

				items.checkedListUpdate();
			},

			getAutoComplete         : function( query, options ){
				var
					storage = arguments.callee,
					_options = angular.extend( {
						more : false
					}, options || {} );
				if( items.autoCompleteData.query == query && _options.more ){
					if( storage.isLoading || items.autoCompleteData.isFull ){
						return;
					}
					items.autoCompleteData.offset = items.autoCompleteData.items.length;
				}
				else {
					items.autoCompleteData.offset = 0;
					items.autoCompleteData.isFull = false;
				}
				items.autoCompleteData.query = query;
				items.autoCompleteData.inProgress = true;

				storage.isLoading = true;
				$http.get( '/api/suggest', {params : _.pick( items.autoCompleteData, 'query', 'limit', 'offset' ), cache : true} ).then( function( r ){
					if( items.autoCompleteData.query == query && _options.more ){

					}
					else {
						items.autoCompleteData.items.length = 0;
					}
					storage.isLoading = false;
					items.autoCompleteData.inProgress = false;
					// response from DB
					console.log( 'NewsServ: got auto search data' );
					var mySearchArray = ( r.data.list || [] );
					if( mySearchArray.length < items.autoCompleteData.limit ){
						items.autoCompleteData.isFull = true;
					}
//	            mySearchArray = mySearchArray.slice( 0, items.maxItemsInAutocomplete );
					// need to update list
					_.each( mySearchArray, function( item ){
						items.autoCompleteData.items.push( {
							sid            : item.sid,
							group          : item.group,
							title          : item.title,
							suggest_string : item.suggest_string || r.data.suggest_string //TODO
						} );
					} );

				}, function( e ){
					if( items.autoCompleteData.query == query && _options.more ){
						items.autoCompleteData.isFull = true;
					}
					storage.isLoading = false;
					items.autoCompleteData.inProgress = false;
					if( e.status == 404 ){
						console.log( 'unauthorizated!' );
						// need to login
					}
				} );
			},
			getAutoAdvancedComplete : function( q ){
				$http.get( '/api/suggest', {params : {query : q}, cache : true} ).then( function( r ){
					items.autoCompleteAdvancedItems.length = 0;
					// response from DB
					console.log( 'NewsServ: got auto adv search data' );
					var mySearchArray = ( r.data.list || [] ).slice( 0, items.maxItemsInAutocomplete );
					// need to update list
					_.each( mySearchArray, function( item ){
						items.autoCompleteAdvancedItems.push( {sid : item.sid, group : item.group, title : item.title} );
					} );

				}, function( e ){
					if( e.status == 404 ){
						console.log( 'unauthorizated!' );
						// need to login
					}
				} );
			},

			autoCompleteData          : {
				items            : [],
				query            : null,
				limit            : NEWST.AUTOCOMPLETE_BASE_COUNT,
				offset           : 0,
				inProgress       : false,
				isFull           : false,
				highlightedIndex : NaN
			},
			autoCompleteAdvancedItems : [],

			initAutoCompleteData : function(){
				items.autoCompleteData.items = [];
				return items.autoCompleteData;
			},

			clearAutoComplete             : function(){
				items.autoCompleteData.items.length = 0;
			},
			clearAutoCompleteAdvanced     : function(){
				items.autoCompleteAdvancedItems.length = 0;
			},
			initAutoCompleteAdvancedItems : function(){
				//items.autoCompleteAdvancedItems = [];
				return items.autoCompleteAdvancedItems;
			},

			getFeedListForSearch : function( feedItemsList, list ){
				if( ! angular.isDefined( list ) ){
					list = items.searchOptions.feeds.list;
				}
				_.each( feedItemsList, function( o ){
					if( (o.type == 0 && o.id != NEWST.FEED_COMMON_ID) || (o.type == 1 && o.id != NEWST.FEED_COMMONUSER_ID) ){
						if( ! _.find( list, function( item ){ return item.id == o.id; } ) ){
							list.push( { id : o.id, title : o.title, type : o.feedType, selected : false } );
						}
					}
				} );
			},

			updateFeedListForSearch : function( feedId, searchOptions ){
				var
					selectedTitles = [];
				if( ! angular.isDefined( searchOptions ) ){
					searchOptions = items.searchOptions;
				}
				_.each( searchOptions.feeds.list, function( o ){
					if( feedId === false ){
						o.selected = false;
					} else if( o.id == feedId ){
						o.selected = ! o.selected;
					}
					if( o.selected ){
						selectedTitles.push( o.title );
					}
				} );

				if( selectedTitles.length > 0 ){
					searchOptions.feeds.isAll = false;
					searchOptions.feeds.listView = selectedTitles.join( ', ' );
				}
				else {
					searchOptions.feeds.isAll = true;
					searchOptions.feeds.listView = GLOBAL.l10n( 'Все ленты' );
				}
			},

			getSelectedFeedsForSearch : function( list ){
				return _.filter( list || items.searchOptions.feeds.list, function( feed ){
					return feed.selected;
				} )
			},

			applyDateView : function( from, to ){
				items.searchOptions.date.from = from;
				items.searchOptions.date.to = to;
				items.updateDateView();
			},

			updateDateView : function(){
				var str = GLOBAL.l10n( 'За все время' );
				items.searchOptions.date.isAllTime = true;
				if( items.searchOptions.date.from && items.searchOptions.date.to ){
					str = [
						items.searchOptions.date.from.dateFormat( 'j M Y' ),
						items.searchOptions.date.to.dateFormat( 'j M Y' )
					].join( ' — ' );

					items.searchOptions.date.isAllTime = false;
				}

				items.searchOptions.date.dateView = str;
			},

			searchOptions     : resetSearchOptions(),
			createFeedOptions : resetSearchOptions(),

			isSearchOptionsAtDefaultState : isSearchOptionsAtDefaultState,

			getCreateFeedOptions : function(){
				return items.createFeedOptions;
			},

			clearCreateFeedOptions : function(){
				resetSearchOptions( items.createFeedOptions );
			},

			getAdvancedSearchOptions : function(){
				return items.searchOptions;
			},


			fillCreateFeedOptionsFromSearch : function(){
				$.extend( true, resetSearchOptions( items.createFeedOptions ), items.searchOptions );
			},

			clearAdvancedSearchFields : function(){
				return resetSearchOptions( items.searchOptions );
			},
			clearSearchTextField      : function(){
				items.searchOptions.searchText = '';
			},

			deleteOptions : {title : '', sid : '', favoritesCount : 0},

			getDeleteOptions : function(){
				return items.deleteOptions;
			},

			deleteNewsFromFavoritesToServer : function( favoriteId, newsIds ){
				var prm = {news : newsIds};
				return $http.post( '/api/favorite-edit/' + favoriteId + '?action=del', prm ).then( function( r ){
					// response from DB
					console.log( 'NewsServ: deleted news items from favorite' );

				}, function( e ){
					if( e.status == 404 ){
						console.log( 'unauthorizated!' );
						// need to login
					}
				} );
			},

			editFeedOptions    : resetSearchOptions(),
			getEditFeedOptions : function(){
				return items.editFeedOptions;
			},

			clearEditFeedOptions : function(){
				return resetSearchOptions( items.editFeedOptions );
			},

			getFullFeedData : function( feedId, feedItemsList ){
				resetSearchOptions( items.editFeedOptions );
				return $q.all( [
						this.getEditFeedOptionsFromServer( feedId, feedItemsList )/*,
						 this.getSubscribeToUserFeedInfo( feedId )*/
					] ).then( function( res ){
						var subscribeData = res[1] || {};
						//TODO remove this hack placed for server's back compatibility
//				if ( ! items.editFeedOptions.notification_email ){
//					items.editFeedOptions.notification_email = subscribeData.email;
//					items.editFeedOptions.notification_include_body = ! ! Number( subscribeData.include_body );
//				}
					} );
			},

			setAdvancedObjectsList : function( objects, targetOptions ){
				if( ! angular.isDefined( targetOptions ) ){
					targetOptions = this.searchOptions;
				}
				if( targetOptions.advancedObjectsList ){
					targetOptions.advancedObjectsList.length = 0;
				}
				else {
					targetOptions.advancedObjectsList = [];
				}

				function pushObject( obj ){
					targetOptions.advancedObjectsList.push( _.pick( obj,
						'title',
						'sid',
						'type',
						'group',
						'_highlighted'
					) );
				}

				if( angular.isArray( objects ) ){
					angular.forEach( objects, pushObject );
				}
				else if( angular.isObject( objects ) ){
					pushObject( objects );
				}
			},

			getEditFeedOptionsFromServer : function( feedId, feedItemsList ){

				return $http.get( '/api/feed-edit/' + feedId ).then( function( r ){
					// response from DB
					console.log( 'NewsServ: got feed options data' );
					var
						options = r.data,
						feedsSelectedRegistry = {};
					items.editFeedOptions.title = options.title;
					items.editFeedOptions.sid = options.sid;
					items.editFeedOptions.searchText = options.query;

					items.editFeedOptions.notification_email = options.notification_email;
					items.editFeedOptions.notification_include_body = ! ! Number( options.notification_include_body );

					switch( options.match ){
						case 'all':
						case 'any':
						case 'phrase':
							items.editFeedOptions.match = options.match;
							break;
						default:
							items.editFeedOptions.match = 'all';
					}
					;

					var fields = options.fields;
					items.editFeedOptions.fields.findTitle = false;
					items.editFeedOptions.fields.findBody = false;
					items.editFeedOptions.fields.findKeywords = false;
					_.each( fields, function( field ){
						switch( field ){
							case 'title':
								items.editFeedOptions.fields.findTitle = true;
								break;
							case 'body':
								items.editFeedOptions.fields.findBody = true;
								break;
							case 'keywords':
								items.editFeedOptions.fields.findKeywords = true;
								break;
						}
					} );

					items.editFeedOptions.advancedObjectsList = [];

					// riant-301 Need to fill title when server will support that
					_.each( options.list, function( o ){
						if( o.type == NEWST.OBJECT_TYPE_RUBRIC ){
							feedsSelectedRegistry[ o.sid ] = o;
						}
						else {
							items.editFeedOptions.advancedObjectsList.push( o );
						}
					} );


					if( items.editFeedOptions.feeds.list.length == 0 ){
						items.getFeedListForSearch( feedItemsList, items.editFeedOptions.feeds.list );
					}

					_.each( items.editFeedOptions.feeds.list, function( s ){
						s.selected = s.id in feedsSelectedRegistry;
					} );

					items.updateFeedListForSearch( true, items.editFeedOptions );

					return r.data;

				} );
			},
			emailOptions                 : {sids : [], address : '', text : '', format : 'pdf'},
			getEmailOptions              : function(){
				return items.emailOptions;
			},
			setEmailOptions              : function( sids ){
				items.emailOptions.address = '';
				items.emailOptions.text = '';
				items.emailOptions.format = 'pdf';
				items.emailOptions.sids = sids;
			},
			sendEmailNews                : function(){
				var newsArr = '';
				_.each( items.emailOptions.sids, function( id ){
					newsArr += '&news[]=' + id;
				} );

				return $http.get( '/api/export-mail?format=' + items.emailOptions.format + '&body=' + items.emailOptions.text + '&to=' + items.emailOptions.address + newsArr ).then( function( r ){
					// response from DB
					console.log( 'NewsServ: sended email' );
					var link = r.data.link;
					var code = r.data.result;
					if( code != 0 ){
						// raise some exception
					}
				}, function( e ){
					if( e.status == 404 ){
						console.log( 'unauthorizated!' );
						// need to login
					}
				} );
			},
			sendFeedback                 : function( mail_subject, mail_text ){
				var params = {
					'mail_subject' : {
						id    : mail_subject.id,
						title : mail_subject.title
					},
					'mail_text'    : mail_text
				};

				return $http.post( '/api/mail', params ).then( function( r ){
					// response from DB
					console.log( 'NewsServ: feedback sended' );

				}, function( e ){
					if( e.status == 404 ){
						console.log( 'unauthorizated!' );
						// need to login
					}
				} );
			},

			sendErrorFeedback       : function( fields ){
				var
					params = {
						mail_subject : {
							id    : 'errors',
							title : GLOBAL.l10n( 'Сообщение об ошибке' )
						},
						mail_text    : 'Ошибка в тексте\n\n'
							+ (fields.errorSelectedNodeUrl ? fields.errorSelectedNodeUrl + '\n\n' : '')
							+ '"' + fields.errorSelectedTextPre
							+ ' >> ' + fields.errorSelectedText + ' << '
							+ fields.errorSelectedTextPost + '"'
							+ '\n\nКомментарий:\n\n' + fields.text + '\n'
					};
				return $http.post( '/api/mail', params );
			},
			subscribeOptions        : {sid : '', address : '', includeBody : false},
			getSubscribeOptions     : function(){
				return items.emailOptions;
			},
			setSubscribeOptions     : function( sids ){
				items.emailOptions.sids = sids;
			},
			subscribeToUserFeed     : function( sid, email, includeBody ){
				var params = {email : email, include_body : includeBody ? '1' : '0'};
				return $http.post( '/api/notification/' + sid, params ).then( function( r ){
					// response from DB
					console.log( 'NewsServ: subscribed' );

				}, function( e ){
					if( e.status == 404 ){
						console.log( 'unauthorizated!' );
						// need to login
					}
				} );
			},
			unsubscribeFromUserFeed : function( sid ){
				return $http.post( '/api/notification/' + sid + '?action=del', {} ).then( function( r ){
					// response from DB
					console.log( 'NewsServ: unsubscribed' );

				}, function( e ){
					if( e.status == 404 ){
						console.log( 'unauthorizated!' );
						// need to login
					}
				} );
			},

			getSubscribeToUserFeedInfo : function( sid ){
				return $http.get( '/api/notification/' + sid ).then( function( r ){
					// response from DB
					console.log( 'NewsServ: got info subscribed' );
					return {email : r.data.email, includeBody : r.data.include_body};
				} );
			},

			getObjectData : function( objectId ){
				return $http.get( '/api/object/' + objectId, { cache : true } ).then( function( res ){
					return res.data;
				} );
			}
		};

		return items;
	}
] );
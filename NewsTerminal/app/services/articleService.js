/*------------- ARTICLE SERVICE ----------------*/
services.factory( 'articleService', ['$http', '$q', 'newsService', 'feedsService', 'newsUtils', function( $http, $q, newsService, feedsService, newsUtils ){
	var groupsNamesLocalized = {
		'person'       : GLOBAL.l10n( 'Персона' ),
		'location'     : GLOBAL.l10n( 'Географический объект' ),
		'organization' : GLOBAL.l10n( 'Организация' ),
		'event'        : GLOBAL.l10n( 'Событие' ),
		'product'      : GLOBAL.l10n( 'Продукт' ),
		'category'     : GLOBAL.l10n( 'Категория' )
	};

	function NewsTextItem( data ){
		this.id = data.id;
		this.title = data.title;
		this.body = data.body;
		this.keywords = data.keywords;
		this.time = data.time;
		this.viewDate = data.viewDate;
		this.objectsList = data.objectsList;
		this.hasObjects = data.hasObjects;
		this.mediaList = data.mediaList;
		this.hasMedia = data.hasMedia;
		this.groupName = data.groupName;
		this.groupNameLocalized = groupsNamesLocalized[ data.groupName ] || data.groupName;
		this.imgUrl = data.imgUrl;
		this.wikiUrl = data.wikiUrl;
		this.total = data.total;
		this.feed = data.feed;
		this.feeds = data.feeds;
	}

	var item = {
		options              : [
			{feedViewMode : true}
		],
		x                    : [],
		state                : {
			loading : false
		},
		groupsNamesLocalized : groupsNamesLocalized,
		init                 : function(){
			return item.x;
		},
		initOptions          : function(){
			return item.options;
		},
		resetArticle         : function(){
			item.x.length = 0;
		},
		getCurrentFeed       : function(){
			return item.options[1] || {};

		},
		setLoadingState      : function( isLoading ){
			if( isLoading ){
				/*
				 * If we indicate loading, it's probably means that we really trying to change article, yep?
				 * So clear previous
				 * */
				this.resetArticle();
			}
			item.state.loading = ! ! isLoading;
		},

		getState : function(){
			return item.state;
		},

		setViewMode          : function( feedMode, data ){
			var articleMode;
			item.options.length = 0;
			item.options.push( {feedViewMode : feedMode} );
			if( angular.isObject( data ) ){
				if( data.type == 'tag' && data.group ){
					data.groupNameLocalized = groupsNamesLocalized[ data.group ] || data.group;
				}
				articleMode = _.pick( data,
					'title',
					'group',
					'groupNameLocalized',
					'type',
					'id',
					'total',
					'search',
					'searchParams',
					'searchedFeeds',
					'query' );
				if( feedMode ){
					articleMode.feed = data;
				}
				item.options.push( articleMode );
			}
		},
		update               : function( id ){
			item.x.length = 0;
			var obj = newsService.getItemById( id );
			item.x.unshift( new NewsTextItem( {title : obj.title, time : obj.time, fullDate : obj.fullDate} ) );
		},
		setObjectAsArticle   : function( data ){
			if( ! data ){
				return;
			}
			var
				date = data['article-max_date'],
				groups, articleData;
			item.x.length = 0;
			if( data['xml-fields']
				&& data['xml-fields'].tag
				&& ( groups = _.toArray( data['xml-fields'].tag ) )
				&& groups[0]
				&& ( articleData = groups[0].wiki )
				){
				item.x.unshift( new NewsTextItem( {
					id          : data.sid,
					title       : data.title,
					keywords    : data.keywords,
					time        : date
						? date.hour + ":" + date.min
						: undefined,
					viewDate    : date
						? parseViewDate( date.year, parseInt( date.month ) - 1, date.day, true )
						: undefined,
					objectsList : [],//parseObjectsList(data.list),
					body        : articleData.text,
					hasObjects  : false,
					mediaList   : newsUtils.parseMediaList( data.media ),
					groupName   : data.group,
					wikiUrl     : articleData.links
						? articleData.links.item
						: undefined,
					imgUrl      : articleData.media && articleData.media.filename
						? GLOBAL.data.imagesUrl + '/' + articleData.media.filename
						: undefined
				} ) );
			} else {
				// no wiki
				item.x.unshift( new NewsTextItem( {
					id          : data.sid,
					title       : data.title,
					keywords    : data.keywords,
					time        : date
						? date.hour + ":" + date.min
						: undefined,
					viewDate    : date
						? parseViewDate( date.year, parseInt( date.month ) - 1, date.day, true )
						: undefined,
					objectsList : [],//parseObjectsList(data.list),
					body        : '',
					hasObjects  : false,
					mediaList   : newsUtils.parseMediaList( data.media ),
					groupName   : data.group
				} ) );
			}
			item.setLoadingState( false );
		},
		getArticleFromServer : function( id ){
			this.setLoadingState( true );
			return $http.get( '/api/news/' + id ).then( function( r ){
				console.log( 'arServ: got article data' );
				var response = r.data;
				item.x.length = 0;

				var mediaList = newsUtils.parseMediaList( response.media );
				var parsedObjList = parseObjectsList( response.list );
				item.x.unshift( new NewsTextItem( {
					id          : id,
					title       : response.title,
					keywords    : response.keywords,
					time        : response.date.hour + ":" + response.date.min,
					viewDate    : parseViewDate( response.date.year, parseInt( response.date.month ) - 1, response.date.day, true ),
					objectsList : parsedObjList,
					body        : response.body,
					hasObjects  : angular.isDefined( parsedObjList ) && parsedObjList.length > 0,
					mediaList   : mediaList,
					hasMedia    : mediaList && mediaList.list && mediaList.list.length,
					feeds       : feedsService.filterFeedListByType( response.list )
				} ) );

				item.setLoadingState( false );

			}, function( e ){
				if( e.status == 404 ){
					console.log( 'unauthorizated!' );
					// need to login
				}
			} );
		},

		getArticlesForPrintFromServer : function( ids ){
			newsService.loadNews( {
				newsIds : ids
			} ).then( function( res ){
					var
						articles = res.data.article,
						parsedObjList = parseObjectsList( articles )
					item.x.length = 0;
					angular.forEach( articles, function( response ){
						item.x.push( new NewsTextItem( {
							id          : response.id,
							title       : response.title,
							keywords    : response.keywords,
							time        : response.date.hour + ":" + response.date.min,
							viewDate    : parseViewDate( response.date.year, parseInt( response.date.month ) - 1, response.date.day, true ),
							objectsList : parsedObjList,
							body        : response.body,
							hasObjects  : angular.isDefined( parsedObjList ) && parsedObjList.length > 0
						} ) );
					} );
				} );

		},
		getFavoritesUpdateFromServer  : function( id ){
			return $http.get( '/api/news/' + id ).then( function( r ){
				console.log( 'arServ: got article data' );
				var response = r.data;
				var parsedObjList = parseObjectsList( response.list );
				item.x[0].objectsList = parsedObjList;
			}, function( e ){
				if( e.status == 404 ){
					console.log( 'unauthorizated!' );
					// need to login
				}
			} );
		},

		exportLink                    : '',

		exportNews                    : function( ids, format ){
			var
				newsArr = '',
				url,
				deferred = $q.defer();
			_.each( ids, function( id ){
				newsArr += '&news[]=' + id;
			} );
			url = '/api/export?format=' + format + newsArr;
			deferred.resolve( {
				url : url
			} );
			return deferred.promise;
		}
	};

	return item;
}
] );

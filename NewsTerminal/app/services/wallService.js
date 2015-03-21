/*---------------- WALL ITEM SERVICE --------------------------*/
services.factory('wallService', ['$rootScope', '$http', 'newsUtils', 'feedsService', 'NEWST',
function($rootScope, $http, newsUtils, feedsService, NEWST) {
    function WallItem(data) {
        this.id = data.id;
        this.title = data.title;
        this.lead = data.lead;
        this.time = data.time;
        this.fullDate = data.fullDate;
        this.viewDate = data.viewDate;
        this.entry = data.entry;
        this.isRead = (data.isRead || false);
        this.isUrgent = (data.isUrgent || false);
        this.isSelected = false;
        this.isChecked = false;
    }

    function WallTextItem(data) {
        this.id = data.id;
        this.title = data.title;
        this.keywords = data.keywords;
        this.body = data.body;
        this.time = data.time;
        this.viewDate = data.viewDate;
        this.objectsList = data.objectsList;
        this.feeds = data.feeds;
        this.mediaList = data.mediaList;
        this.hasMedia = data.hasMedia;
    }

	var
		/**
		 * Hash of news stored in items.all and keyed by id for fast searching
		 * Need to be sync with items.all
		 * @type {object}
		 */
		registry = {},
		currentPopupNewsId;

	function resetItems(){
		items.all.length = 0;
		registry = {};
	}

	/**
	 * Adds article to items.all
	 * @param article
	 * @param isAppend
	 * @return {Boolean}
	 */
	function addWallItem( article, isAppend ){
		if ( article.id && registry[ article.id ] ){
			/* Such article already exists in feed, so just update it */
			console.log( 'Skip adding the clone of article #', article.id, ' to the wall' );
			_.extend( registry[ article.id ], getWallItemData() );
			return true;
		}
		var
			wallItem;
		wallItem = new WallItem( getWallItemData() );

		items.all[ isAppend ? 'push' : 'unshift' ]( wallItem );

		if ( article.id ){
			registry[ article.id ] = wallItem;
		}

		function getWallItemData(){
			var aDay = article.date.day;
			var aMonth = article.date.month-1;
			var aYear = article.date.year;
			var data = {
				id: article.id,
				title: article.title,
				lead: article.lead,
				time: article.date.hour+":"+article.date.min,
				fullDate: aDay + ' ' + (aMonth+1) + ' ' + aYear,
				viewDate: parseViewDate(aYear, aMonth, aDay),
				isUrgent: newsUtils.isArticleUrgent( article )
			}
			if ( article.sids ){
				data.entry = feedsService.filterFeedListByType( article.list )
			}
			return data;
		}
		return true;
	}

    var items = {
        all: [],
        x : [],
        currentFeedId: -999,

        initWallItems: function(){
            items.all = [];
	        registry = {};
            return items.all;
        },

        getItems: function(){
            return items.all;
        },

        getText: function(){
            return items.x;
        },

        addFromCometNewsDataToList: function(myNewsArray, sids){

	        angular.forEach(myNewsArray, function(article){
		        article.sids = sids;
                addWallItem( article );
            });
        },

        addNewsDataToList: function(myNewsArray, feedId){
            angular.forEach(myNewsArray, function(article){
                addWallItem( article, true );
            });

        },

        // First time news items loading
        updateItems: function(){
            var feedId = NEWST.FEED_COMMON_ID;
            resetItems(); // Clear news list
            return $http.get('/api/feed', {params:{limit:NEWST.NEWS_BASE_COUNT}}).then(function(r) {
                // response from DB
                console.log('WallServ: got feed items data');
                var myFeedNewsArray = r.data.article;
                resetItems(); // Clear news list
                //$('.news-top').remove();
                items.addNewsDataToList(myFeedNewsArray, feedId);
                items.currentFeedId = feedId;
            },function(e){
                if (e.status == 404){
                    console.log('unauthorizated!');
                    // need to login
                }
            });
        },

        loadMoreNews: function(){
            return $http.get('/api/feed', {params:{limit: NEWST.NEWS_SCROLL_COUNT, offset:items.getItemsCount()}}).then(function(r) {
                // response from DB
                console.log('WallServ: got more feed items data');
                var myFeedNewsArray = r.data.article;
                items.addNewsDataToList(myFeedNewsArray, items.currentFeedId);
                console.log('WallServ: updated more feed item data');
            },function(e){
                if (e.status == 404){
                    console.log('unauthorizated!');
                    // need to login
                }
            });
        },

        getFavoritesUpdateFromServer: function(id) {
            return $http.get('/api/news/'+id).then(function(r) {
                console.log('wallServ: got article data');
                var response = r.data;
                var parsedObjList = parseObjectsList(response.list);
                items.x[0].objectsList = parsedObjList;
            },function(e){
                if (e.status == 404){
                    console.log('unauthorizated!');
                    // need to login
                }
            });
        },

        getItemsCount: function(){
            return items.all.length;
        },

        selectItem: function(id){
            console.log('wallServ: try to select news='+id);
            _.each(items.all, function(obj){
                    obj.isSelected = false;
                    if (obj.id == id){
                        obj.isSelected = true;
                        console.log('wallServ: news selected='+id);
                    }
            });
        },

        loadText: function(id){
	        currentPopupNewsId = id;
            return $http.get('/api/news/'+id).then(function(r) {
                console.log('wallServ: got article data');
	            if ( id != currentPopupNewsId ){
		            /*
		             * It seems like another request was started while we reaching the server
		             * So this one is not relevant now, skip it
		             */
		            return;
	            }
                var
	                response = r.data;

                items.x.length=0;
	            var mediaList = newsUtils.parseMediaList(response.media);
                items.x.unshift(new WallTextItem({
                    id: id,
                    title: response.title,
	                keywords: response.keywords,
                    time: response.date.hour+":"+response.date.min,
                    viewDate: parseViewDate(response.date.year, parseInt(response.date.month)-1, response.date.day, true),
                    objectsList: parseObjectsList(response.list),
	                feeds : feedsService.filterFeedListByType( response.list ),
                    body: response.body,
                    mediaList: mediaList,
	                hasMedia: mediaList && mediaList.list && mediaList.list.length
                }));

            },function(e){
                if (e.status == 404){
                    console.log('unauthorizated!');
                    // need to login
                }
            });
        }

    };

    return items;

}]);
angular.module( 'plugin.panel' )
	.service( 'feedService', [
		'$q',
		'$log',
		'$timeout',
		'apiService',
		'dispatchService',
		'utilsService',
		'panelSectionsService',
		function( $q, $log, $timeout, apiService, dispatchService, utilsService, panelSectionsService ){
			var
				feeds = {},
				feedsClasses = {},
				feedService = {},
				timers = utilsService.timersManager();

			function Feed( feedId ){
				this.feedId = feedId;
				this.feedName = _.str.camelize( 'feed-' + feedId );
				this.flags = {
					loading : false
				};
				this.defers = {};
				this.items = [];
				this.maxViewed = 0;
				this.newItemsNum = 0;
				this.init();
				this.updateNewItemsNum();
				this.updateListeners = [];
				$log.log( 'feed', feedId, 'created' );
			}

			Feed.prototype = {
				init : function(){
					var self = this;
					dispatchService
						.listen( this.feedName + '::update', function( res ){
							self.applyUpdates( res );
						} )
						.listen( this.feedName + '::updateViewed', function( res ){
							self.applyUpdates( res );
						} );
				},
				load : function(){
					if( this.destroyed ){
						return;
					}
					var self = this;
					this.defers.loading = $q.defer();
					this.flags.loading = true;
					apiService.request( 'feed::load', { feedId : this.feedId } )
						.then( function( res ){
							if( this.destroyed ){
								return;
							}
							self.applyUpdates( res );
							self.defers.loading.resolve();
						}, function(){
							self.defers.loading.reject();
						} )
						.finally( function(){
							self.flags.loading = false;
						} );
					return this.defers.loading.promise;
				},

				updateNewItemsNum : function(){
					if( this.destroyed ){
						return;
					}
					var self = this;
					return apiService.request( 'feed::getNewItemsNum', { feedId : this.feedId } )
						.then( function( res ){
							if( ! isNaN( + res.newItemsNum ) ){
								self.newItemsNum = + res.newItemsNum;
							}
							return self.newItemsNum;
						} );
				},

				markViewed : function(){
					if( this.destroyed ){
						return;
					}
					var self = this;
					$q.when( this.defers.loading || true ).finally( function(){
						if( self.items[0] && self.items[0].date && ( self.maxViewed != self.items[0].date ) ){
							self.maxViewed = self.items[0].date;
							apiService.request( 'feed::setMaxViewed', {
								feedId    : self.feedId,
								maxViewed : self.maxViewed
							} );
						}
					} );
				},

				markViewedDelayed : function(){
					var self = this;
					timers.setTimer( 'markViewed', function (){
						self.markViewed();
					}, 2000 );
				},

				markAllViewed : function(){
					if( this.destroyed ){
						return;
					}
					var self = this;
					$q.when( this.defers.loading || true ).finally( function(){
						apiService.request( 'feed::markAllViewed', {
							feedId : self.feedId
						} );
					} );
				},

				markAllViewedDelayed : function(){
					var self = this;
					timers.setTimer( 'markAllViewed', function (){
						self.markAllViewed();
					}, 2000 );
				},


				applyUpdates : function( upd ){
					if( this.destroyed ){
						return;
					}
					if( ! upd ){
						return;
					}
					if( upd.items ){
						utilsService.updateArray( this.items, upd.items );
					}
					if( ! isNaN( + upd.newItemsNum ) ){
						this.newItemsNum = + upd.newItemsNum;
					}
					if( ! isNaN( + upd.maxViewed ) ){
						this.maxViewed = + upd.maxViewed;
					}
					angular.forEach( this.updateListeners, function( listener ){
						listener();
					} );
				},

				onUpdate : function( listener ){
					this.updateListeners.push( listener );
				},

				destroy : function(){
					if( this.destroyed ){
						return;
					}
					var self = this;
					this.destroyed = true;
					_.map( this.defers, function( defer, id ){
						defer.reject();
						delete self.defers[id];
					} );

					dispatchService
						.unListen( this.feedName + '::update' )
						.unListen( this.feedName + '::updateViewed' );
					$log.log( 'feed destroyed', this.feedId );
				}
			};

			feedsClasses[ 'partner' ] = utilsService.inheritFunction( function(){
				Feed.apply( this, arguments );
			}, Feed, {} );

			feedService.getFeed = function( feedId ){
				if( ! feeds[feedId] ){
					feeds[feedId] = feedsClasses[feedId]
						? new feedsClasses[ feedId ]( feedId )
						: new Feed( feedId );
				}

				return feeds[feedId];
			};

			panelSectionsService.on( 'sectionDisable', function( event, data ){
				if( data.sectionId && feeds[ data.sectionId ] ){
					feeds[ data.sectionId ].destroy();
					delete feeds[ data.sectionId ];
				}
			} );


			return feedService;
		}] );
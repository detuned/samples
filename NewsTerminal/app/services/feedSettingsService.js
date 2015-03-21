/*------------- Feed Settings SERVICE ----------------*/
services.factory( 'feedSettingsService', ['$http', 'newsService', function( $http, newsService ){
	function FeedSettingItem( data ){
		this.id = data.id;
		this.title = data.title;
		this.body = data.body;
		this.time = data.time;
		this.viewDate = data.viewDate;
		this.objectsList = data.objectsList;
	}

	var
		isAllChecked = false,
		totalItemsNum = 0;

	var item = {

		x : [],

		init : function(){
			return item.x;
		},

		isAllChecked : function(){
			return isAllChecked;
		},

		getTotalItemsNumber : function(){
			return totalItemsNum;
		},

		getAllFeedsFromServer : function(){
			return $http.get( '/api/groups-all' ).then( function( r ){
				console.log( 'feed sett Serv: got groups data' );
				var
					response = r.data,
					_isAllChecked = true;

				totalItemsNum = 0;
				item.x.length = 0;

				var groupName = function( group ){
					type = group.type;
					if( type == 'feed' ){
						return GLOBAL.l10n( 'Общая лента' )
					} else if( type == 'user-feed' ){
						return GLOBAL.l10n( 'МОИ ЛЕНТЫ' );
					} else if( type == 'favorite' ){
						return GLOBAL.l10n( 'ПОДБОРКИ' );
					} else if( type == 'terminal_group' ){
						return GLOBAL.l10n( group.title );
					}
				};

				/* Shift groups if we have empty places */
				var positions = ['feed_block_11', 'feed_block_12', 'feed_block_21', 'feed_block_22'];
				var shiftTo = 0;

				_.each( response, function( group ){
					if( group.type != 'terminal_group' ) return;
					if( group.parentSid != positions[ shiftTo ] ){
						group.parentSid = positions[ shiftTo ];
					} else {
						shiftTo ++;
					}
				} );

				_.each( response, function( group ){
					if( group.type == 'feed' ){
						_.each( group.list, function( d ){
							if( d.type == 'terminal_group' && d['id-parent'] ){
								d.list = [];
								_.each( group.list, function( l ){
									if( l.type == 'terminal_group' && l.id == d['id-parent'] ){
										d.parentSid = l.sid;
									}
									if( l.type == 'hier_rubric' && l['id-parent'] == d.id ){
										d.list.push( l );
									}
									if( l.type == 'hier_rubric' && ! l['id-parent'] && l.sid == 'feed_block_11' ){
										d.list.push( l );
									}
								} );
								response.push( d );
							}
						} );
					}
				} );


				_.each( response, function( group ){
					var
						type = group.type,
						isGroupEnabled = type == 'terminal_group';

					var list = [];


					_.each( group.list, function( d ){

						var isChecked = d.visible && true || false;
						list.push( {
							sid     : d.sid,
							title   : d.title,
							checked : isChecked
						} );
						totalItemsNum ++;
						if( ! isChecked && isGroupEnabled ){
							_isAllChecked = false;
						}
					} );

					item.x.push( {type : type, name : groupName( group ), list : list, enabled : isGroupEnabled, parentSid : group.parentSid } );

				} );

				/*
				 * It's better to set new value to isAllChecked one time, not in every cycle iteration
				 * Cause controller watching for it changes and every time firing view update
				 */
				isAllChecked = _isAllChecked;
			}, function( e ){
				if( e.status == 404 ){
					console.log( 'unauthorizated!' );
					// need to login
				}
			} );
		},

		checkAll : function( check ){
			angular.forEach( item.x, function( group ){
				if( group && group.list && group.enabled ){
					angular.forEach( group.list, function( el ){
						el.checked = check;
					} )
				}
			} )
			isAllChecked = check;
		},

		sendToServerFeedSettings : function(){
			var
				needFeedShowList = [],
				_isAllChecked = true,
				toMove = [];

			/* Copy items from terminal_group to feed group */
			_.each( item.x, function( group ){
				if( group.type == 'terminal_group' ){
					toMove = toMove.concat( group.list );
				}
			} );

			_.each( item.x, function( group ){
				if( group.type == 'terminal_group' ) return;
				if( group.type == 'feed' ){
					group.list = toMove;
				}
				var list = [];
				_.each( group.list, function( e ){
					if( e.checked || group.type != 'feed' ){
						list.push( e.sid );
					}
					else {
						if( group.type == 'feed' ) _isAllChecked = false;
					}
				} );

				if( list.length > 0 ){
					needFeedShowList.push( {type : group.type, list : list} );
				}
			} );

			/*
			 * It's better to set new value to isAllChecked one time, not in every cycle iteration
			 * Cause controller watching for it changes and every time firing view update
			 */
			isAllChecked = _isAllChecked;

			var prms = {groups : needFeedShowList};

			// send to server
			return $http.post( '/api/groups', prms ).then( function( r ){
				console.log( 'feed sett Serv: set visible feeds' );

			}, function( e ){
				if( e.status == 404 ){
					console.log( 'unauthorizated!' );
					// need to login
				}
			} );
		}
	};

	return item;
}
] );
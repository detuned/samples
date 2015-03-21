angular.module( 'plugin.panel' )
	.service( 'relationsService', [
		'$log',
		'$timeout',
		'$q',
		'apiService',
		'dispatchService',
		'utilsService',
		'userService',
		function( $log, $timeout, $q, apiService, dispatchService, utilsService, userService ){
			var
				rels = {},
				relGroups = {},
				isLoaded = false,
				relationsService = {
					STATES : {
						NONE       : 0,
						INVITED    : 1,
						INVITED_BY : 2,
						FRIEND     : 5,
						BANNED     : 9
					}
				},
				relTitles = {},
				onlineUsers = {};

			relTitles[ relationsService.STATES.NONE ] = '';
			relTitles[ relationsService.STATES.INVITED ] = utilsService.l10n( 'relations_status_invited' );
			relTitles[ relationsService.STATES.INVITED_BY ] = utilsService.l10n( 'relations_status_invited_by' );
			relTitles[ relationsService.STATES.FRIEND ] = utilsService.l10n( 'relations_status_friend' );
			relTitles[ relationsService.STATES.BANNED ] = utilsService.l10n( 'relations_status_banned' );

			angular.forEach( relationsService.STATES, function( stateId ){
				relGroups[stateId] = [];
			} );


			relationsService.getList = function( state ){
				return relGroups[state];
			};

			relationsService.search = function( options ){
				if( ! options || ! options.query || options.query.length < 2 ){
					return utilsService.getRejectedPromise();
				}
				var defer = $q.defer();
				apiService.request( 'userRel::find', options ).then( function( res ){
					if( res && res.rels ){
						defer.resolve( res.rels ); //FIXME
					}
					else {
						defer.reject( res );
					}
				}, defer.reject );
				return defer.promise;
			};

			relationsService.searchById = function( options ){
				if( ! options || ! options.id ){
					return utilsService.getRejectedPromise();
				}
				var defer = $q.defer();
				apiService.request( 'userRel::findById', options ).then( function( res ){
					if( res && res.rels ){
						defer.resolve( res.rels );
					}
					else {
						defer.reject( res );
					}
				}, defer.reject );
				return defer.promise;
			};

			relationsService.getSearchEngine = SearchEngine;


			relationsService.getRelState = function( uid ){
				return rels[uid]
					? + rels[uid].state
					: 0;
			};

			relationsService.getRelTitle = function( uid ){
				return relTitles[ relationsService.getRelState( uid ) ];
			};

			relationsService.getUserName = function( uid ){
				return rels[ uid ] && rels[ uid ].hisName
					? rels[ uid ].hisName
					: '';
			};

			relationsService.changeState = function( data, newState ){
				if( angular.isArray( data ) ){
					return $q.all( _.map( data, function( item ){
						return changeUserState( item, newState );
					} ) );
				}
				else {
					return changeUserState( data, newState );
				}
			};

			relationsService.renameRel = function( relId, hisName ){
				return apiService.request( 'userRel::rename', { relId : relId, hisName : hisName } );
			};

			relationsService.isUserOnline = function( userId ){
				return onlineUsers[userId];
			};

			relationsService.isGrantedToSetRelations = function(){
				return userService.info && userService.info.name;
			};

			dispatchService
				.listen( 'userRel::reset', function( res ){
					isLoaded = true;
					updateRelations( res );
				} )
				.listen( 'userRel::update', function( res ){
					//TODO some notifying or so
					//No need to actualize list, it should be done via ::reset
				} )
				.listen( 'userRel::relsOnline', function( res ){
					utilsService.updateObject( onlineUsers, res.users );
				} )
				.listen( 'userRel::relOnline', function( res ){
					onlineUsers[ res.user ] = true;
				} )
				.listen( 'userRel::relOffline', function( res ){
					delete onlineUsers[ res.user ];
				} );


			$timeout( function(){
				if( ! isLoaded ){
					loadRelations();
				}
				loadOnlineUsers();
			}, 200 );

			function SearchEngine(){
				var
					list = [],
					idList = [],
					instance = {
						list         : list,
						idList       : idList,
						query        : '',
						search       : search,
						isSearching  : false,
						isSearched   : false,
						isIdSearch   : false,
						clearResults : clear
					};

				function search(){
					instance.isIdSearch = ! isNaN( + instance.query );
					instance.isSearching = true;
					return $q.all(
							relationsService.search( { query : instance.query } ).then( function( res ){
								utilsService.updateArray( instance.list, res );
							} ),
							instance.isIdSearch
								? relationsService.searchById( { id : instance.query } ).then( function( res ){
								utilsService.updateArray( instance.idList, res );
							}, function (){
								utilsService.clearArray( instance.idList );

							} )
								: true
						)
						.finally( function(){
							if ( instance.isIdSearch && instance.idList[0] ){
								_.find( instance.list, function( item, index ){
									//Avoid duplicates id in idSearch and regular one
									if ( item.uid === instance.idList[0].uid ){
										instance.list.splice( index, 1 );
										return true;
									}
								} );
							}

							instance.isSearched = true;
							instance.isSearching = false;
						} );
				}

				function clear(){
					if( list.length ){
						utilsService.clearArray( list );
					}
					utilsService.clearArray( idList );
				}

				return instance;
			}

			function updateRelations( data ){
				$log.log( 'update relations with', data.relGroups );
				if( data.relGroups ){
					angular.forEach( relGroups, function( group, stateId ){
						if( data.relGroups && data.relGroups[ stateId ] ){
							utilsService.updateArray( relGroups[stateId], data.relGroups[stateId] );
						}
						else {
							utilsService.clearArray( relGroups[stateId] );
						}
					} );
				}
				if( data.rels ){
					utilsService.updateObject( rels, data.rels );
				}
			}

			function loadRelations(){
				$log.log( 'relationsService: loading relations' );
				return apiService.request( 'userRel::list' ).then( function( res ){
					isLoaded = true;
					updateRelations( res );
				} );
			}

			function loadOnlineUsers(){
				$log.log( 'relationsService: loading online users' );
				return apiService.request( 'userRel::getOnlineUsers' ).then( function( res ){
					if( res.users ){
						$log.log( 'relationsService: loaded online users', res.users );
						utilsService.updateObject( onlineUsers, res.users );
					}
					else {
						$log.warn( 'relationsService: unexpected response from userRel::getOnlineUsers', res.users );
					}
				} );
			}


			function changeUserState( options, newState ){
				if( ! options ){
					return utilsService.getRejectedPromise();
				}
				if( ! angular.isObject( options ) ){
					options = {
						relId : options
					};
				}
				options.newState = newState;
				if( ! options.myName && userService.info.name ){
					options.myName = userService.info.name;
				}
				return apiService.request( 'userRel::changeState', options );
			}

			return relationsService;
		}] );
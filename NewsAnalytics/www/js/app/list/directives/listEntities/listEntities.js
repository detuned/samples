angular.module( 'index' )
	.directive( 'listEntities', [
		'$timeout',
		'$compile',
		'$document',
		'$log',
		'$rootScope',
		'configService',
		'listService',
		'utilsService',
		'socialService',
		function( $timeout, $compile, $document, $log, $rootScope, configService, listService, utilsService, socialService ){
			return {
				require     : '?^smartList',
				templateUrl : configService._getUrl( '//APP/list/directives/listEntities/listEntities.html' ),
				replace     : true,
				scope       : {
					'theme'           : '=',
					'source'          : '=',
					'apiTransport'    : '@',
					'period'          : '@',
					'periodRangeFrom' : '@',
					'periodRangeTo'   : '@',
					'title'           : '@',
					'domain'          : '@',
					'limitOptions'    : '@',
					'previewUrl'      : '@',
					'limit'           : '=',
					'page'            : '=',
					'setOnlySource'   : '='
				},
				link        : function( scope, element, attrs, smartList ){
					var
						destructors = utilsService.elementDestructor( element ),
						listElement = element.find( '[role=list]' ),
						timers = utilsService.timersManager(),
						entitiesNum = 0,
						originalDataForFilter = {},
						listEngine, filterList;
					scope.data = {};

					scope.list = {};

					scope.state = {
						loading : false,
						updated : false
					};

					scope.entityHeight = 60;
					scope.containerHeight = 0;
					scope.totalPages = 0;
					scope.indexOffset = 0;
					scope.hoveredEntityId = null;

					scope.onPageChange = function( newPage ){};
					scope.onLimitChange = function( newLimit ){};

					scope.onEntityHover = function( entity ){
						scope.hoveredEntityId = getEntityId( entity );
					};

					scope.onHoverOff = function(){
						scope.hoveredEntityId = null;
					};

					scope.isEntityMatch = function( entity ){
						if( ! scope.query ){
							return true;
						}
						var pattern = new RegExp( scope.query, 'i' );
						return ! ! ( entity.title.match( pattern ) || ( entity.normalizedHost && entity.normalizedHost.match( pattern ) ) );
					};

					scope.isPaused = function(){
						return listService.isPaused();
					};

					scope.getDiffCategory = function( entity ){
						if( entity.indexDiff > 0 ){
							return 3;
						}
						else if( entity.indexDiff < 0 ){
							return 2;
						}
						else {
							return 1;
						}
					};

					scope.getDiffFactor = function ( entity ){
						if ( ! isNaN( entity.diffFactor ) ){
							return entity.diffFactor;
						}
						return entity.diffFactor = scope.data.maxIndexDiff && entity.indexDiff
							? ( entity.indexDiff / scope.data.maxIndexDiff ) * 100
							: 0;
					};

					listEngine = listService.getListEngine(
						_.pick( scope, 'theme', 'source', 'period', 'periodRangeFrom', 'periodRangeTo', 'limit', 'page', 'title', 'domain' ),
						{
							onUpdate     : onUpdate,
							apiTransport : scope.apiTransport
						}
					);

					function onUpdate( newData ){
						var
							updatedEntities = {},
							invalidNum = 0,
							maxIndexDiff = 0,
							newList = newData.list || [],
							maxWeight = newList[0] && newList[0].weight
								? + newList[0].weight
								: 0,
							isNew = ! scope.data.entitiesNum,
							badges = [],
							enabledBadgesBySource = {},
							enabledBadgesNum = 0;
						angular.forEach( newList, function( entity, index ){
							index = index - invalidNum;
							var id = getEntityId( entity );
							if( updatedEntities[id] ){
								$log.warn( 'Entity duplicate: id=', id, ', title=', entity.title, ',indexes:[', index + 1, ',', updatedEntities[id].index + 1, ']' );
								invalidNum ++;
								//Avoid duplicates
								return;
							}
							entity.title = _.str.trim( entity.title ); //Sometimes we get titles started from spaces
							if( scope.list[id] ){
								scope.list[id].prev = {
									factor : scope.list[id].factor,
									index  : scope.list[id].index,
									badge  : scope.list[id].badge
								};
								angular.extend( scope.list[id], entity );
							}
							else {
								scope.list[id] = entity;
								entitiesNum ++;
							}
							delete entity.diffFactor;
							updatedEntities[id] = {title : entity.title, index : index};

							if( maxWeight ){
								scope.list[id].factor = utilsService.roundFloat( ( + scope.list[id].weight / maxWeight ) * 100, 2 );
							}

							if( ! scope.list[id].hostSignature && scope.list[id].domain ){
								scope.list[id].normalizedHost = listService.getCompactedHost( scope.list[id] );
								scope.list[id].hostSignature = listService.getHostSignature( scope.list[id] );
								scope.list[id].clickableHost = listService.getClickableHost( scope.list[id] );
							}

							if( scope.previewUrl ){
								if ( ! scope.list[id].href ){
									scope.list[id].href = listService.getPreviewUrl( scope.list[id] );
								}
							}
							else {
								scope.list[id].href = scope.list[id].url;
								scope.list[id].previewUrl = listService.getPreviewUrl( scope.list[id] );
							}

							scope.list[id].index = index;
							scope.list[id].indexDiff = 0;
							if( isNew ){
								if( Math.random() > 0.5 ){
									scope.list[id].indexDiff = Math.random() > 0.5 || index === 0
										? 1
										: - 1;
								}
							}
							else if( scope.list[id].prev ){
								scope.list[id].indexDiff = scope.list[id].prev.index - index;
							}
							if( scope.list[id].indexDiff > maxIndexDiff ){
								maxIndexDiff = scope.list[id].indexDiff;
							}

							if( configService.enableBadges ){
								scope.list[id].badge = listService.getEntityBadge( scope.list[id] );

								if( scope.list[id].badge ){
									if( scope.list[id].prev
										&& scope.list[id].prev.badge
										&& scope.list[id].prev.badge.enable ){

										scope.list[id].badge.enable = true;
										enabledBadgesNum ++;
										enabledBadgesBySource[ scope.list[id].badge.type ] = ( enabledBadgesBySource[ scope.list[id].badge.type ] || 0 ) + 1;
									}
									else {
										badges.push( scope.list[id].badge );
									}
								}
							}

						} );

						if( configService.enableBadges ){
							while( enabledBadgesNum < configService.maxBadgesNum && badges.length ){
								var badge = badges.shift();
								if( ! enabledBadgesBySource[badge.type]
									|| ( enabledBadgesBySource[badge.type] < configService.maxBadgesPerSourceNum ) ){
									badge.enable = true;
									enabledBadgesBySource[badge.type] = ( enabledBadgesBySource[badge.type] || 0 ) + 1;
								}
							}
						}


						newData.maxIndexDiff = maxIndexDiff;

						angular.forEach( scope.list, function( item, key ){
							if( ! updatedEntities[key] ){
								delete scope.list[key];
								entitiesNum --;
							}
						} );

						scope.data = newData;
						scope.data.entitiesNum = entitiesNum;
						setupListView();

						scope.totalPages = Math.ceil( scope.data.total_count / scope.limit );
						scope.page = Math.max( 1, Math.min( scope.totalPages, scope.page ) );
						scope.indexOffset = ( scope.page - 1 ) * scope.limit;

						$log.debug( 'listEntities: updated list. entitiesNum=', scope.data.entitiesNum, ', maxIndexDiff=', scope.data.maxIndexDiff, ', totalPages=', scope.totalPages, ', page=', scope.page )
					}

					function getEntityId( entity ){
						// Ids with leading $ are not handling correctly by Angular
						return 'entity-' + entity.id;
					}

					function setupListView(){
						//Notifying smartList parent that everything is ready
						if( ! scope.isPaused() ){
							scope.state.updated = true;
						}
						$timeout( function(){
							scope.entityHeight = listElement.find( '>:first' ).outerHeight();
							scope.containerHeight = scope.entityHeight
								? scope.entityHeight * scope.data.entitiesNum
								: null;
							if( smartList && smartList.listRendered ){
								smartList.listRendered( scope.data );
							}
							scope.$broadcast( 'listRendered', scope.data );

							if( ! scope.isPaused() ){
								timers.setTimer( 'viewUpdate', function(){
									scope.state.updated = false;
								}, configService.highlightUpdatedDuration );
							}
						} );
					}

					filterList = _.debounce( function(){
						var newData = angular.copy( originalDataForFilter );
						if( angular.isArray( newData.list ) ){
							newData.list = _.filter( newData.list, scope.isEntityMatch );
							onUpdate( newData );
						}
					}, 200 );


					destructors.push(
						listEngine.destroy,
						function(){
							scope.list = null;
						}
					);
				}
			}

		}] );
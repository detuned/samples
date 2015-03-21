angular.module( 'index' )
	.controller( 'AppCtrl', [
		'$rootScope',
		'$scope',
		'$timeout',
		'$log',
		'$locale',
		'$route',
		'$routeParams',
		'$window',
		'sourcesService',
		'themesService',
		'listService',
		'periodsService',
		'utilsService',
		'configService',
		'KEY_CODES',
		'stateService',
		'beatsService',
		function( $rootScope, $scope, $timeout, $log, $locale, $route, $routeParams, $window, sourcesService, themesService, listService, periodsService, utilsService, configService, KEY_CODES, stateService, beatsService ){

			$scope.appData = {
				skin         : configService.skin,
				locale       : $locale.id,
				statCounters : configService.statCounters
			};

			$scope.previewData = {
				url : null
			};


			(function(){
				var
					uri, previewUrl;
				if(
					$window.URI
						&& ( uri = $window.URI() )
						&& ( uri.segmentCoded( 0 ) === 'url' )
						&& ( previewUrl = uri.segmentCoded( 1 ) )
					){
					$scope.previewData.url = previewUrl;
				}
			})();

			if( ! configService.enableNavigation ){
				stateService.disable();
			}

			//Period
			(function(){

				$scope.periodData = {
					isRangeView : false,
					minDateStr  : configService.systemBirth,
					minDate     : moment( configService.systemBirth ),
					dateFormat  : configService.dateFormat
				};
				$scope.periodRange = getDefaultRange();

				$scope.periods = periodsService.getAllPeriods();
				$scope.period = $scope.periods[0];
				$scope.setPeriod = function( periodId ){
					var period = periodsService.getPeriod( periodId );
					if( $scope.isPeriodActive( period ) ){
						return;
					}
					if( period.value && period.value.range ){
						//Actualy it was not a period, it was a range selected
						$scope.periodRange.from = period.value.range.from.clone();
						$scope.periodRange.to = period.value.range.to.clone();
						$scope.togglePeriodRangeView( true );
					}
					else {
						$scope.period = period;
						$scope.togglePeriodRangeView( false );
					}
				}
				$scope.isPeriodActive = function( p ){
					if( ! p ){
						return false;
					}
					if( p.value && p.value.range ){
						if( $scope.periodData.isRangeView ){
							return p.value.range.from.isSame( $scope.periodRange.from, 'minute' )
								&& p.value.range.to.isSame( $scope.periodRange.to, 'minute' );
						}
						else {
							return false;
						}
					}
					return (p.id == $scope.period.id) && ! $scope.periodData.isRangeView
				}
				$scope.togglePeriodRangeView = function( state ){
					var newState = arguments.length
						? ! ! state
						: ! $scope.periodData.isRangeView;
					if( newState != $scope.periodData.isRangeView ){
						$scope.periodData.isRangeView = newState;
					}
					actualizePeriod();
				}
				function actualizePeriod(){
					var from;
					if( ! $scope.periodData.isRangeView ){
						return;
					}
					if( ! $scope.periodRange || ! $scope.periodRange.from || ! $scope.periodRange.to ){
						$log.log( 'period: set default range' );
						$scope.periodRange = getDefaultRange();
					}
					else if( $scope.periodRange.from.isAfter( $scope.periodRange.to ) ){
						$log.log( 'period: incorrect dates order, swap range sides' );
						from = $scope.periodRange.from;
						$scope.periodRange.from = $scope.periodRange.to;
						$scope.periodRange.to = from;
					}
				}

				function getDefaultRange(){
					var
						to = moment().startOf( 'day' ),
						from = to.clone().add( 'months', - 1 );
					if( from.isBefore( $scope.periodData.minDate ) ){
						from = $scope.periodData.minDate;
					}
					return {
						to   : to,
						from : from
					}
				}

				$scope.onDateChange = actualizePeriod;

				actualizePeriod();


				stateService.param( 'period', {
					setDefault : function(){
						$scope.period = $scope.periods[0];
					},
					isDefault  : function( v ){
						var period = periodsService.getPeriod( v );
						return period && period.id === $scope.periods[0].id;
					},
					isValid    : function( v ){
						return periodsService.getPeriod( v ) || periodsService.parseRangeStr( v );
					},
					update     : function( v ){
						var
							period,
							range;
						if( period = periodsService.getPeriod( v ) ){
							$scope.periodData.isRangeView = false;
							$scope.setPeriod( v );
						} else if( range = periodsService.parseRangeStr( v ) ){
							$scope.periodData.isRangeView = true;
							$scope.periodRange.from = range.from;
							$scope.periodRange.to = range.to;
						}
					},
					listen     : function( fn ){
						return $scope.$watch( function(){
							return $scope.periodData.isRangeView
								? periodsService.composeRangeStr( $scope.periodRange )
								: $scope.period.alias;
						}, fn );
					}
				} );

			})();


			// Sources
			$scope.sources = sourcesService.getAllSources( true );
			$scope.source = {};
			$scope.sourceAllId = sourcesService.SOURCE_ALL_ID;
			$scope.source[ sourcesService.SOURCE_ALL_ID ] = true;
			$scope.getSourcesNum = function(){
				return $scope.source[ sourcesService.SOURCE_ALL_ID ]
					? 0
					: _.keys( $scope.source ).length;
			};
			$scope.setSource = function( sourceId ){
				if( sourceId == sourcesService.SOURCE_ALL_ID ){
					//It's only possible to switch ON the 'All' button
					$scope.source = {};
				}
				else if( sourcesService.SOURCE_ALL_ID in $scope.source ){
					//If any regular source has chosen, the 'All' button need to be switched off
					delete $scope.source[ sourcesService.SOURCE_ALL_ID ];
				}

				if( $scope.source[ sourceId ] ){
					//If chosen source is on now, we're switching it off
					delete $scope.source[ sourceId ];
				}
				else {
					//If chosen source is off, we're switching it on
					$scope.source[sourceId] = true;
				}

				if( ! _.keys( $scope.source ).length ){

					//If none of sources are selected, it means 'All' is selected
					$scope.source[ sourcesService.SOURCE_ALL_ID ] = true;
				}
			};

			$scope.setOnlySource = function( sourceId ){
				$scope.source = {};
				$scope.source[ sourceId ] = true;
			};

			stateService.param( 'sources', {
				setDefault : function(){
					$scope.source = {};
					$scope.source[ sourcesService.SOURCE_ALL_ID] = true;
				},
				isDefault  : function( v ){
					return v == sourcesService.SOURCE_ALL_ID
				},
				isValid    : function( v ){
					return ! ! sourcesService.parseSourcesListStr( v );
				},
				update     : function( v ){
					var
						ids = _.pluck( sourcesService.parseSourcesListStr( v ), 'id' ),
						res = {};
					angular.forEach( ids, function( id ){
						res[id] = true;
					} );
					$scope.source = res;
				},
				listen     : function( fn ){
					return $scope.$watch( function(){
						return sourcesService.composeSourcesListStr( $scope.source );
					}, fn );
				}
			} );


			//Themes
			$scope.themes = themesService.getAllThemes( true );
			$scope.theme = {};
			$scope.themeAllId = themesService.THEME_ALL_ID;
			$scope.theme[ themesService.THEME_ALL_ID  ] = true;
			$scope.getThemesNum = function(){
				return $scope.theme[ themesService.THEME_ALL_ID  ]
					? 0
					: _.keys( $scope.theme ).length;
			};
			$scope.setTheme = function( themeId ){

				if( themeId == themesService.THEME_ALL_ID ){
					//It's only possible to switch ON the 'All' button
					$scope.theme = {};
				}
				else if( themesService.THEME_ALL_ID in $scope.theme ){
					//If any regular theme has chosen, the 'All' button need to be switched off
					delete $scope.theme[ themesService.THEME_ALL_ID ];
				}

				if( $scope.theme[ themeId ] ){
					//If chosen theme is on now, we're switching it off
					delete $scope.theme[ themeId ];
				}
				else {
					//If chosen theme is off, we're switching it on
					$scope.theme[themeId] = true;
				}

				if( ! _.keys( $scope.theme ).length ){

					//If none of themes are selected, it means 'All' is selected
					$scope.theme[ themesService.THEME_ALL_ID ] = true;
				}
			};

			stateService.param( 'categories', {
				setDefault : function(){
					$scope.theme = {};
					$scope.theme[ configService.themeDefault ] = true;
				},
				isDefault  : function( v ){
					return v == configService.themeDefault
				},
				isValid    : function( v ){
					return ! ! themesService.parseThemesListStr( v );
				},
				update     : function( v ){
					var
						ids = _.pluck( themesService.parseThemesListStr( v ), 'id' ),
						res = {};
					angular.forEach( ids, function( id ){
						res[id] = true;
					} );
					$scope.theme = res;
				},
				listen     : function( fn ){
					return $scope.$watch( function(){
						return themesService.composeThemesListStr( $scope.theme );
					}, fn );
				}
			} );


			//Search
			$scope.searchData = {
				query    : '',
				tmpQuery : '',
				domain   : '',
				title    : '',
				isActive : false,
				example  : '' //TODO get from any collection
			};

			$scope.search = function( query ){
				var normalizedQuery = utilsService.isLikeUrl( query )
					? utilsService.normalizeUrl( query )
					: query;
				$scope.searchData.query = $scope.searchData.tmpQuery = normalizedQuery;
			};

			$scope.cancelSearch = function( $event ){
				$scope.searchData.isActive = false;
				$scope.searchData.tmpQuery = null;
				$scope.searchData.query = null;
				$event.preventDefault();
			};

			$scope.onSearchType = function( $event ){
				if( $event.which === KEY_CODES.BACKSPACE ){
					$scope.searchData.query = '';
				}
			};

			stateService.param( 'query', {
				setDefault : function(){
					$scope.searchData.query = $scope.searchData.tmpQuery = '';
				},
				isDefault  : function( v ){
					return ! v;
				},
				update     : function( v ){
					$scope.searchData.query = $scope.searchData.tmpQuery = v;
				},
				listen     : function( fn ){
					return $scope.$watch( 'searchData.query', fn );
				}
			} );

			//List pause
			$scope.isPaused = listService.isPaused;
			$scope.isFrozen = listService.isFrozen;
			$scope.togglePause = listService.togglePause;
			$scope.getTimeToUpdate = listService.getTimeToUpdate;

			$scope.Math = Math;

			//Limit
			$scope.listData = {
				page          : 1,
				limit         : configService.limitDefault,
				limitOptions  : configService.limitOptions,
				enableSharing : configService.enableSharing
			};

			beatsService.onBeatsUpdate( function( event, data ){
				var
					values = data.beats,
					first = _.first( values ),
					last = _.last( values );
				$scope.beatsStat = {
					value : _.reduce( values, function( memo, num ){ return memo + num; }, 0 ),
					diff  : last - first
				};
			} );

			stateService
				.param( 'limit', {
					setDefault : function(){
						$scope.listData.limit = configService.limitDefault;
					},
					isDefault  : function( v ){
						return + v == + configService.limitDefault;
					},
					isValid    : function( v ){
						return _.indexOf( $scope.listData.limitOptions.split( ',' ), v ) > - 1;
					},
					update     : function( v ){
						$scope.listData.limit = v;
					},
					listen     : function( fn ){
						return $scope.$watch( 'listData.limit', fn );
					}
				} )
				.param( 'page', {
					setDefault : function(){
						$scope.listData.page = 1;
					},
					isDefault  : function( v ){
						return + v == 1;
					},
					isValid    : function( v ){
						return ! isNaN( + v ) && + v >= 0;
					},
					update     : function( v ){
						$scope.listData.page = v;
					},
					listen     : function( fn ){
						return $scope.$watch( 'listData.page', fn );
					}
				} )
			;


			$scope.getTotalView = function(){
				return $scope.listData.total
					? utilsService.numberFormat( $scope.listData.total ) + ' news total'
					: '';
			};


			$timeout( function(){
				stateService.activate().then( $rootScope.appReady );
				$scope.$broadcast( 'contentUpdated' );
			} );

		}] );
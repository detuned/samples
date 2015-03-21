angular.module( 'index' )
	.directive( 'smartList', [
		'$rootScope',
		'$window',
		'$log',
		'$timeout',
		'configService',
		'listService',
		'utilsService',
		function( $rootScope, $window, $log, $timeout, configService, listService, utilsService ){
			var windowElement = angular.element( $window );
			return {
				templateUrl : configService._getUrl( '//APP/list/directives/smartList/smartList.html' ),
				replace     : true,
				scope       : true,
				controller  : [ '$scope', '$element', '$compile', function( $scope, $element, $compile ){
					var
						minHeight = 200,
						updateNum = 0,
						destructors = utilsService.elementDestructor( $element ),
						bodyElement = $element.find( '[role=smart-list-body]' ),
						update = function(){
							if( updateNum ){
								setPageWatching( false );
								//XXX it prevents tries to start from page more than first
								$scope.listData.page = 1;
							}
							buildList();
							setPageWatching( true );
							setLimitWatching( true );
							updateNum ++;
						},
						buildList = _.debounce( _buildList, 150 ),
						pageWatcher, limitWatcher, currentSnapshot;

					$scope.state = {
						loading : false,
						empty   : false
					};

					function _buildList(){
						$scope.state.loading = true;
						$scope.listData.total = 0;
						$scope.listData.query = $scope.searchData.query;
						$rootScope.$broadcast( 'contentUpdated' );
						actualizeLayout();
						$compile( bodyElement.html(
							'<div ' +
								'data-list-entities ' +
								'data-theme="theme" ' +
								'data-source="source" ' + (
								$scope.periodData.isRangeView
									? 'data-period-range-from="' + $scope.periodRange.from.unix() + '" ' +
									'data-period-range-to="' + $scope.periodRange.to.unix() + '" '
									: 'data-period="' + $scope.period.id + '" '
								) + (
								utilsService.isLikeUrl( $scope.searchData.query )
									? ( 'data-domain="' + $scope.searchData.query + '" ' )
									: ('data-title="' + $scope.searchData.query + '" ' +
									'data-domain="' + $scope.searchData.domain + '" ' )
								) + (
								$scope.appData.apiTransport
									? ('data-api-transport="' + $scope.appData.apiTransport + '" ')
									: ''
								) + (
								$scope.listData.previewUrl
									? ('data-preview-url="1" ')
									: ''
								) +
								'data-limit="listData.limit" ' +
								'data-limit-options="{{listData.limitOptions}}" ' +
								'data-page="listData.page" ' +
								'data-set-only-source="setOnlySource" ' +
								'/>'
						).contents() )( $scope );
						actualizeScroll();
					}

					function getSnapshot(){
						return [
							_.keys( $scope.theme ).join( ',' ),
							_.keys( $scope.source ).join( ',' ),
							$scope.periodData.isRangeView
								? [ $scope.periodRange.from.unix(), $scope.periodRange.to.unix() ].join( '-' )
								: $scope.period.id,
							$scope.searchData.query,
							$scope.searchData.domain
						].join( '.' );
					}

					function actualizeLayout(){
						var contentHeight = bodyElement.height();
						$element.css( 'minHeight',
							$scope.state.empty
								? 0
								: Math.max( contentHeight, minHeight )
						);
					}

					function actualizeScroll(){
						var
							offset, scrollTop;
						$timeout( function(){
							offset = $element.offset();
							scrollTop = windowElement.scrollTop();
							if( offset && scrollTop && scrollTop > offset.top - 50 ){
								utilsService.scrollWindow( offset.top - 50 );
							}
						} );
					}

					$rootScope.whenAppReady().then( _.once( function(){
						destructors.push(
							$scope.$watch( getSnapshot, function( v ){
								if( currentSnapshot === v ){
									//Actually nothing has changed
									return;
								}
								currentSnapshot = v;
								update();
							} )
						);
					} ) );


					function setPageWatching( state ){
						if( pageWatcher ){
							pageWatcher();
							pageWatcher = null;
						}
						if( state !== false ){
							pageWatcher = $scope.$watch( 'listData.page', function( v, prev ){
								if( + v != + prev ){
									buildList();
									$log.debug( 'smartList: new page selected:', v );
								}
							} );
						}
					}

					function setLimitWatching( state ){
						if( limitWatcher ){
							limitWatcher();
							limitWatcher = null;
						}
						if( state !== false ){
							limitWatcher = $scope.$watch( 'listData.limit', function( v, prev ){
								if( + v != + prev ){
									$log.debug( 'smartList: new limit selected:', v );
									setPageWatching( false );
									$scope.listData.page = 1;
									buildList();
									setPageWatching( true );
								}
							} );
						}
					}

					this.listRendered = function( data ){
						$scope.listData.total = data.total_count;
						$scope.listData.news_count_total = data.news_count_total;
						$scope.state.loading = false;
						$scope.state.empty = data.entitiesNum === 0;
						actualizeLayout();
					}

				}]
			}

		}] );
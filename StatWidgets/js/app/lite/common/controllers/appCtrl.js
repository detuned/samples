angular.module( 'lite' )
	.controller( 'AppCtrl', [
		'$scope',
		'$rootScope',
		'$timeout',
		'configService',
		'accountService',
		'utilsService',
		'stateService',
		function( $scope, $rootScope, $timeout, configService, accountService, utilsService, stateService ){
			$scope.appData = {
				user          : null,
				counters      : [],
				counter       : null,
				masterSiteUrl : configService.masterSiteUrl

			};

			$scope.logout = function( $event ){
				if( $event ){
					$event.preventDefault();
				}
				accountService.logout();
			};

			function changeAuthStatus( state ){
				$scope.$broadcast( 'userAuthChanged', {
					authorized : state
				} );
			}

			function loadUserData(){
				accountService.getData().then( function( res ){
					applyUserData( res );
					changeAuthStatus( true );
				}, _.partial( changeAuthStatus, false ) );
			}

			function applyUserData( data ){
				$scope.appData.user = data && data.user
					? data.user
					: null;
				$scope.appData.counters = data && data.counters && data.counters.length
					? data.counters
					: [];
				if( configService.extraCounters ){
					$scope.appData.counters = $scope.appData.counters.concat( _.map( utilsService.parseCsvString( configService.extraCounters ),function( item ){
						var
							p = item.split( ':' ),
							id = p.shift(),
							title = p.join( ':' );

						return {
							id    : id,
							title : title
						}
					} ) );
				}
			}

			stateService.param( 'c', {
				setDefault : function(){
					$scope.appData.counter = null;
				},
				isDefault  : function( v ){
					return ! v;
				},
				update     : function( v ){
					$scope.appData.counter = v;
				},
				listen     : function( fn ){
					return $scope.$watch( 'appData.counter', fn );
				}
			} );

			$timeout( function(){
				stateService.activate().then( $rootScope.appReady );
			} );

			$rootScope.$on( 'authSuccess', loadUserData );
			$rootScope.$on( 'logoutSuccess', function(){
				changeAuthStatus( null );
				utilsService.redirect( '/' );
			} );

			loadUserData();
		}] );
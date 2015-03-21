angular.module( 'indexWidget' )
	.controller( 'WidgetCtrl', [ '$rootScope', '$scope', '$locale', '$route', '$routeParams', 'configService', 'periodsService', 'sourcesService', 'themesService', 'listService', 'utilsService', 'stateService', function( $rootScope, $scope, $locale, $route, $routeParams, configService, periodsService, sourcesService, themesService, listService, utilsService, stateService ){

		$scope.appData = {
			skin         : configService.skin,
			design       : '',
			locale       : $locale.id,
			logoUrl      : configService.widgetLogoUrl,
			hideHeader   : false,
			apiTransport : 'polling',
			statCounters : configService.widgetStatCounters
		};

		$scope.widgetData = {
			width : configService.widgetWidthDefault
		};


		//Period
		$scope.periodData = {
			isRangeView : false,
			minDateStr  : configService.systemBirth,
			minDate     : moment( configService.systemBirth ),
			dateFormat  : configService.dateFormat
		};
		$scope.period = periodsService.getAllPeriods()[0];


		//Source
		$scope.sources = sourcesService.getAllSources();
		$scope.source = {};
		$scope.source[ $scope.sources[0].id ] = true;

		//Themes
		$scope.themes = themesService.getAllThemes();
		$scope.theme = {};
		$scope.theme[$scope.themes[0].id] = true;

		//Search
		$scope.searchData = {
			query    : '',
			domain   : '',
			title    : '',
			tmpQuery : '',
			isActive : false
		}

		//List pause
		$scope.isPaused = listService.isPaused;
		$scope.togglePause = listService.togglePause;

		$scope.Math = Math;

		//Limit
		$scope.listData = {
			limitOptions : configService.limitOptions,
			limit        : configService.widgetLimitDefault,
			page         : 1,
			previewUrl   : true
		};


		$scope.$on( '$routeChangeSuccess', function(){

			//Width
			if( $routeParams.width ){
				$scope.widgetData.width = $routeParams.width;
			}

			//No header
			if( $routeParams.no_header ){
				$scope.appData.hideHeader = true;
			}

			//No header
			if( $routeParams.design ){
				$scope.appData.design = $routeParams.design;
			}

			//Limit
			if( $routeParams.limit ){
				$scope.listData.limit = Math.min( configService.widgetLimitMax, $routeParams.limit );
			}
			//Height
			else if( $routeParams.height ){
				$scope.widgetData.height = $routeParams.height;
				$scope.listData.limit = Math.floor( ( $routeParams.height - 88 + ( $routeParams.no_header ? 75 : 0 ) ) / 60 );
			}

			//Direct
			if( $routeParams.direct ){
				$scope.listData.previewUrl = false;
			}

			//Period
			(function(){
				var period;
				if( $routeParams.period && ( period = periodsService.getPeriod( $routeParams.period ) ) ){
					$scope.period = period;
				}
			})();

			//Domain
			if( $routeParams.domain ){
				$scope.searchData.domain = utilsService.normalizeUrl( $routeParams.domain );
			}
			//Title
			if( $routeParams.title ){
				$scope.searchData.query = $routeParams.title;
			}

			//Sources
			(function(){
				if( $routeParams.sources ){
					var sources = {};
					angular.forEach( $routeParams.sources.split( ',' ), function( sourceId ){
						var source = sourcesService.getSource( sourceId );
						if( source ){
							sources[ source.id ] = true;
						}
					} );
					if( _.keys( sources ) ){
						$scope.source = sources;
					}
				}
			})();

			//Themes
			(function(){
				if( $routeParams.categories ){
					var themes = {};
					angular.forEach( $routeParams.categories.split( ',' ), function( themeId ){
						var theme = themesService.getTheme( themeId );
						if( theme ){
							themes[ theme.id ] = true;
						}
					} );
					if( _.keys( themes ) ){
						$scope.theme = themes;
					}
				}
			})();

			if( $routeParams.pause ){
				listService.pause();
			}
			else {
				listService.play();
			}
		} );

		stateService.disable();
		$rootScope.appReady();

	}] );
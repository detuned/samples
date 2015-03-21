angular.module( 'index' )
	.controller( 'WidgetsCtrl', [
		'$scope',
		'$locale',
		'configService',
		'periodsService',
		'themesService',
		'utilsService',
		function( $scope, $locale, configService, periodsService, themesService, utilsService ){
			$scope.appData = {
				skin   : configService.skin,
				locale : $locale.id
			};

			var sizesRegistry = {
				'240x400' : {
					title  : '240 × 400',
					name   : '240x400',
					width  : 240,
					height : 400
				},
				'270x400' : {
					title  : '270 × 400',
					name   : '270x400',
					width  : 270,
					height : 400
				},
				'720x240' : {
					title  : '720 × 240',
					name   : '720x240',
					width  : 720,
					height : 240,
					soon   : true
				}
			};

			$scope.sizes = [
				sizesRegistry['240x400'],
				sizesRegistry['270x400']
			];


			$scope.limits = _.map( configService.widgetLimitOptions.split( ',' ) || [], function( item ){
				return parseInt( angular.element.trim( item ) );
			} );
			$scope.widths = _.map( configService.widgetWidthOptions.split( ',' ) || [], function( item ){
				return parseInt( angular.element.trim( item ) );
			} );

			$scope.periods = periodsService.getAllPeriods();

			$scope.themes = themesService.getAllThemes( 'skip all' );

			$scope.theme = {};

			$scope.widgetOptions = {
//			limit  : parseInt( configService.widgetLimitDefault ),
				period       : $scope.periods[0],
				header       : true,
				theme        : [],
				host         : configService.widgetHost,
				borderRadius : 0,
				design       : 'white'
			};

			$scope.setTheme = function( themeId ){

				var
					selectedThemes,
					getSelectedThemes = function(){
						return _.chain( $scope.theme )
							.map( function( selected, themeId ){ return selected ? themeId : false; } )
							.compact()
							.value();
					};

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

				selectedThemes = getSelectedThemes();

				if( ! selectedThemes.length ){
					//If none of themes are selected, it means 'All' is selected
					$scope.theme[ themesService.THEME_ALL_ID ] = true;
					selectedThemes.push( themesService.THEME_ALL_ID );
				}

				$scope.widgetOptions.theme = selectedThemes;
			};

			$scope.setTheme( configService.themeDefault );


			$scope.setSize = function( size ){
				$scope.widgetOptions.width = size.width;
				$scope.widgetOptions.height = size.height;
			};

			$scope.size = {
				value : $scope.sizes[0]
			};
			$scope.setSize( $scope.size.value );


			$scope.hostsFilter = {
				mode             : 'all',
				whiteList        : '',
				blackList        : '',
				whiteListExample : "cnn.com\nrt.com\nrollingstone.com",
				blackListExample : "spiegel.de\naljazeera.com\nabc.net.au",
				title            : ''
			};

			//Hosts
			(function(){
				function actualizeHosts(){
					var domain = '';
					switch( $scope.hostsFilter.mode ){
						case 'whiteList':
							domain = _.filter( $scope.hostsFilter.whiteList.split( /\n/ ), utilsService.isLikeUrl ).join( ' ' );
							break;
						case 'blackList':
							domain = _.map(
								_.filter( $scope.hostsFilter.blackList.split( /\n/ ), utilsService.isLikeUrl ),
								function( item ){
									return item.charAt( 0 ) === '-'
										? item
										: '-' + item;
								}
							).join( ' ' );
							break;

					}
					$scope.widgetOptions.domain = domain;
				}

				$scope.$watch( function(){
					return [
						$scope.hostsFilter.mode,
						$scope.hostsFilter.whiteList,
						$scope.hostsFilter.blackList
					].join( '_' )
				}, actualizeHosts );

			})();


			//Border
			(function(){
				$scope.border = {
					widthPresets  : [
						{ title : 'No border', value : 0 },
						{ title : 'Thin (1 px)', value : 1 },
						{ title : 'Middle (2 px)', value : 2 },
						{ title : 'Thick (3 px)', value : 3 }
					],
					colorPresets  : [
						{ title : 'Gray', value : '#B7B7B7' },
						{ title : 'Blue', value : '#84ACD7' },
						{ title : 'Red', value : '#FF9F9F' }
					],
					radiusPresets : [
						{ title : 'Straight', value : 0 },
						{ title : 'Rounded', value : 8 }
					],
					onChange      : function(){
						var border = $scope.border.value;
						if( ! border.width ){
							$scope.widgetOptions.borderColor = null;
							$scope.widgetOptions.borderWidth = null;
						}
						else {
							$scope.widgetOptions.borderColor = border.color;
							$scope.widgetOptions.borderWidth = border.width;
						}
						$scope.widgetOptions.borderRadius = border.radius;
					}
				};
				$scope.border.value = {
					width  : 0,
					color  : '#B7B7B7',
					radius : 0
				};
			})();


			(function(){

				$scope.designPresets = [
					{ title : 'White', value : 'white' },
					{ title : 'Blue', value : 'blue' },
					{ title : 'Red', value : 'red' },
					{ title : 'Black', value : 'black' }
				];
			})();

		}
	] )
;
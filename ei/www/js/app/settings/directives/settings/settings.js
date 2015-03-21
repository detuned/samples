angular.module( 'index' )
	.directive( 'settings', [
		'$document',
		'configService',
		'themesService',
		'sourcesService',
		function( $document, configService, themesService, sourcesService ){
			return {
				templateUrl : configService._getUrl( '//APP/settings/directives/settings/settings.html' ),
				replace     : true,
				link        : function( scope, element, attrs ){

					scope.settingsData = {
						expanded : false
					};

					scope.getThemesSummary = function (){
						var
							res = 'all categories',
							keys;
						if ( ! scope.settingsData.expanded && ! scope.theme[themesService.THEME_ALL_ID]){
							keys = _.keys( scope.theme );
							if ( keys.length == 1 ){
								res = themesService.getTheme( keys[0] ).title;
							}
							else{
								res = keys.length + ' categories';
							}
						}
						return res;
					};

					scope.getSourcesSummary = function (){
						var
							res = 'all social networks',
							keys
						if ( ! scope.settingsData.expanded && ! scope.source[sourcesService.SOURCE_ALL_ID]){
							keys = _.keys( scope.source );
							if ( keys.length == 1 ){
								res = sourcesService.getSource( keys[0] ).title;
							}
							else{
								res = keys.length + ' social networks';
							}
						}
						return res;
					};


					scope.toggleCollapsing = function( state ){
						if( ! arguments.length ){
							state = ! scope.settingsData.expanded;
						}
						scope.settingsData.expanded = ! ! state;
						if( state ){
							onExpand();
						}
						else {
							onCollapse();
						}
					};

					function onExpand(){
						$document.on( 'mousedown', onOutsideClick );
					}

					function onCollapse(){
						$document.off( 'mousedown', onOutsideClick );
					}

					function onOutsideClick( event ){
						var target = angular.element( event.target );
						if( ! target.closest( '.settings' ).length ){
							scope.toggleCollapsing( false );
							scope.$apply();
						}
					}

					scope.toggleCollapsing( scope.settingsData.expanded );


				}
			}

		}] );
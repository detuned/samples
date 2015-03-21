angular.module( 'index' )
	.directive( 'preview', [
		'$window',
		'configService',
		'previewService',
		'utilsService',
		'themesService',
		'listService',
		function( $window, configService, previewService, utilsService, themesService, listService ){
			return {
				replace     : true,
				templateUrl : function(){
					return configService.enablePreview
						? configService._getUrl( '//APP/preview/directives/preview/preview.html' )
						: configService._getUrl( '//APP/preview/directives/preview/previewEmpty.html' )
				},
				link        : function( scope, element, attrs ){
					if( ! configService.enablePreview ){
						return;
					}

					var hostScreens = {
						//TODO when there will be a lot of them do it other way
						'rt.com' : '/img/hosts_screen/host-screen-rt-com.png'
					};

					scope.state = {
						loading : false
					};

					if( attrs.article ){
						applyArticle( scope.$eval( attrs.article ) );
					}


					function applyArticle( a ){
						scope.article = {};
						if ( ! angular.isObject( a ) ){
							return;
						}
						angular.forEach( a, function ( value, key ){
							//Transform keys to lowercase camelCase
							scope.article[ key.charAt(0).toLowerCase() + key.substr(1) ] = value;
						});

						if ( ! scope.article.id ){
							//Hack to get id from current URL if the data doesn't contain it
							scope.article.id = URI().segment( -1 ) || URI().segment( -2 );
						}

						if ( scope.article.category ){
							//Get theme object by its id
							scope.article.theme = themesService.getTheme( scope.article.category );
						}

						scope.article.compactUrl = utilsService.compactUrl( scope.article.permanentUrl );
						if ( ! scope.article.image && hostScreens[ scope.article.compactUrl ] ){
							scope.article.image = hostScreens[ scope.article.compactUrl ];
						}



						scope.previewData.article = scope.article;
					}


					scope.close = function(){
						utilsService.redirect( $window.URI().path( '' ).toString() );
					};
				}
			}

		}] );
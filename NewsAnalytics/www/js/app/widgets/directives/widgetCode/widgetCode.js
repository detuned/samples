angular.module( 'index' )
	.directive( 'widgetCode', [ 'configService', 'periodsService', 'themesService', function( configService, periodsService, themesService ){
		return {
			templateUrl : configService._getUrl( '//APP/widgets/directives/widgetCode/widgetCode.html' ),
			replace     : true,
			scope       : { options : '=' },
			link        : function( scope, element, attrs ){
				scope.getOptions = function(){
					var res = [];

					if ( scope.options.host && scope.options.host != 'domain.tld' ){
						// It's not very good to hardcode host here but
						// its original value is placed in widget.js which is separated
						// from all site and main config
						add( 'host', scope.options.host );
					}

					if( scope.options.width && + scope.options.width != + configService.widgetWidthDefault ){
						add( 'width', scope.options.width );
					}

					if( scope.options.height ){
						add( 'height', scope.options.height );
					}

					if( scope.options.header === false ){
						add( 'no-header', 1 );
					}

					if( scope.options.borderColor ){
						add( 'border-color', scope.options.borderColor );

						if( scope.options.borderWidth ){
							add( 'border-width', scope.options.borderWidth );
						}
					}

					if( scope.options.borderRadius ){
						add( 'border-radius', scope.options.borderRadius );
					}

					if( scope.options.limit && + scope.options.limit != + configService.widgetLimitDefault ){
						add( 'limit', scope.options.limit );
					}

					if( scope.options.period && scope.options.period.id !== periodsService.PERIOD_NOW_ID ){
						add( 'period', scope.options.period.alias );
					}

					if( scope.options.theme && scope.options.theme[0] && scope.options.theme[0] != themesService.THEME_ALL_ID ){
						add( 'categories', scope.options.theme.join( ',' ) );
					}

					if( scope.options.domain ){
						add( 'domain', encodeURIComponent( scope.options.domain ) );
					}

					if( scope.options.title ){
						add( 'title', encodeURIComponent( scope.options.title ) );
					}

					if( scope.options.design && scope.options.design != 'white' ){
						add( 'design', encodeURIComponent( scope.options.design ) );
					}

					function add( key, value ){
						res.push( 'data-' + key + '="' + value + '"' );
					}

					return res.length
						? ' ' + res.join( ' ' )
						: '';
				};
			}
		}

	}] );
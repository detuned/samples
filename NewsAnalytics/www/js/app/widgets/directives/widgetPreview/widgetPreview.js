angular.module( 'index' )
	.directive( 'widgetPreview', [
		'$window',
		'configService',
		function( $window, configService ){
			var windowElement = angular.element( $window );
			return {
				templateUrl : configService._getUrl( '//APP/widgets/directives/widgetPreview/widgetPreview.html' ),
				replace     : true,
				scope : { options : '=' },
				link  : function( scope, element, attrs ){
					var
						holderElement = element.find( '[role="iframe-holder"]' ),
						iframeElement,
						normalTop = element.offset().top,
						render = _.debounce( function(){
							var
								url = getIframeUrl( scope.options ),
								height = scope.options.height || getIframeHeight( scope.options.limit, scope.options.header === false ),
								width = scope.options.width,
								borderColor = scope.options.borderColor,
								borderWidth = scope.options.borderWidth,
								borderRadius = scope.options.borderRadius,
								css = {},
								iframeCss = {};
							if( ! iframeElement ){
								iframeElement = angular.element(
										'<iframe frameborder="0" class="widget-preview__iframe"' +
											' src="' + url + '"' +
											'></iframe>' )
									.appendTo( holderElement );
							}
							else if( iframeElement.attr( 'src' ) != url ){
								iframeElement.attr( 'src', url );
							}

							css.border = borderColor
								? ( borderWidth || 1 ) + 'px solid ' + borderColor
								: '';

							css.borderRadius = iframeCss.borderRadius = borderRadius
								? borderRadius + 'px'
								: '';

							holderElement
								.width( width )
								.height( height )
								.css( css );

							iframeElement
								.css( iframeCss );

						}, 300 );


					element.addClass( 'widget-preview' );
					function getIframeUrl( widgetData ){
						var
							params = [],
							keys = ['limit', 'period', 'domain', 'title', 'theme', 'sources', 'height', 'design'],
							aliases = {
								theme : 'categories'
							};
						angular.forEach( _.pick( widgetData, keys ), function( value, key ){
							if( angular.isArray( value ) ){
								value = value.join( ',' );
							} else if( angular.isObject( value ) ){
								value = value.alias || value.id;
							}
							if( value ){
								params.push( ( aliases[key] || key ) + '=' + value );
							}
						} );
						if( false === widgetData.header ){
							params.push( 'no_header', 1 );
						}
						return (
							configService.widgetPreviewHost
								+ '/widget/'
								+ ( params.length
								? '?' + params.join( '&' )
								: '' )
							)
					}

					function getIframeHeight( limit, hideHeader ){
						return Math.max( 200, limit * 60 ) + 88 - ( hideHeader ? 75 : 0 );
					}

					scope.$watch( 'options', render, true );
				}
			}

		}] );
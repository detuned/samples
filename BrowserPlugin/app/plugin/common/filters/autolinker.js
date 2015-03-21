angular.module( 'plugin' )
	.filter( 'autolinker', [
		'$sce',
		'configService',
		'utilsService',
		function( $sce, configService, utilsService ){
			return function( text, options ){
				options = options || {};
				if ( configService.extUrl ){
					/**
					 * @see http://gregjacobs.github.io/Autolinker.js/docs/#!/api/Autolinker
					 * @param al
					 * @param match
					 * @returns {*}
					 */
					options.replaceFn = function ( al, match ){
						if ( 'url' ===  match.getType() ){
							return '<a href="' +
								utilsService.urlTemplate(
									configService.extUrl,
									{ url :  encodeURIComponent( match.getAnchorHref() ) }
								) +
								'" target="_blank">' + match.getAnchorText() + '</a>';
						}
						return true;
					};
				}
				return text
					? $sce.trustAsHtml( Autolinker.link( text, options ) )
					: '';
			};
		}] );
angular.module( 'plugin' )
	.service( 'pluginService', [
		'$log',
		'$templateCache',
		'configService',
		'utilsService',
		function( $log, $templateCache, configService, utilsService ){
			var
				manifest = chrome.runtime.getManifest(),
				pluginService = {},
				platform = configService.platform || utilsService.getPlatformSignature();
			pluginService.getTemplateUrl = function( url ){
				var
					m,
					parts = [],
					res;
				if( m = url.match( /^\/\/([^\/]+)((?:\/.+)+)?\/([^\/\:]+?)(?:\:([^\/\.]+))?(?:\.([^\/]+))?$/ ) ){
					parts.push( 'js/app' );

					// App
					parts.push( m[1] );

					// Path
					if( m[2] ){
						parts.push( _.str.trim( m[2], '/' ) );
					}

					//Directive's folder
					parts.push( 'directives', m[3] );

					//File name + extension
					//Name by default equals to folder
					parts.push( ( m[4] || m[3] ) + '.' + ( m[5] || 'html' ) );

					res = parts.join( '/' );
				}
				else {
					res = url;
				}

				if ( $templateCache.get( '/' + res ) ){
					res = '/' + res;
				}
				else{
					res = chrome.extension.getURL( res );
				}
				return res;
			};

			manifest.assemblyVersion = ( configService.assembly ? configService.assembly + '.' : '' )
				+ manifest.version
				+ ( platform ? '.' + platform : '' );
			pluginService.manifest = manifest;

			if( typeof chrome.i18n.getUILanguage === 'function' ) {
				pluginService.lang = ( chrome.i18n.getUILanguage() || 'en' ).substr( 0, 2 );
			}
			else {
				pluginService.lang = ( chrome.i18n.getMessage( '@@ui_locale' ) || 'en' ).substr( 0, 2 );
			}
			moment.locale( pluginService.lang );

			$log.log( 'Plugin version is', manifest.assemblyVersion );

			return pluginService;
		}] );

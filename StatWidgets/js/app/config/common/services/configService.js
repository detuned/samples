angular.module( 'config' )
	.service( 'configService', [
		'$window',
		'$document',
		function( $window, $document ){
			var
				configService = {},
				globalConfig = $window.liteApp && angular.isObject( $window.liteApp.config )
					? $window.liteApp.config
					: {};

			configService.backendUrl = '/backend';

			configService.enableConsole = true;
			configService.extendedConsole = false;

			configService.logLevel = 'none';
			configService.logLevelToCache = 'all';
			configService.logCacheCapacity = 1000;
			configService.logEntryMaxLength = 400;

			angular.forEach( globalConfig, function( value, index ){
				if( index.charAt( 0 ) != '_' ){
					configService[ index ] = value;
				}
			} );
			return configService;
		}] );
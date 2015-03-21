angular.module( 'plugin.config' )
	.service( 'configService', [
		'$window',
		function( $window ){
			var
				configService = {},
				globalConfig = $window.plugin && angular.isObject( $window.plugin.config )
					? $window.plugin.config
					: {};

			configService.debug = false;
			configService.devel = false;


			configService.logLevel = 'none';
			configService.logLevelToCache = 'all';
			configService.logCacheCapacity = 0;
			configService.logEntryMaxLength = 400;

			configService.maxActiveNotifications = 1;


			configService.reopenPresets = [
				//Minutes
				5*60,
				15*60,
				30*60,
				45*60,

				//Hours
				1 * 3600,
				2 * 3600,
				3 * 3600,
				6 * 3600,
				8 * 3600,
				12 * 3600,
				16 * 3600,
				18 * 3600,

				//Days
				1 * 86400,
				2 * 86400,
				3 * 86400,
				7 * 86400,

				//Months
				1 * 86400*31, //As of moment v2.9.0
				2 * 86400*30,
				3 * 86400*30,
				6 * 86400*30,

				//Years
				1 * 86400*365

			];




			angular.forEach( globalConfig, function( value, index ){
				if( index.charAt( 0 ) != '_' ){
					configService[ index ] = value;
				}
			} );

			return configService;
		}] );
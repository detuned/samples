define( 'serverHandlers/userSettings', [
	'underscore',
	'jquery',
	'config',
	'log',
	'utils',

	'services/socialBgService',
	'services/sessionBgService'
], function( _, $, config, log, utils, socialBgService, sessionBgService ){
	var
		userSettings = {};

	log = log.c( 'userSettings' );

	userSettings.externalsUpdate = function( params ){
		log.log( 'externalsUpdate fired with', params );

		if( params.data && params.data.externals ){
			sessionBgService.getTermId().then( function( termId ){
				if ( params.data.termId && params.data.termId == termId ){
					log.info( 'got the same termId', termId, 'in received userSettings::externalsUpdate, so ignore it' );
				}
				else{
					log.log( 'got an update externals from server', params.data.externals );
					socialBgService.setExternals( params.data.externals );
				}
			} );
		}
		return true;
	};


	return userSettings;
} );
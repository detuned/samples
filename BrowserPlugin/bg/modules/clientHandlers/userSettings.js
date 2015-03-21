define( 'clientHandlers/userSettings', [
	'jquery',
	'log',
	'services/authBgService',
	'services/userInfoBgService',
	'services/userPageBgService',
	'services/socialBgService'
], function( $, _log, authBgService, userInfoBgService, userPageBgService, socialBgService ){
	var
		userSettings = {},
		log = _log.c( 'authHandler' );

	userSettings['get'] = function (){
		return userInfoBgService.getUserInfo();
	};
	userSettings['set'] = userInfoBgService.setUserInfo;

	userSettings.updateCliSettings = function( params ){
		var defer = $.Deferred();
		authBgService.setCliSettings( params.data ).then( function( res ){
			defer.resolve( res );
			userPageBgService.broadcastAllTabs( 'userCli::update', res );
		}, defer.reject );
		return defer.promise();
	};

	userSettings.socialAuth = function( params ){
		return socialBgService.socialAuth( params.provider );
	};

	return userSettings;
} );
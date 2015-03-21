angular.module( 'plugin' )
	.service( 'userService', [
		'$q',
		'$log',
		'apiService',
		'utilsService',
		'configService',
		'dispatchService',
		'eventsFabricService',
		'socialService',
		function( $q, $log, apiService, utilsService, configService, dispatchService, eventsFabricService, socialService ){
			var
				events = eventsFabricService.getInstance( { name : 'userService' } ),
				userData = {},
				authDefer,
				info = {},
				initData = {},
				cliSettings = {},
				grants = {
					changeToken           : configService.allowChangeToken,
					changeInfo            : configService.allowChangeInfo,
					changePref            : configService.allowChangePref,
					changeOwnChatMessages : configService.changeOwnChatMessages,
					changeAnyChatMessages : configService.changeAnyChatMessages,
					deleteOwnChatMessages : configService.deleteOwnChatMessages,
					deleteAnyChatMessages : configService.deleteAnyChatMessages
				},
				socialProviders = _.indexBy( [
					socialService.getNetwork( 'fb' ),
					socialService.getNetwork( 'google' ),
					socialService.getNetwork( 'vk' )
				], 'id' ),
				userService = {
					get uid(){ return userData.uid },
					get cliSettings(){ return cliSettings },
					hasGrant        : hasGrant,
					info            : info,
					initData        : initData,
					socialProviders : socialProviders
				};


			userService.on = events.on();
			userService.off = events.off();

			userService.auth = function(){
				if( authDefer ){
					return authDefer.promise;
				}
				authDefer = $q.defer();
				apiService.request( 'auth::auth' ).then( function( data ){
					if( data.cliSettings ){
						utilsService.updateObject( cliSettings, data.cliSettings );
						delete data.cliSettings;
					}
					if ( data.authProviders ){
						updateSocialProviders( data.authProviders );
						delete data.authProviders;
					}
					if( data.userInfo ){
						updateInfo( data.userInfo );
					}
					updateInitData( _.omit( data, 'userInfo' ) );
					utilsService.updateObject( userData, data );
					authDefer.resolve( data );
					authDefer = null;
				}, function( res ){
					authDefer.reject( res );
					authDefer = null;
				} );
				return authDefer.promise;
			};

			userService.checkToken = function( token ){
				var defer = $q.defer();
				//TODO
				return defer.promise;
			};

			userService.getToken = function(){
				var defer = $q.defer();
				apiService.request( 'auth::getToken' ).then( function( data ){
					if( data && data.token ){
						defer.resolve( data.token );
					}
					else {
						defer.reject( data );
					}
				}, defer.reject );
				return defer.promise;
			};

			userService.setToken = function( token ){
				var defer = $q.defer();

				apiService.request( 'auth::setToken', { token : token } ).then( function( data ){
					$log.log( 'userService: successfully set new token', token, ':', data );
					utilsService.updateObject( userData, data );
					defer.resolve( data );
				}, function( res ){
					$log.warn( 'userService: failed set new token', token, ':', res );
					defer.reject( res );
				} );

				return defer.promise;

			};


			userService.getInfo = function(){
				var defer = $q.defer();
				apiService.request( 'userSettings::get' ).then( function( data ){
					if( angular.isObject( data ) ){
						updateInfo( data );
						defer.resolve( data );
					}
					else {
						defer.reject( data );
					}
				}, defer.reject );
				return defer.promise;
			};

			userService.setInfo = function( newInfo ){
				var
					defer = $q.defer(),
					updatingInfo = _.extend( _.clone( info ), newInfo );

				apiService.request( 'userSettings::set', updatingInfo ).then( function( res ){
					if( res ){
						defer.resolve( res );
						updateInfo( updatingInfo );
					}
					else {
						defer.reject( res );
					}
				}, defer.reject );
				return defer.promise;
			};

			function hasGrant( grant ){
				return grants[grant];
			}

			userService.setCliSettings = function( key, value ){
				var sendData = {
					data : {}
				};
				sendData.data[key] = value;
				apiService.request( 'userSettings::updateCliSettings', sendData );
			};

			function updateInfo( data ){
				utilsService.updateObject( info, data );
				events.trigger( 'updateInfo' )( info );
			}

			function updateInitData( data ){
				utilsService.updateObject( initData, data );
				events.trigger( 'updateInitData' )( initData );
			}

			function updateSocialProviders( authProviders ){
				_.each( socialProviders, function ( provider ){
					provider.auth = authProviders[ provider.id ];
				} );
			}

			dispatchService
				.listen( 'auth::reset', function(){
					var prevUid = userData.uid;
					userService.auth().then( function(){
						if( userData.id != prevUid ){
							events.trigger( 'userChange' )( userData );
						}
						userService.getInfo();
					} );
				} )
				.listen( 'userCli::update', function( res ){
					utilsService.updateObject( cliSettings, res || {} );
				} )
				.listen( 'userInfo::update', function( newUserInfo ){
					updateInfo( newUserInfo );
				} );


			_.each( socialProviders, function ( provider, id ){
				dispatchService
					.listen( 'socialAuthToggle::' + id, function( data ){
						if ( data.auth ){
							$log.log( 'social provider', id, 'mark authorized' );
							provider.auth = true;
						}
						else{
							$log.log( 'social provider', id, 'mark unauthorized' );
							provider.auth = false;
						}
					} );
			});

			userService.socialAuth = function( providerId ){
				var defer = $q.defer();
				apiService.request( 'userSettings::socialAuth', { provider : providerId } ).then( function( res ){
					if( res ){
						defer.resolve( res );
					}
					else {
						defer.reject( res );
					}
				}, defer.reject );
				return defer.promise;
			};


			userService.getInfo();
			return userService;
		}] );
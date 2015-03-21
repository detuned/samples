angular.module( 'index' )
	.service( 'consoleService', [
		'$window',
		'$location',
		'$rootScope',
		'configService',
		'apiService',
		'stateService',
		'utilsService',
		'logService',
		function( $window, $location, $rootScope, configService, apiService, stateService, utilsService, logService ){
		var
			publicConsole = {},
			consoleService = {},
			isExtended = false;

		consoleService.init = function(){};

		function sudo(){
			//TODO consider is it possible to extend console according to user's right
			extendConsole();
		}

		function extendConsole(){
			if ( isExtended  ){
				return;
			}
			angular.extend( publicConsole, {
				apiService         : apiService,
				utilsService       : utilsService,
				$location          : $location,
				setState           : function( state ){
					stateService.setState( state );
					$rootScope.$apply();
				},
				setLogLevel        : function( level ){
					configService.logLevel = level;
				},
				getLog : function (){
					var log = logService.getCached.apply( null, arguments );
					console.log( log.join( "\n" ) );
					return 'Displayed entries: ' + log.length + '. Total entries: ' + logService.getCacheCapacity();
				},
				info : function (){
					var
						info = logService.getInfo(),
						res = [];
					angular.forEach( info, function ( value, key ){
						res.push( key + "\t" + value )
					});
					console.log( res.join( "\n" ) );
				},
				clearLogCache : logService.clearCache,
				setSocketUrl       : function( url ){
					configService.socketUrl = url;
					apiService.getInstance( 'socket' ).close();
				}
			} );

			( $window.indexApp || ( $window.indexApp = {} ) ).run = publicConsole;
			isExtended = true;
		}

		if( configService.enableConsole ){
			angular.extend( $window.indexApp || ( $window.indexApp = {} ), {
				sudo : function (){
					sudo();
					return publicConsole;
				}
			} );
		}

		if( configService.extendedConsole ){
			sudo();
		}

		return consoleService;
	}] );
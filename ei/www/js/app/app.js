angular.module( 'index', [ 'ui.bootstrap', 'ngRoute', 'bd.sockjs', 'ngStorage', 'indexConfig' ] )
	.config( [ '$routeProvider', '$provide', function( $routeProvider, $provide ){

		$routeProvider
			.when( '/', {} )
			.otherwise( {redirectTo : '/'} );

		$provide.decorator( '$log', [ '$delegate', 'logService', 'configService', function( $delegate, logService, configService ){
			angular.forEach( logService.getAllLevels(), function( level ){
				$delegate[ level ] = logService.getDecorator( level, $delegate[ level ] )
			} );
			return $delegate;
		}] );
		$provide.decorator( '$locale', [ '$delegate', '$log', 'utilsService', 'configService', function( $delegate, $log, utilsService, configService ){
			var
				locale = utilsService.getUserLanguage(),
				possibleLocales = _.map( configService.locales.split( ',' ), angular.element.trim ),
				lang;
			$delegate.id = configService.localeDefault;
			if( locale ){
				lang = locale.split( '-' ).shift().toLocaleLowerCase();
				if( _.indexOf( possibleLocales, lang ) > - 1 ){
					$delegate.id = lang;
					$log.log( 'set locale:', lang );
				}
				else {
					$log.info( 'unknown locale detected:', lang, ' set to default:', $delegate.id );
				}
			}
			else {
				$log.info( 'cannot detect browser locale, set to default:', $delegate.id );
			}
			return $delegate;
		}] );
	}] )
	.run( [ '$rootScope', '$q', 'consoleService', function( $rootScope, $q, consoleService ){
		consoleService.init();
		var readyDefer = $q.defer();
		$rootScope.whenAppReady = function (){
			return readyDefer.promise;
		};
		$rootScope.appReady = _.once( readyDefer.resolve );
	}] )
	.constant( 'KEY_CODES', {
		'ESCAPE'      : 27,
		'ENTER'       : 13,
		'SPACE'       : 32,
		'ARROW_LEFT'  : 37,
		'ARROW_UP'    : 38,
		'ARROW_RIGHT' : 39,
		'ARROW_DOWN'  : 40,
		'BACKSPACE'   : 8
	} )
	.constant( 'CONST', {
	} )
/**
 * Overrides $exceptionHandler to trace errors with qbaka
 */
	.factory( '$exceptionHandler', [ '$log', '$window', 'configService', function( $log, $window, configService ){
		return function( exception, cause ){
			if ( ! configService.angularSkipDigestErrors || String( exception ).indexOf( '$digest' ) < 0 ){
				if( $window.qbaka && $window.qbaka.report ){
					$window.qbaka.report( exception );
				}
				$log.error( exception )
			}
		};
	}] );
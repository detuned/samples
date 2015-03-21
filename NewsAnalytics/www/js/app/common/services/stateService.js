angular.module( 'index' )
	.service( 'stateService', ['$log', '$rootScope', '$routeParams', '$route', '$location', '$q', '$timeout', 'configService', 'utilsService', function( $log, $rootScope, $routeParams, $route, $location, $q, $timeout, configService, utilsService ){
		var
			handlers = {},
			handlersOrder = [],
			stateService = {},
			currParams = {},
			currStateUrl,
			isEnable = true,
			isUrlParseEnabled = true,
			isListeningEnable = true,
			timers = utilsService.timersManager(),
			updateUrl = _.debounce( _updateUrl, 50 );

		stateService.param = function( param, options ){
			if( param in handlers ){
				$log.warn( 'cannot add handler for', param, 'cause it already exists' );
				return false;
			}
			handlers[param] = Handler( param, options );
			handlersOrder.push( param );
			return stateService;
		};

		stateService.stopParam = function( param ){
			if( handlers[param] ){
				handlers[param].deactivate();
				delete handlers[param];
				handlersOrder = _.filter( handlersOrder, function( item ){
					return item != param;
				} );
			}
		};

		stateService.setState = function( state ){
			$timeout( function(){
				$location.search( state || {} );
			} );
		};

		stateService.resetState = function(){
			$log.log( 'stateService: reset state to default' );
			stateService.setState( null );
		};

		stateService.disable = function(){
			isEnable = false;
		};

		stateService.activate = function(){
			var defer = $q.defer();
			if( ! isEnable ){
				setDefaults();
				defer.resolve();
				return defer.promise;
			}
			forEachHandler( function( handler, param ){
				handler.activate();
			} );
			$rootScope.$on( '$routeChangeSuccess', function( $event ){
				parseUrl();
			} );
			parseUrl();
			defer.resolve(); //Maybe do it async later
			return defer.promise;
		};

		function parseUrl( params ){
			if( ! isUrlParseEnabled || currStateUrl === $location.url() ){
				return;
			}
			params = params || $routeParams;
			isListeningEnable = false;
			timers.resetTimer( 'parseUrl' );
			$log.debug( 'stateService: parse url=', $location.url(), 'params=', params );

			forEachHandler( function( handler, param ){
				if( angular.isDefined( params[param] ) && String( params[param] ) != String( currParams[param] ) ){
					if( handler.isValid( params[param] ) ){
						handler.update( params[param] );
					}
					else {
						$log.warn( 'stateService: incorrect param value ignored ', param, ':', params[param] );
					}

				}
				else if( ! angular.isDefined( params[param] ) && ! handler.isDefault( currParams[param] ) ){
					handler.setDefault();
				}
			} );
			timers.setTimer( 'parseUrl', function(){
				isListeningEnable = true;
			}, 50 );
			currParams = angular.copy( params );
			currStateUrl = $location.url();
			$rootScope.$emit( 'stateUpdated', {
				params    : currParams,
				url       : currStateUrl,
				isDefault : ! currStateUrl || currStateUrl === '/'
			} );
		}

		function setDefaults(){
			forEachHandler( function( handler, param ){
				handler.setDefault();
			} );
		}

		function _updateUrl(){
			var newState = {};
			forEachHandler( function( handler, param ){
				var value = currParams[param];
				if( angular.isDefined( value ) && ! handler.isDefault( value ) ){
					newState[param] = value;
				}
			} );
			return stateService.setState( newState );
		}

		function forEachHandler( fn ){
			angular.forEach( handlersOrder, function( param ){
				fn( handlers[param], param );
			} );
		}

		function Handler( param, data ){
			data = _.defaults( data, {
				setDefault : function(){},
				isDefault  : function(){},
				update     : function(){},
				isValid    : function(){ return true }
			} );
			var listeners = [];
			return {
				activate   : function(){
					if( data.listen ){
						listeners.push( data.listen( function( v, prev ){
							if( isListeningEnable && v !== prev ){
								currParams[param] = v;
								updateUrl();
							}
						} ) );
					}
				},
				deactivate : function(){
					if( listeners ){
						angular.forEach( listeners, function( listener ){
							listener();
						} );
					}
				},
				setDefault : data.setDefault,
				isDefault  : data.isDefault,
				isValid    : data.isValid,
				update     : data.update
			};
		}

		return stateService;
	}] );
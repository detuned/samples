angular.module( 'utils' )
	.service( 'utilsService', [
		'$timeout',
		'$window',
		'$q',
		'$rootScope',
		function( $timeout, $window, $q, $rootScope ){
			var
				utilsService = {},
				windowElement = angular.element( $window ),
				mainTimers;
			utilsService.elementDestructor = function( element ){
				var destructors = [];
				element.on( '$destroy', function(){
					angular.forEach( destructors, function( d ){
						d();
					} )
				} );
				return {
					push : _.bind( destructors.push, destructors )
				}
			};
			utilsService.scopeDestructor = function( scope ){
				var destructors = [];
				scope.$on( '$destroy', function(){
					angular.forEach( destructors, function( d ){
						d();
					} )
				} );
				return {
					push : _.bind( destructors.push, destructors )
				}
			};

			utilsService.l10n = function(){
				if( ! arguments[0] ){
					return '';
				}
				return chrome.i18n.getMessage.apply( chrome.i18n.getMessage, arguments );
			};

			utilsService.l10nPlural = function(){
				if( ! arguments[0] ){
					return '';
				}
				var
					res = chrome.i18n.getMessage.apply( chrome.i18n.getMessage, _.map( arguments, String ) );
				if( res ){
					res = res.replace( /\[quant,([^\]]+)\]/g, function( a, b ){
						var
							msg = b.split( ',' ),
							n = parseInt( msg.shift() ),
							plural = ( (n % 10 == 1 && n % 100 != 11) ? 0 : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ) ? 1 : 2); //XXX add language related func?
						return msg[plural] || msg.pop();
					} );
				}
				return res;
			};

			utilsService.numberFormat = function( value, separator ){
				if( ! value ){
					return value;
				}
				var
					str = value.toString(),
					decParts = str.split( '.' ),
					intStr = decParts.shift(),
					fractionStr = decParts.shift(),
					parts = [];
				if( ! angular.isDefined( separator ) ){
					separator = ' ';
				}
				while( intStr.length > 2 ){
					parts.unshift( intStr.substr( intStr.length - 3, intStr.length ) );
					intStr = intStr.substr( 0, intStr.length - 3 );
				}
				if( intStr.length ){
					parts.unshift( intStr );
				}
				return [
					parts.join( separator ),
					( fractionStr
						? ',' + fractionStr
						: '' )
				].join( '' );
			}

			utilsService.getLocale = function(){
				if( typeof chrome.i18n.getUILanguage === 'function' ) {
					return chrome.i18n.getUILanguage();
				}
				return chrome.i18n.getMessage( '@@ui_locale' );
			};

			utilsService.updateArray = function( oldArray, newArray ){
				oldArray.length = 0;
				_.each( newArray, function( item, index ){
					oldArray[index] = item;
				} )
			};

			utilsService.clearArray = function( array ){
				array.length = 0;
			};

			utilsService.clearObject = function( obj ){
				_.each( obj, function( value, key ){
					delete obj[ key ];
				} );
			};

			utilsService.updateObject = function( obj, newObj ){
				utilsService.clearObject( obj );
				_.extend( obj, newObj );
			};

			utilsService.makeUrlClickable = function( url ){
				return ! url || url.match( /^(?:https?:\/\/|javascript:)/ )
					? url
					: 'http://' + url;
			};

			utilsService.normalizeUrl = function( url ){
				return url
					? String( url )
					.toLocaleLowerCase()
					.replace( /^https?:\/\//, '' )
					.replace( /^www\./, '' )
					.replace( /\/$/, '' )
					: '';
			};

			/**
			 * Parses given string template to replace placeholders with leading colon by its values
			 * Uses underscore template engine
			 * Now all placeholders are required to have its values
			 * @param url
			 * @param data
			 * @returns {string}
			 */
			utilsService.urlTemplate = function( url, data ){
				return _.template( url, { interpolate : /\:([a-zA-Z0-9_]+)/g } )(data);
			};

			(function(){
				var timersInstances = [];
				utilsService.timersManager = function(){
					var
						timers = {},
						instance = {
							resetTimer : resetTimer,
							setTimer   : setTimer,
							destroy    : destroy
						};

					function resetTimer( name ){
						if( timers[ name ] ){
							$timeout.cancel( timers[name] );
							timers[name] = null;
						}
						return instance;
					}

					function setTimer( name, action, delay ){
						resetTimer( name );
						return ( timers[name] = $timeout( action, delay ) );
					}

					function destroy(){
						_.each( timers, function ( item, name ){
							resetTimer( name );
						});
						instance = null;
					}
					timersInstances.push( instance );
					return instance;
				};

				utilsService.destroyTimers = function(){
					while( timersInstances.length ){
						timersInstances.shift().destroy();
					}
				};
			})();


			utilsService.onWindowFocus = function(){
				var defer = $q.defer();
				if( document.hasFocus() ){
					defer.resolve();
				}
				else {
					windowElement.on( 'focus', onFocus );
				}
				function onFocus(){
					defer.resolve();
					windowElement.off( 'focus', onFocus );
					$rootScope.$apply();
				}

				return defer.promise;
			};


			utilsService.cleanAngularObject = function( obj ){
				if( ! angular.isObject( obj ) ){
					return obj;
				}
				var res = {};
				angular.forEach( obj, function( val, key ){
					if( ! key.match( /^\$\$.+/ ) ){
						res[key] = val;
					}
				} );
				return res;
			};

			utilsService.getResolvedPromise = function( data ){
				var defer = $q.defer();
				defer.resolve( data );
				return defer.promise;
			};

			utilsService.getRejectedPromise = function( data ){
				var defer = $q.defer();
				defer.reject( data );
				return defer.promise;
			};

			utilsService.isEmail = function( str ){
				return str && /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test( str );
			};

			utilsService.getPlatformSignature = function (){
				var
					ua = $window.navigator && $window.navigator.userAgent
						? $window.navigator.userAgent
						: '';
				if ( ! ua ){
					return;
				}
				if ( ua.match(/Opera|OPR\// ) ){
					return 'opera';
				}
				if (ua.match( /Firefox/ )){
					return 'firefox';
				}
				if (ua.match( /YaBrowser/ )){
					return 'yandex';
				}
				if (ua.match( /Chrome/ )){
					return 'chrome';
				}

			};

			utilsService.inheritFunction = function( fn, superFn, proto ){
				var Inheritance = function(){};
				Inheritance.prototype = superFn.prototype;
				fn.prototype = new Inheritance();
				fn.prototype.constructor = fn;
				fn.superClass = superFn;
				fn.prototype._parent = superFn.prototype;
				fn.prototype._parentMethod = function( method ){
					var args = Array.prototype.slice.call( arguments );
					if( _.isFunction( fn._parent[method] ) ){
						var a = args.slice( 1 );
						return fn._parent[method].call( fn, a[0], a[1], a[2] );
					}
				};
				fn.prototype._superMethod = function( method ){
					if( typeof fn._parent[method] == 'function' ){
						return fn._parent[method].apply(
							fn,
							Array.prototype.slice.call( arguments, 1 )
						);
					}
				};
				if( _.isObject( proto ) ){
					$.extend( fn.prototype, proto );
				}
				return fn;
			};

			return utilsService;
		}] );

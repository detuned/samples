angular.module( 'index' )
	.service( 'utilsService', [ '$timeout', '$window', function( $timeout, $window ){
		var utilsService = {};

		utilsService.DEVICE = {
			isIpad   : navigator.userAgent.match( /iPad/i ) != null,
			isIphone : navigator.userAgent.match( /iPhone/i ) != null,
			isIpod   : navigator.userAgent.match( /iPod/i ) != null
		};

		utilsService.OPERATING_SYSTEM = (function(){
			var res = {
				isLinux : navigator && navigator.platform && navigator.platform.search( 'Linux' ) >= 0,
				isBsd   : navigator && navigator.platform && navigator.platform.search( /Bsd/i ) >= 0
			};
			res.isUnix = (res.isLinux || res.isBsd);
			res.isOs = utilsService.DEVICE.isIpad || utilsService.DEVICE.isIphone || utilsService.DEVICE.isIpod;
			res.isOs5 = navigator.userAgent.match( /OS 5(_\d)+ like Mac OS X/i );
			return res;
		})();

		utilsService.roundFloat = function( value, precision ){
			precision = typeof precision == 'undefined'
				? 2
				: precision;
			return Math.round( value * Math.pow( 10, precision ) ) / Math.pow( 10, precision );
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

		utilsService.floatFormat = function( value, decimals, decimalSeparator, orderSeparator ){
			return _.str.numberFormat( value,
				decimals || 2,
				decimalSeparator || ',',
				orderSeparator || ' '
			);
		};


		utilsService.plural = function( num, endings, replace ){
			if( isNaN( num ) || ! endings.length ){
				return num;
			}
			var index = utilsService.pluralIndex( num );
			return replace
				? endings[ index ].replace( '%1', num )
				: num + ' ' + endings[ index ];
		}

		utilsService.pluralIndex = function( num ){
			var
				r10, r100, plr;

			if( isNaN( num ) ){
				return;
			}

			r10 = num % 10;
			r100 = num % 100;
			plr = (r10 == 1 && r100 != 11)
				? 0
				: (
				(r10 >= 2 && r10 <= 4 && (r100 < 10 || r100 >= 20) )
					? 1
					: 2
				);
			return plr;
		}


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
		}

		utilsService.timersManager = function(){
			var
				timers = {},
				instance = {
					resetTimer : resetTimer,
					setTimer   : setTimer
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

			return instance;
		}


		utilsService.normalizeUrl = function( url ){
			return url
				? String( url )
				.toLocaleLowerCase()
				.replace( /^https?:\/\//, '' )
				.replace( /^www\./, '' )
				.replace( /^rss\./, '' )
				.replace( /\/$/, '' )
				: '';
		};

		utilsService.compactUrl = function( url ){
			return URI( url ).host().replace( /^www\./, '' );
		};

		utilsService.fixUrlProtocol = function( url ){
			return url.match( '^https?:\/\/' )
				? url
				: [ $window.location.protocol, url ].join( '//' )
		};

		utilsService.redirect = function( url ){
			$window.location.href = url;
		}

		utilsService.getUserLanguage = function(){
			return $window.navigator.userLanguage || $window.navigator.language;
		};

		utilsService.parseStringTemplate = function( template, params, options ){
			return _.template(
				template,
				params,
				angular.extend( options || {}, {
					interpolate : /\{(.+?)\}/g
				} )
			);
		};

		utilsService.parseTsv = function( tsv, options ){
			options = _.defaults( options || {}, {} );
			return _.map( tsv.split( '\n' ), function( line ){
				var values = line.split( '\t' );
				if( options.ignoreValue ){
					values = _.map( values, function( value ){
						return value === options.ignoreValue
							? ''
							: value;
					} );
				}
				return options.fields
					? _.object( options.fields, values )
					: values;
			} );
		};

		utilsService.parseCsvString = function( str ){
			var p = _.map( str.split( ',' ), angular.element.trim );
			return p;
		};

		utilsService.preloadImg = function( url ){
			return angular.element( '<img>' ).attr( 'src', url );
			;
		};

		utilsService.scrollWindow = (function(){
			var scrollingElement;
			return function( value, duration, left ){
				var state = {};
				if( ! scrollingElement ){
					scrollingElement = angular.element( 'html,body' );
				}
				state[ left ? 'scrollLeft' : 'scrollTop' ] = value || 0;
				return scrollingElement.stop().animate( state, { duration : ( duration || 300 ), ease : 'swing' } );
			};
		})();

		utilsService.isLikeUrl = function( str ){
			return str && str.match( /^.*\.[a-z]{2,4}$/ );
		};

		utilsService.getValueFromClass = function( element, prefix ){
			var res = '';
			_.find( ( angular.element( element ).attr( 'class' ) || '' ).split( ' ' ), function( part ){
				if( part.search( prefix ) === 0 ){
					res = part.substr( prefix.length );
					return true;
				}
			} );
			return res;
		};

		return utilsService;
	}] );
define( 'utils', [
	'underscore',
	'jquery',
	'config',
	'log'
], function( _, $, config, log ){
	var utils = {};

	utils.timersManager = function(){
		var
			timers = {},
			instance = {
				resetTimer : resetTimer,
				setTimer   : setTimer,
				resetAll   : resetAll,
				destroy    : destroy
			};

		function resetTimer( name ){
			if( timers[ name ] ){
				clearTimeout( timers[name] );
				timers[name] = null;
			}
			return instance;
		}

		function setTimer( name, action, delay ){
			resetTimer( name );
			return ( timers[name] = setTimeout( action, delay ) );
		}

		function destroy(){
			resetAll();
			instance = null;
		}

		function resetAll(){
			_.each( timers, function( item, name ){
				resetTimer( name );
			} );
		}

		return instance;
	};

	utils.decodeAction = function( str, data ){
		var p = str.split( '::' );
		data = data || {};
		return _.extend(
			{
				obj : p[0],
				act : p[1]
			},
			_.omit( data, 'obj', 'act', 'data' ),
			{ data : JSON.stringify( data.data ) }
		);
	};

	utils.isUrlClickable = function( url ){
		return /^(?:https?:\/\/|javascript:|ftp:)/.test( url );
	};

	utils.makeUrlClickable = function( url ){
		return ! url || url.match( /^(?:https?:\/\/|javascript:)/ )
			? url
			: 'http://' + url;
	};

	utils.getResolvedPromise = function( data ){
		var defer = $.Deferred();
		defer.resolve( data );
		return defer.promise();
	};

	utils.getRejectedPromise = function( data ){
		var defer = $.Deferred();
		defer.reject( data );
		return defer.promise();
	};

	utils.l10n = function(){
		if( ! arguments[0] ){
			return '';
		}
		return chrome.i18n.getMessage.apply( chrome.i18n.getMessage, arguments );
	};

	utils.isEmail = function( str ){
		return str && /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test( str );
	};

	utils.crc8 = function( str ){
		var
			hexNum = new Array( '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F' ),
			strLength,
			crc;

		strLength = str.length;
		crc = findCrc( str, strLength );

		function findCrc( data, datalen ){
			var
				crc = 0,
				genPoly = 0x07,
				i, j, c;

			for( j = 0; j < datalen; j ++ ){
				c = data.charCodeAt( j );
				crc ^= c;
				for( i = 0; i < 8; i ++ )
					if( crc & 0x80 )
						crc = (crc << 1) ^ genPoly;
					else
						crc <<= 1;
				crc &= 0xff;
			}
			return crc;
		}

		return hexNum[crc >> 4] + hexNum[crc & 0xf];

	};

	utils.getPlatformSignature = function(){
		var
			ua = window.navigator && window.navigator.userAgent
				? window.navigator.userAgent
				: '';
		if( ! ua ){
			return;
		}
		if( ua.match( /Opera|OPR\// ) ){
			return 'opera';
		}
		if( ua.match( /Firefox/ ) ){
			return 'firefox';
		}
		if( ua.match( /YaBrowser/ ) ){
			return 'yandex';
		}
		if( ua.match( /Chrome/ ) ){
			return 'chrome';
		}

	};

	utils.parseTsv = function( tsv, options ){
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

	utils.inheritFunction = function( fn, superFn, proto ){
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

	return utils;
} );
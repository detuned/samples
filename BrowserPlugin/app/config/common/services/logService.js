angular.module( 'plugin.config' )
	.service( 'logService', [
		'configService',
		function( configService ){
			var
				levels = [ 'debug', 'log', 'info', 'warn', 'error' ],
				prefixes = [],
				levelsIndexes = _.object( levels, _.keys( levels ) ),
				logService = {},
				cache = [],
				start = moment();

			logService.getAllLevels = function(){
				return levels;
			};

			logService.addPrefix = function ( prefix ){
				prefixes.unshift( '[' + prefix + ']' );
			};

			logService.getDecorator = function( level, origFn ){
				var index = levelsIndexes[level];
				return function(){
					var args = prefixes.concat( _.toArray( arguments ) );
					if( index >= getLevelIndex( configService.logLevel ) ){
						origFn.apply( null, args );
					}
					if( configService.logCacheCapacity && index >= getLevelIndex( configService.logLevelToCache ) ){
						args.unshift( level );
						logService.cache.apply( logService, args )
					}
				}
			};

			function getLevelIndex( level ){
				var levelIndex = - 1;
				if( level == 'none' ){
					levelIndex = levels.length + 1;
				}
				else if( level in levelsIndexes ){
					levelIndex = levelsIndexes[ level ];
				}
				return + levelIndex;
			}

			logService.cache = function(){
				var
					args = _.toArray( arguments ),
					level = args.shift(),
					message;
				args = _.map( args, formatLogValue );
				args.unshift( getDateStr(), "\t[", level, "]\t" );
				message = args.join( '' );
				cache.push( message );
				if( cache.length >= configService.logCacheCapacity ){
					cache.shift();
				}
			};

			logService.getCached = function(){
				var
					res = cache,
					args = _.toArray( arguments ),
					number, type, typePattern;
				if( angular.isString( args[0] ) ){
					type = args.shift();
					if( '>' === type.charAt( 0 ) ){
						type = type.substr( 1 );
						typePattern = new RegExp( '^[0-9\:\t]+\\[(?:' + levels.slice( getLevelIndex( type ) ).join( '|' ) + ')\\]' );
					}
					else if( '<' === type.charAt( 0 ) ){
						type = type.substr( 1 );
						typePattern = new RegExp( '^[0-9\:\t]+\\[(?:' + levels.slice( 0, getLevelIndex( type ) + 1 ).join( '|' ) + ')\\]' );
					}
					else {
						typePattern = new RegExp( '^[0-9\:\t]+\\[' + type + '\\]' );
					}
					number = args.shift();
				}
				else if( angular.isNumber( args[0] ) ){
					number = args.shift();
				}
				res = type
					? _.filter( res, function( m ){ return typePattern.test( m ) } )
					: res;
				res = number
					? _.first( res, number )
					: res;
				return res;
			};

			logService.getCacheCapacity = function(){
				return cache.length;
			};

			logService.clearCache = function(){
				cache = [];
			};

			logService.getInfo = function(){
				return {
					'started at'   : start.format( 'HH:mm:ss' ),
					'working time' : moment.utc( moment().diff( start ) ).format( 'HH:mm:ss' )
				};
			};

			function formatLogValue( value ){
				return  _.str.truncate(
					( angular.isObject( value )
						? angular.toJson( value )
						: String( value ).replace( /\n+/g, ' ' )
						),
					configService.logEntryMaxLength
				);

			}

			function getDateStr(){
				var dt = new Date();
				return [
					_.str.lpad( dt.getHours(), 2, '0' ),
					_.str.lpad( dt.getMinutes(), 2, '0' ),
					_.str.lpad( dt.getSeconds(), 2, '0' )
				].join( ':' );
			}


			return logService;
		}] );
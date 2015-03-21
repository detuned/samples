define( 'log', [
	'underscore',
	'underscore.string',
	'config'
], function( _, _str, config ){
	var
		levels = [ 'debug', 'log', 'info', 'warn', 'error' ],
		levelsIndexes = _.object( levels, _.keys( levels ) ),
		currentLogLevel,
		log = {};

	log.setLevel = applyLevel;

	applyLevel( config.logLevel );

	function applyLevel( logLevel ){
		currentLogLevel = logLevel;
		_.map( levels, function( level, index ){
			if( index >= getLevelIndex( currentLogLevel ) ){
				log[ level ] = function(){
					if( config.logStringify ){
						console[ level ].apply( console, _.map( _.toArray( arguments ), formatLogValue ) );
					}
					else {
						console[ level ].apply( console, arguments );
					}
				};
			}
			else{
				log[level] = function(){}
			}
		} );

	}

	log.c = function( service ){
		var
			instance = {},
			minServiceLength = 20;
		_.map( levels, function( level ){
			instance[ level ] = function(){
				if ( currentLogLevel == 'none' ){
					return;
				}
				var args = _.toArray( arguments );
				args.unshift( _str.rpad( '[' + service + ']', minServiceLength ) );
				log[level].apply( null, args );
			};
		} );
		return instance;
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

	function formatLogValue( value ){
		return  _str.truncate(
			( _.isObject( value )
				? JSON.stringify( value )
				: String( value ).replace( /\n+/g, ' ' )
				),
			config.logEntryMaxLength
		);

	}

	return log;
} );
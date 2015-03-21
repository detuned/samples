define( 'core/broadcaster', [ 'jquery', 'underscore', 'core/utils' ], function( $, _, utils ){
	var
		broadcaster = {},
		channels = {};

	broadcaster.listen = function( channelId, callback, defaultValue ){
		Channel( channelId ).listen( callback, defaultValue );
	};

	broadcaster.unListen = function( channelId, callback ){
		Channel( channelId ).unListen( callback );
	};

	broadcaster.broadcast = function( channelId, value ){
		Channel( channelId ).broadcast( value );
	};

	broadcaster.parseNotation = function( name, value, callback ){
		if( ! value && String( value ) !== '0' ){
			return null;
		}
		var
			parts = String( value ).split( ':' ),
			channelId, defaultValue;
		if( ! utils.isJson( value ) && parts.length > 1 ){
			defaultValue = parts.shift() || undefined;
			channelId = parts.join( ':' ) || name;
			broadcaster.listen( channelId, callback, defaultValue );
		}
		else {
			callback( value );
		}
	};

	function Channel( channelId ){
		if( channels[ channelId ] ){
			return channels[ channelId ];
		}
		var
			listeners = [],
			value;
		channels[ channelId ] = {
			listen    : function( callback, defaultValue ){
				listeners.push( {
					callback : callback
				} );
				if( ! _.isUndefined( value ) ){
					callback( value );
				}
				else if( ! _.isUndefined( defaultValue ) ){
					callback( defaultValue );
				}
			},
			unListen  : function( callback ){
				listeners = _.filter( listeners, function( item ){
					return item.callback !== callback;
				} );
			},
			broadcast : function( newValue ){
				value = newValue;
				_.each( listeners, function( item ){
					item.callback( newValue );
				} )
			}
		};
		return channels[ channelId ]
	}

	$( document ).on( 'xCoreBroadcast', function ( event, data ){
		if ( ! _.isUndefined( data.channel ) && ! _.isUndefined( data.value ) ){
			broadcaster.broadcast( data.channel, data.value );
		}
	} );

	return broadcaster;
} );
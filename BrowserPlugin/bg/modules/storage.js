define( 'storage', [
	'underscore',
	'jquery',
	'config',
	'log'
], function( _, $, config, _log ){
	var
		storage = {},
		defaultName = config.storageField,
		engine = chrome.storage[ config.storageType || 'local' ],
		instances = {},
		log = _log.c( 'storage' );

	function StorageInstance( name ){
		var
			instance = {},
			all;

		if( instances[name] ){
			return instances[name];
		}

		log.debug( 'init type=', config.storageType, ', namespace=', name );
		instance.get = function( key ){
			var defer = $.Deferred();
			log.debug( 'get', key );
			getAll( function( res ){
				if( ! res || _.isUndefined( res[key] ) ){
					log.info( 'didn\'t find', key, 'in', name, ':', res );
					defer.reject();
				}
				else {
					defer.resolve( res[key] );
				}
			} );
			return defer.promise();
		};

		instance.set = function( key, value ){
			var defer = $.Deferred();
			log.debug( 'set', key, ':', value );
			getAll( function( res ){
				if( _.isObject( key ) ){
					_.extend( res, key );
				}
				else {
					res[key] = value;
				}
				save().then( defer.resolve, defer.reject );
			} );
			return defer.promise();
		};

		instance.remove = function( key ){
			var defer = $.Deferred();
			log.debug( 'remove', key );
			getAll( function( res ){
				var setRes = {};
				res = res || {};
				delete res[key];
				setRes[name] = res;
				save().then( defer.resolve, defer.reject );
			} );
			return defer.promise();
		};

		function save(){
			var
				defer = $.Deferred(),
				setRes = {};
			setRes[name] = all;
			engine.set( setRes, defer.resolve );
			return defer.promise();
		}

		function getAll( callback ){
			if( all ){
				callback( all );
			}
			else {
				engine.get( name, function( res ){
					all = ( res || {} )[name] || {};
					callback( all );
				} );
			}
		}

		return instances[name] = instance;
	}

	storage.getInstance = function( name ){
		return StorageInstance( config.storageFieldsPrefix + name );
	};

	storage.get = function( key ){
		var
			p = key.split( '.' ),
			name = p.length > 1
				? config.storageFieldsPrefix + p.shift()
				: defaultName;
		return StorageInstance( name ).get( p.join( '.' ) );
	};

	storage.set = function( key, value ){
		var
			p = key.split( '.' ),
			name = p.length > 1
				? config.storageFieldsPrefix + p.shift()
				: defaultName;
		return StorageInstance( name ).set( p.join( '.' ), value );
	};

	storage.remove = function( key ){
		var
			p = key.split( '.' ),
			name = p.length > 1
				? config.storageFieldsPrefix + p.shift()
				: defaultName;
		return StorageInstance( name ).remove( p.join( '.' ) );
	};

	return storage;
} );
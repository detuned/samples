define( 'api/xhr', [
	'underscore',
	'jquery',
	'config',
	'log'
], function( _, $, config, log ){
	var
		xhr = {};

	log = log.c( 'xhr' );

	function decodeUrl( url ){
		return url.toString()
			.replace( /^\/\/api\//i, config.host + '/' )
	}

	function xhrRequest( url, data, method, options ){
		var defer = $.Deferred();
		log.log( 'request', method, url, data );
		$.ajax( _.extend( {
			url      : decodeUrl( url ),
			data     : data,
			type     : method,
			dataType : 'json'
		}, options || {} ) ).then( function( res ){
				log.log( 'request success', method, url, data, 'result:', res );
				defer.resolve( res );
			}, function( res ){
				log.warn( 'request error', method, url, data, 'result:', res );
				defer.reject( res );
			} );
		return defer.promise();
	}

	xhr.postRequest = function( url, data, options ){
		return xhrRequest( url, data, 'POST', options );
	};

	xhr.getRequest = function( url, data, options ){
		return xhrRequest( url, data, 'GET', options );
	};

	return xhr;
} );
angular.module( 'lite' )
	.service( 'apiService', [
		'$q',
		'$http',
		'configService',
		function( $q, $http, configService ){
			var apiService = {};

			/**
			 * Replace placeholders with actual values
			 * @param url
			 * @returns {string}
			 */
			function decodeUrl( url ){
				return url.toString()
					.replace( /^\/\/api\//i, configService.backendUrl + '/' );
			}

			/**
			 * Provides http request and helps to
			 * abstract us from details like API url composing,
			 * server response parsing etc
			 * @param options
			 */
			apiService.request = function( options ){
				var
					defer = $q.defer();
				options = _.defaults( options, {
					method          : 'GET',
					url             : '/',
					withCredentials : true
				} );

				options.url = decodeUrl( options.url );

				$http( options ).then(
					function( res ){
						if( res.data ){
							defer.resolve( res.data );
						}
						else {
							defer.reject( res );
						}
					},
					defer.reject
				);
				return defer.promise;
			};

			/**
			 * A convenient version of request for GET request
			 * @param url
			 * @param [params]
			 */
			apiService.requestGet = function( url, params ){
				//                 origin_lang : $rootScope.lang || 'ru'
				return apiService.request( {
					method : 'GET',
					url    : url,
					params : params || {}
				} )
			};

			/**
			 * A convenient version of request for POST request
			 * @param url
			 * @param params
			 */
			apiService.requestPost = function( url, data, options ){
				return apiService.request( angular.extend( {
					method : 'POST',
					url    : url,
					data   : data || {}
				}, options || {} ) )
			};

			return apiService;
		}] );
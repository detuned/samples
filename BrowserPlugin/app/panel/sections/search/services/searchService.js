angular.module( 'plugin' )
	.service( 'searchService', [
		'$q',
		'apiService',
		function( $q, apiService ){
			var searchService = {};

			searchService.search = function( options ){
				var defer = $q.defer();
				apiService.request( 'userPages::find', { options : options || {} } )
					.then( function( res ){
						if( angular.isArray( res.Pages ) ){
							defer.resolve( res.Pages );
						}
						else {
							defer.reject( res );
						}
					}, defer.reject );
				return defer.promise;
			};

			return searchService;
		}] );
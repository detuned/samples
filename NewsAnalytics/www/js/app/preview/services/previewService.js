angular.module( 'index' )
	.service( 'previewService', [
		'$http',
		'$log',
		'$q',
		'$window',
		'configService',
		'utilsService',
		function( $http, $log, $q, $window, configService, utilsService ){
			var previewService = {};


			previewService.getArticle = function( url ){
				var defer = $q.defer();
				$http.get(
					configService.previewDataUrl,
					{
						params : {
							url : url
						},
						cache  : configService.cachePreview
					}
				).then( function( res ){
						if ( res.data && res.data.url ){
							defer.resolve( res.data );
						}
						else{
							defer.reject( res );
						}
					}, defer.reject );
				return defer.promise;
			};

			previewService.getPreviewUrl = function ( id ){
				return utilsService.parseStringTemplate( configService.previewUrl, {
					id : $window.encodeURIComponent( id )
				});
			};


			return previewService;
		}] );
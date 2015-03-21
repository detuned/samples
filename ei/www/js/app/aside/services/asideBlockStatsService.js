angular.module( 'index' )
	.service( 'asideBlockStatsService', [
		'$q',
		'$localStorage',
		'$log',
		'configService',
		'statsService',
		function( $q, $localStorage, $log, configService, statsService ){
			var asideBlockStatsService = {};


			asideBlockStatsService.getStat = function( options ){
				var
					cache,
					now = moment().unix(),
					defer = $q.defer(),
					cacheKey;
				options = _.defaults( options || {}, {
					domain   : statsService.DOMAIN_ALL_ID,
					sections : [],
					limit    : 10
				} );

				cacheKey = [
					'asideBlockStats',
					options.domain,
					options.sections.join( ':' ),
					options.limit
				].join( '_' );

				if(
					configService.asideStatsBlockCacheTime
						&& $localStorage[cacheKey]
						&& ( cache = angular.fromJson( $localStorage[cacheKey] ) )
						&& cache.ts
						&& ( now - cache.ts ) < configService.asideStatsBlockCacheTime
					){

					$log.log( 'aside stats block: got ', cache.stats.length, ' stats from cache. Cache will be still valid for ', configService.asideStatsBlockCacheTime - ( now - cache.ts ), 's' );
					$log.debug( 'aside stats block: cache body', cache );
					defer.resolve( cache.stats );
				}
				else {
					statsService.getData( options )
						.then( function( res ){
							if( configService.asideStatsBlockCacheTime ){
								$localStorage[cacheKey] = angular.toJson( {
									stats : res,
									ts    : now
								} );
							}
							$log.log( 'aside stats block: set cache for', cacheKey , '. Cache will be valid for ', configService.asideStatsBlockCacheTime, 's' );
							$log.debug( 'aside stats block: cache body', cache );
							defer.resolve( res );
						}, defer.reject );
				}


				return defer.promise;
			};

			asideBlockStatsService.resetCache = function(){
				delete $localStorage.asideBlockStats;
			};

			return asideBlockStatsService;
		}] );
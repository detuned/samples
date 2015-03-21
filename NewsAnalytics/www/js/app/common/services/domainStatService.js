angular.module( 'index' )
	.service( 'domainStatService', [
		'$http',
		'$q',
		'configService',
		'utilsService',
		function( $http, $q, configService, utilsService ){
			var domainStatService = {};

			domainStatService.loadChart = function (){
				var defer = $q.defer();
				$http.get( configService.domainChartUrl ).then(function ( res ){
					if ( res.data.length ){
						defer.resolve( handleList( res.data ) );
					}
					else{
						defer.reject( res );
					}
				}, defer.reject );
				return defer.promise;
			};

			function handleList( list ){
				return _.map( list, function ( item ){
					item.normalizedHost = utilsService.normalizeUrl( item.domain );
					item.hostSignature = getHostSignature( item.normalizedHost );
					return item;
				});
			}

			function getHostSignature( host ){
				var
					prefix = 'host',
					subHosts = [], parts;
				if( ! host ){
					return '';
				}
				parts = host.split( '.' );
				while( parts.length > 1 ){
					subHosts.push( [prefix].concat( parts ).join( '-' ) );
					parts.shift();
				}
				return subHosts.join( ' ' );
			}

			return domainStatService;
		}] );
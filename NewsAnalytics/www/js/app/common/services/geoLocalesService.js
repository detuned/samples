angular.module( 'index' )
	.service( 'geoLocalesService', [
		'configService',
		'utilsService',
		function( configService, utilsService ){
			var
				geoLocalesService = {},
				registry = [
					{
						id    : 'world',
						title : 'World'
					},
					{
						id    : 'ru',
						title : 'Россия'
					},
					{ id      : 'nl',
						title : 'Nederland'
					},
					{
						id    : 'ua',
						title : 'Україна'
					},
					{
						id    : 'az',
						title : 'Azərbaycan'
					}
				],
				registryById = _.indexBy( registry, 'id' ),
				activeGeoLocaleId = configService.geoLocale,
				geoLocales = _( utilsService.parseCsvString( configService.geoLocales ) )
					.chain()
					.filter( function( item ){
						return item != activeGeoLocaleId
					} )
					.map( getGeoLocale )
					.compact()
					.value();

			geoLocalesService.getGeoLocalesOrdered = function(){
				return geoLocales;
			};
			geoLocalesService.getActiveGeoLocale = function (){
				return getGeoLocale( activeGeoLocaleId );
			};
			geoLocalesService.getGeoLocale = getGeoLocale;

			function getGeoLocale( id ){
				return id && registryById[id]
					? angular.copy( registryById[id] )
					: null;
			}

			return geoLocalesService;
		}] );
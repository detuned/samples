angular.module( 'index' )
	.service( 'themesService', [
		'$log',
		'configService',
		'utilsService',
		function( $log, configService, utilsService ){
			var
				themesService = {
					THEME_ALL_ID : 'all'
				},
				registry = [
					{ id : themesService.THEME_ALL_ID, title : 'All categories', value : '' },
					{ "id" : "News", "title" : "News" },
					{ "id" : "Politics", "title" : "Politics" },
					{ "id" : "Economics", "title" : "Economics" },
					{ "id" : "Sports", "title" : "Sports" },
					{ "id" : "Blogs", "title" : "Blogs" },
					{ "id" : "Fun", "title" : "Fun" },
					{ "id" : "Humor", "title" : "Humor" },
					{ "id" : "Science", "title" : "Science" },
					{ "id" : "Health", "title" : "Health" },
					{ "id" : "Family", "title" : "Family" },
					{ "id" : "Culture", "title" : "Culture" },
					{ "id" : "Society", "title" : "Society" },
					{ "id" : "Accidents", "title" : "Accidents" }
				],
				registryById = {},
				registryByIdLc = {};

			resetRegistries();

			if( configService.themesOrder ){
				(function(){
					var
						themesOrder = utilsService.parseCsvString( configService.themesOrder ),
						newRegistry = [];
					angular.forEach( themesOrder, function( id ){
						var theme;

						if( id === '*' ){
							newRegistry = newRegistry.concat( _.filter( registry, function( item ){
								return _.indexOf( themesOrder, item.id ) < 0
							} ) );
							return;
						}

						theme = registryById[id] || registryByIdLc[id];
						if( theme ){
							newRegistry.push( theme );
						}
						else {
							$log.warn( 'themesService: unknown theme', id, ' in themes order', configService.themesOrder );
						}
					} );
					registry = newRegistry;
					resetRegistries();
				})();
			}

			themesService.getAllThemes = function( skipAll ){
				var res = angular.copy( registry );
				if( skipAll ){
					res.shift();
				}
				return res;
			};

			themesService.getTheme = function( id ){
				var theme;
				return id && ( theme = registryById[id] || registryByIdLc[id] )
					? angular.copy( theme )
					: null;
			};

			themesService.parseThemesListStr = function( str ){
				var res = _.compact( _.map( utilsService.parseCsvString( str ), themesService.getTheme ) );
				if( res.length ){
					// List is valid when it contains at least one valid theme
					return res;
				}
				return null;
			};

			themesService.composeThemesListStr = function( themes ){
				return _.filter( _.keys( themes ),function( item ){ return themes[item] } ).join( ',' );
			};

			function resetRegistries(){
				registryById = _.indexBy( registry, 'id' );
				registryByIdLc = _.indexBy( _.map( registry, function( item ){
					item.idLc = item.id.toLocaleLowerCase();
					return item;
				} ), 'idLc' );
			}

			return themesService;
		}] );
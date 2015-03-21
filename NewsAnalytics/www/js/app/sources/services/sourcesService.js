angular.module( 'index' )
	.service( 'sourcesService', [ 'utilsService', function( utilsService ){
		var
			sourcesService = {
				SOURCE_ALL_ID : 'all'
			},
			registry = [
				{
					id    : sourcesService.SOURCE_ALL_ID,
					title : 'All social networks',
					value : ''
				},
				{
					id    : 'fb',
					value : '2',
					title : 'Facebook',
					badge : 'Facebook'
				},
				{
					id    : 'gplus',
					value : '5',
					title : 'Google+',
					badge : 'Google+'
				},
				{
					id    : 'twitter',
					value : '6',
					title : 'Twitter',
					badge : 'Twitter'
				}
			],
			registryById = _.indexBy( registry, 'id' );

		sourcesService.getAllSources = function( skipAll ){
			var res = angular.copy( registry );
			if( skipAll ){
				res.shift();
			}
			return res;
		};

		sourcesService.getSource = function( id ){
			return id && registryById[id]
				? angular.copy( registryById[id] )
				: null;
		};

		sourcesService.parseSourcesListStr = function( str ){
			var res = _.compact( _.map( utilsService.parseCsvString( str ), sourcesService.getSource ) );
			if( res.length ){
				// List is valid when it contains at least one valid source
				return res;
			}
			return null;
		};

		sourcesService.composeSourcesListStr = function( sources ){
			return _.filter( _.keys( sources ),function( item ){ return sources[item] } ).join( ',' );
		};

		return sourcesService;
	}] );
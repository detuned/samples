angular.module( 'index' )
	.service( 'periodsService', [function(){
		var
			periodsService = {
				PERIOD_NOW_ID    : 1,
				PERIOD_NOW_ALIAS : 'all'
			},
			registry = [
				{
					id         : periodsService.PERIOD_NOW_ID,
					title      : 'For now',
					shortTitle : 'Now',
					alias      : periodsService.PERIOD_NOW_ALIAS
				},
				{
					id         : 2,
					title      : 'For this hour',
					shortTitle : 'hour',
					alias      : 'hour'
				},
				{
					id         : 3,
					title      : 'For this day',
					shortTitle : 'day',
					alias      : 'day'
				},
				{
					id         : 4,
					title      : 'For this week',
					shortTitle : 'week',
					alias      : 'week'
				}
			],
			registryById = _.indexBy( registry, 'id' ),
			registryByAlias = _.indexBy( registry, 'alias' ),
			rangeStrFormat = 'YYYYMMDD';

		angular.forEach( registry, function( item, index ){
			item.index = index;
		} );

		periodsService.getAllPeriods = function(){
			return angular.copy( registry );
		};

		periodsService.getPeriod = function( id ){
			return id && registryById[id]
				? angular.copy( registryById[id] )
				: registryByAlias[ id ]
				? angular.copy( registryByAlias[ id ] )
				: null;
		};

		periodsService.composeRangeStr = function( range ){
			return [ range.from.format( rangeStrFormat ), range.to.format( rangeStrFormat )  ].join( '-' );
		};

		periodsService.parseRangeStr = function( str ){
			var
				parts,
				res = {};
			if( angular.isString( str ) && ( parts = str.split( '-' ) ) && parts.length == 2 ){
				res.from = moment( parts[0], rangeStrFormat );
				res.to = moment( parts[1], rangeStrFormat );
				if( res.from.isValid() && res.to.isValid() && res.to.isAfter( res.from ) ){
					return res;
				}
			}
			return null;
		};

		return periodsService;
	}] );
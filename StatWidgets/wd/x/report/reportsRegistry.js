define( 'report/reportsRegistry', [ 'underscore' ], function( _ ){
	var
		defaultReport = {
			by : 'hour'
		},
		registry = [
			{
				id     : 'online',
				title  : 'Онлайн',
				report : 'online',
				column : 'visitors',

				type      : 'histogram',
				showTitle : false,
				vz        : {
					caption   : 'посетитель онлайн, посетителя онлайн, посетителей онлайн',
					caption_1 : 'за 5 минут',
					caption_2 : 'за 15 минут'
				}
			}
		],
		registryById = _.indexBy( registry, 'id' );

	_.each( registry, function( item ){
		_.extend( item, defaultReport );
	} );

	return {
		getReport : function( id ){
			return registryById[id];
		}
	}
} );
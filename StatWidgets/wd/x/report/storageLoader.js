define( 'report/storageLoader', [ 'jquery', 'underscore', 'xcore', 'xconfig', 'report/reportsRegistry', 'moment' ], function( $, _, xcore, xconfig, reportsRegistry, moment ){

	var
		storageLoader = {};

	storageLoader.load = function( settings ){
		var
			defer = $.Deferred(),
			report = reportsRegistry.getReport( settings.report ),
			loadData = report.loadData,
			req = [],
			res = [],
			num = 0;
		_.map( loadData.sets, function( setData, setIndex ){
			return loadSet( setData, settings ).then(function ( data ){
				res[setIndex] = data;
				num ++;
				if ( num >= loadData.sets.length ){
					res = parseResults( res, loadData.sets );
					defer.resolve( res );
				}
			}, defer.reject );
		} );
		return defer.promise();
	};

	function loadSet( setData, settings ){
		var
			defer = $.Deferred(),
			url = getLoadSetUrl( setData, settings );

		$.ajax( url, {
			type : 'GET',
			headers : {
				'X-Requested-With' : 'XMLHttpRequest'
			},
			xhrFields: {
				withCredentials: true
			}
		} ).then(function ( res ){
				if ( res && res.report ){
					defer.resolve( res );
				}
				else{
					defer.reject( res );
				}
		}, defer.reject );
		return defer.promise();
	}

	function getLoadSetUrl( setData, settings ){
		var
			url = xconfig.storageDataHost; //Fake for demo
		return url;
	}

	function parseResults( sets, setsData ){
		return _.chain(sets[0].report.item).map( function( item, index ){
			if( ! item.v || item.v === '-' ){
				return;
			}
			var
				point = {};

			point.Ts = moment( item.v ).unix();
			point.Rs = _.map( sets, function ( sset, ssetIndex ){
				return {
					Count : sset.report.item[index].c[0],
					Section : setsData[ssetIndex].title
				};
			});

			return point;

		} ).compact().value();
	}

	return storageLoader;
} );
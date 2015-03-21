define( 'report/dataLoader', [
	'jquery',
	'underscore',
	'xcore',
	'xconfig',
	'report/reportsRegistry',
	'report/storageLoader'
], function( $, _, xcore, xconfig, reportsRegistry, storageLoader ){

	var
		listeners = [],
		transports = {},
		apiParsers = {},
		minErr = xcore.minErr( 'dataLoader' ),
		detalisationMap = {
			hour : 'hourly',
			day  : 'daily'
		},
		config = _.extend( {
			report       : null,
			counter      : null,
			apiVersion   : 1,
			reportFamily : '1000',
			url          : '/report/{counter}/{by}/{report}/{column}',
			transport    : 'xhr_poll'
		}, xconfig ),
		extLoaders = {
			storage : storageLoader
		};

	function load( settings ){
		settings = _.defaults( settings, config );
		var report = reportsRegistry.getReport( settings.report );
		if( report.loader ){
			if( ! extLoaders[report.loader] ){
				minErr( 'unknown loader ' + report.loader + ' for report' + settings.report );
			}
			return extLoaders[report.loader].load( settings );
		}
		return $.ajax( {
			url       : getUrl( settings ),
			method    : 'GET',
			dataType  : 'json',
			xhrFields : {
				withCredentials : true
			}
		} );
	}

	function getUrl( settings ){
		var
			report = reportsRegistry.getReport( settings.report ),
			vars = _.extend(
				_.omit( settings, 'url' ),
				_.pick( report, 'by', 'reportFamily', 'column', 'report' ),
				_.pick( settings, 'by', 'column' )
			),
			url;
		vars.by = vars.by
			? detalisationMap[ vars.by ]
			: '';
		url = settings.dataHost + xcore.utils.parseStringTemplate( settings.url, vars );
		return url
	}

	function listen( settings, callback ){
		var listener;
		settings = _.defaults( settings, config );
		if( ! ( settings.transport in transports ) ){
			throw minErr( 'unknown load engine ' + settings.transport );
		}
		listener = {
			settings : settings,
			callback : callback
		};
		listener.transport = transports[ settings.transport ]( _.extend( {}, listener ) );
		listener.transport.start();
		listener.unListen = _.partial( unListen, callback );
		listeners.push( listener );
		return listener;
	}

	function unListen( callback ){
		listeners = _.filter( listeners, function( listener ){
			if( listener.callback !== callback ){
				return true;
			}
			listener.transport.stop();
			return false;
		} );
	}

	transports.xhr_poll = function( listener ){
		var
			isStarted = true,
			timer;

		function start(){
			if( listener ){
				isStarted = true;
				tick();
			}
		}

		function stop(){
			isStarted = false;
			clearTimeout( timer );
		}

		function tick(){
			clearTimeout( timer );
			load( listener.settings )
				.done( function( res ){
					if( apiParsers[listener.settings.apiVersion] && apiParsers[listener.settings.apiVersion].parse ){
						res = apiParsers[listener.settings.apiVersion].parse( res, listener.settings );
					}
					listener.callback( res );
					return res;
				} )
				.always( function(){
					if( listener.settings.updateInterval ){
						timer = setTimeout( tick, listener.settings.updateInterval * 1000 );
					}
				} );
		}

		return {
			start : start,
			stop  : stop
		}
	};

	apiParsers['1'] = {
		parse : function( res, settings ){
			var
				report = settings && settings.report
					? reportsRegistry.getReport( settings.report )
					: null,
				parser,
				sectionParsers = {};

			sectionParsers.url = function( str ){
				//This report contains urls in Section fields
				//and they're encoded by splitting with \t
				//and move scheme to the last position. So we need to decode them
				var
					rawUrl = str || '',
					r;
				if( rawUrl.length > 0 ){
					r = rawUrl.split( "\t" );
					str = r[3] + '://' + r[0] + r[1];
				}
				return str;
			};

			sectionParsers.city = function( str ){
				if( str ){
					str = String( str ).split( "\t" ).shift();
				}
				return str;
			};

			if( report && report.sectionFormat && ( parser = sectionParsers[ report.sectionFormat ] ) ){
				res = _.map( res, function( item ){
					if( _.isArray( item.Rs ) ){
						item.Rs = _.map( item.Rs, function( i ){
							i.Section = parser( i.Section );
							return i;
						} );
					}
					return item;
				} );
			}

			return res;
		}
	};


	return {
		listen   : listen,
		unListen : unListen
	};
} );
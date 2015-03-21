;
(function( global ){
	var
		familyName = 'x';

	global.StatWidget = global.StatWidget || {};
	global.StatWidget[ familyName ] = global.StatWidget[ familyName ] || {};

	var
		commonConfig = global.StatWidget[ familyName ][ 'config' ] || {},
		familyConfig = {
			host                           : '',
			familyPath                     : '/w/x',
			commonLibPath                  : '/w/lib',
			familyContainerClass           : 'osb-wx',
			familyContainerClassPrefix     : 'osb-wx-m-',
			familyRegisteredContainerClass : 'osb-wx-m-registered',

			//Lite defaults
			dataHost                       : '',
			storageDataHost                : '',

			//Growler defaults
			growlerDataHost                : '/stats'
		},
		isRuntime;

	for( var i in commonConfig ){
		if( commonConfig.hasOwnProperty( i ) ){
			familyConfig[i] = commonConfig[i];
		}
	}
	var
		coreLibs = {
			jquery     : function( config ){
				var
					hasJquery = ! ! ( global.jQuery && global.jQuery.fn && global.jQuery.fn.jquery ),
					isJqueryInconsistent = hasJquery && ( ! ! global.jQuery.fn.jquery.match( /^1\.[0-4](\.|$)/ ) );

				if( ! hasJquery || isJqueryInconsistent ){
					config.paths.jquery = familyConfig.host + familyConfig.commonLibPath + '/jquery'
				}
				else {
					define( 'jquery', [], function(){
						return global.jQuery;
					} );
				}

				return function( $ ){
					if( isJqueryInconsistent ){
						$.noConflict( true );
					}
				}

			},
			underscore : function( config ){
				var
					instance = global.__ || global._,//local site's name
					isExists = ! ! ( instance && instance.VERSION ),
					isInconsistent = ! instance || parseInt( instance.VERSION ) < 1;
//					isInconsistent = parseInt( instance.VERSION.toString().replace(/[^0-9]/g, '') ) < 100;
				if( ! isExists || isInconsistent ){
					config.paths.underscore = familyConfig.host + familyConfig.commonLibPath + '/underscore'
				}
				else {
					define( 'underscore', [], function(){
						return instance;
					} );
				}

				return function( _ ){
					if( isInconsistent ){
						_.noConflict();
					}
				}
			},

			highcharts : function( config ){
				var instance = global.Highcharts;
				if( ! instance ){
					config.paths.highcharts = familyConfig.host + familyConfig.commonLibPath + '/highcharts';
					config.shim.highcharts = {
						exports : 'Highcharts'
					}
				}
				else {
					define( 'highcharts', [ 'jquery' ], function(){
						return global.Highcharts;
					} );
				}
				return function(){
				}
			}
		};


	function loadJs( src, onload ){
		var d = document, t = d.documentElement.firstChild, s = d.createElement( 'script' );
		s.type = 'text/javascript';
		s.src = src;
		s.setAttribute( 'async', 'true' );
		s.onload = onload;
		t.insertBefore( s, t.firstChild );
	}

	/**
	 * Could be fired only once
	 */
	function run(){
		if( isRuntime ){
			return;
		}
		isRuntime = true;
		var
			requireConfig = {
				baseUrl : familyConfig.host + familyConfig.familyPath,
				paths   : {
					'sockjs'     : familyConfig.host + familyConfig.commonLibPath + '/sockjs',
					'moment'     : familyConfig.host + familyConfig.commonLibPath + '/moment',
					'handlebars' : familyConfig.host + familyConfig.commonLibPath + '/handlebars'
				},
				shim    : {}
			},
			requirePlugins = [ 'css', 'goog', 'async', 'propertyParser', 'text' ],
			coreLibsNames = [],
			coreLibsInit = [];


		for( var i = 0; i < requirePlugins.length; i ++ ){
			requireConfig.paths[ requirePlugins[i] ] = [ familyConfig.host, familyConfig.commonLibPath,
				'/requirejs-plugins/', requirePlugins[i] ].join( '' );
		}

		for( var name in coreLibs ){
			if( coreLibs.hasOwnProperty( name ) ){
				coreLibsNames.push( name );
				coreLibsInit.push( coreLibs[name]( requireConfig ) );
			}
		}

		//XXX What about requirejs noConflict?
		global.require.config( requireConfig );

		define( 'xconfig', [], function(){
			return familyConfig;
		} );

		require( coreLibsNames, function(){
			var
				args = Array.prototype.slice.call( arguments, 0 ),
				instances = {};
			for( var i = 0; i < args.length; i ++ ){
				coreLibsInit[i]( args[i] );
				instances[ coreLibsNames[i] ] = args[i];
			}
			initNewWidgets( instances.jquery );
			global.StatWidget[ familyName ].register = function(){
				initNewWidgets( instances.jquery );
			}
		} );

	}

	/**
	 * Could be fired as many times as we need
	 * @param $ jQuery
	 * @param [rootElement]
	 */
	function initNewWidgets( $, rootElement ){
		$( rootElement || document )
			.find( '.' + familyConfig.familyContainerClass + ':not(.' + familyConfig.familyRegisteredContainerClass + ')' )
			.each( function( index, element ){
				var
					widgetSettings = {
						element : $( element ).addClass( familyConfig.familyRegisteredContainerClass )
					},
					widgetName = widgetSettings.element.data( 'widget' ),
					widgetClass = familyConfig.familyContainerClass + '-' + widgetName,
					skinName = widgetSettings.element.data( 'skin' );
				if( widgetName ){
					widgetSettings.element.addClass(
						familyConfig.familyContainerClassPrefix + 'name-' + widgetName + ' ' +
							widgetClass
					);
				}
				if( skinName ){
					widgetSettings.element.addClass(
						widgetClass + '-m-skin-' + skinName
					);
				}
				require( [ 'xcore', [ widgetName, widgetName ].join( '/' ) ], function( xcore, widgetFabric ){
					xcore.registerWidget( widgetName, widgetFabric.create( widgetSettings ) );
					if( ! global.StatWidget[ familyName ].initialized ){
						global.StatWidget[ familyName ].initialized = true;
					}
				}, function( err ){
					var failedModule = err.requireModules && err.requireModules[0];
					if( 'xcore' === failedModule ){
						console.error( '[core] Error loading xcore: ' + err );
					}
					else {
						console.error( '[core] Error loading widget ' + widgetName + ': ' + err );
					}
				} );
			} );
	}

	if( global.requirejs && global.define && global.require ){
		run();
	}
	else {
		loadJs( familyConfig.host + familyConfig.commonLibPath + '/require.js', run );
	}

})( this );
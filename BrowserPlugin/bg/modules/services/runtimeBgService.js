define( 'services/runtimeBgService', [
	'underscore',
	'jquery',
	'config',
	'log',
	'storage',
	'utils'
], function( _, $, config, log, storage, utils ){
	var
		manifest = chrome.runtime.getManifest(),
		timers = utils.timersManager(),
		runtimeBgService = {},
		platform = config.platform || utils.getPlatformSignature();

	manifest.assemblyVersion = ( config.assembly ? config.assembly + '.' : '' )
		+ manifest.version
		+ ( platform ? '.' + platform : '' );


	log = log.c( 'runtimeService' );

	log.log( 'run app version', manifest.assemblyVersion );

	runtimeBgService.manifest = manifest;
	runtimeBgService.executeScriptInAllTabs = executeScriptInAllTabs;
	runtimeBgService.insertCssToAllTabs = insertCssToAllTabs;
	runtimeBgService.reloadEmptyTabs = reloadEmptyTabs;
	runtimeBgService.injectToAllTabs = injectToAllTabs;

	runtimeBgService.isPanelVisible = function(){
		var defer = $.Deferred();
		storage.get( 'panelVisible' ).then( function( res ){
			defer.resolve( ! ! res );
		}, function(){
			defer.resolve( true );
		} );
		return defer.promise();
	};

	runtimeBgService.togglePanelVisibility = function(){
		var defer = $.Deferred();
		log.log( 'toggling panel visibility...' );
		storage.get( 'panelVisible' ).then( function( res ){
			applyNewState( ! res );
		}, function(){
			//If field has not stored yet it means
			applyNewState( false );
		} );

		function applyNewState( newState ){
			log.log( 'apply new panel visibility state', newState );
			storage.set( 'panelVisible', newState ).then( function(){
				defer.resolve( {
					isPanelVisible : newState
				} );
			} );
		}

		return defer.promise();
	};


	function getAllTabs(){
		var defer = $.Deferred();
		chrome.tabs.query( {}, function( tabs ){
			if( _.isArray( tabs ) ){
				defer.resolve( _.filter( tabs, function( tab ){
					//Excluding chrome service pages
					//TODO use query's url param to filter
					return ! /^chrome(\-.+)?:\/\//.test( tab.url );
				} ) );
			}
			else {
				defer.reject( tabs );
			}
		} );
		return defer.promise();
	}

	function executeScriptInNativeTab( tabId, details ){
		var defer = $.Deferred();
		log.info( 'execute script for tab', tabId, 'details=', details );
		try{
			chrome.tabs.executeScript( tabId, details, function( res ){
				defer.resolve( res );
			} );
		} catch( e ) {
			defer.reject();
		}
		return defer.promise();
	}

	/**
	 * Inject JS and/or CSS files to all tabs
	 * Handle tabs one by one and wait a little before next step
	 * @param details
	 * @returns {*}
	 */
	function injectToAllTabs( details ){
		var
			defer = $.Deferred(),
			startTime = (new Date).getTime();

		getAllTabs().then( function( tabs ){
			var
				tabsNum = tabs.length,
				handleNextTab = function(){
					if( ! tabs.length ){
						log.info( 'files injecting process finished for ', tabsNum, 'tabs which took', ( new Date ).getTime() - startTime, 'ms' );
						defer.resolve();
						return;
					}
					var
						tab = tabs.shift(),
						processes = [];
					if( details.js ){
						processes.push( executeScriptInNativeTab( tab.id, { file : details.js } ) );
					}
					if( details.css ){
						processes.push( insertCssToNativeTab( tab.id, { file : details.css } ) );
					}
					$.when( processes ).always( function(){
						timers.setTimer( 'injectTab', handleNextTab, config.tabInjectingDelay );
					} );
				};
			log.log( 'start files injecting process for', tabsNum, 'tabs' );
			handleNextTab();
		}, defer.reject );
		return defer.promise();
	}

	function executeScriptInAllTabs( details ){
		var
			defer = $.Deferred();

		getAllTabs().then( function( tabs ){
			$.when.apply( $, _.map( tabs, function( tab ){
				return executeScriptInNativeTab( tab.id, details );
			} ) ).then( defer.resolve, defer.reject );
		}, defer.reject );
		return defer.promise();
	}

	function insertCssToNativeTab( tabId, details ){
		var defer = $.Deferred();
		log.info( 'insert css to tab', tabId, 'details=', details );
		try{
			chrome.tabs.insertCSS( tabId, details, function( res ){
				defer.resolve( res );
			} );
		} catch( e ) {
			defer.reject();
		}
		return defer.promise();
	}

	function insertCssToAllTabs( details ){
		var
			defer = $.Deferred();
		getAllTabs().then( function( tabs ){
			$.when.apply( $, _.map( tabs, function( tab ){
				return insertCssToNativeTab( tab.id, details );
			} ) ).then( defer.resolve, defer.reject );
		}, defer.reject );
		return defer.promise();
	}

	function reloadTab( tabId ){
		var defer = $.Deferred();
		log.log( 'reload tab', tabId );
		chrome.tabs.reload( tabId, defer.resolve );
		return defer.promise();
	}

	function reloadEmptyTabs(){
		var
			defer = $.Deferred();
		chrome.tabs.query( { url : 'chrome://newtab/' }, function( tabs ){
			if( tabs && tabs.length ){
				log.log( 'reload ', tabs.length, 'empty tab(s)' );
				$.when.apply( $, _.map( tabs, function( tab ){
					return reloadTab( tab.id );
				} ) ).then( defer.resolve, defer.reject );

			}
		} );
		return defer.promise();
	}

	return runtimeBgService;
} );
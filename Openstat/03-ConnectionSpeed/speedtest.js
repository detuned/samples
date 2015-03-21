/**
 * SpeedTest determines the user's incoming internet connection speed.
 * For this purpose it's measuring the time for downloading files of different sizes
 * Files {1,10} must be placed in the same domain and have the size <code>sizeStep * N</code>,
 *      where
 *          sizeStep — adjustable param, valued 10 by default
 *          N — number (name) of the file
 *
 * Created in 2012 for webvybory2012.ru —
 * official site of Internet Broadcasting of the
 * Russia's President Elections of 2012th
 *
 * @param {Object} settings
 *            requestsNum:         {Number} requests number (should not be greater than the number of files)
 *            sizeStep:            {Number} size of smallest file and the difference between the sizes of any adjacent
 *            minRequestTime:      {Number} min time for downloading file;
 *                                      if loaded faster make step to the next larger file
 *            trackByOpenstat:     {Boolean} flag means allowing to track results by Openstat
 *                                      (required Openstat counter on the page setting up for the 'AJAX sites'
 *                                      http://wiki.openstat.ru/Openstat/AddAjaxTracking)
 *            url:                 {String} absolute or related path to dir contained downloading files
 *            fileExt:             {String} downloading files extension
 *
 * @return {Object}
 *
 * @example
 *         <code>
 *
 *             // Creating SpeedTest instance and setting it up
 *             var st = SpeedTest( {
 * 				url : '/files/'
 * 				} );
 *
 *             // Defining 'progress' event callback
 *             st.onProgress(function( data ) {
 * 				    console.log( 'Степень выполнения: ' , data.progress , '%'  );
 * 			    });
 *
 *             // Defining 'complete' event callback
 *             st.onComplete(function( data ) {
 * 				    console.log( 'Connection speed is ' , data.speed , 'KB/s' );
 * 			    });
 *
 *             // Defining 'error' callback
 *             st.onComplete(function( data ) {
 * 				    console.error( 'Error occured' );
 * 				});
 *         </code>
 *
 *
 * @requires jQuery v.1.7+
 * @author Maxim Smirnov <detunedtv@gmail.com>
 */
function SpeedTest( settings ){
	var
		/**
		 * Service name of event <code>progress</code>
		 *
		 * @type {String}
		 */
			EVENT_PROGRESS = 'progress',
		/**
		 * Service name of the event <code>complete</code>
		 *
		 * @type {String}
		 */
			EVENT_COMPLETE = 'complete',
		/**
		 * Service name of the event <code>error</code>
		 *
		 * @type {String}
		 */
			EVENT_ERROR = 'error',
		/**
		 * Service element used to bind events and queues. Not visible on the page.
		 *
		 * @type {jQuery}
		 */
			_$elem,
		/**
		 * Settings. Could be overriden by user
		 *
		 * @type {Object}
		 */
			_settings = {
			requestsNum     : 10,
			sizeStep        : 80000,
			minRequestTime  : 500,
			trackByOpenstat : true,
			url             : './files/',
			fileExt         : 'bin'
		},
		/**
		 * Service object to store listeners
		 *
		 * @type {Object}
		 */
			_listeners = {},
		/**
		 * Service object to store events params
		 *
		 * @type {Object}
		 */
			_eventsData = {},
		/**
		 * Binds listener to the particular event type
		 *
		 * @param {String} e Event name
		 * @param {Function) ls Listener
		 */
			_bind = function( e, ls ){
			if ( ! ( e in _listeners ) ){
				_listeners[ e ] = [];
			}
			_listeners[ e ] = ls;
			if ( e in _eventsData ){
				ls.apply( this, [ _eventsData[ e ] ] );
			}
		},
		/**
		 * Notifies all listener about event occurring
		 *
		 * @param {String} Имя события
		 */
			_trigger = function( e ){
			if ( e in _listeners ){
				for ( var i = 0, l = _listeners[ e ].length; i < l; i ++ ){
					_listeners[ e ].apply( this, Array.prototype.slice.call( arguments, 1 ) );
				}
			}
			_eventsData[ e ] = arguments[ 1 ];
		},
		/**
		 * Resets all service objects
		 */
			_reset = function(){
			_eventsData = {};
			_$elem.clearQueue();
		},
		/**
		 * Send given vars to the Openstat by counter placed on the page
		 *
		 * @param {Object} vars: передаваемые параметры
		 */
			_trackByOpenstat = function( vars ){
			if ( window.o && window.o.push ){
				window.o.push( {
					url  : location.pathname,
					vars : vars
				} );
			}
		},
		/**
		 * Downloads files of different sizes and noting the time that it took
		 * When finished determines inner connection speed and triggers 'complete' event
		 */
			_download = function(){
			var
				results = [],
				_file = 1;

			for ( var i = 0; i < _settings.requestsNum; i ++ ){
				_$elem.queue( function(){
					var
						size = _settings.sizeStep * _file,
						begin = (new Date()).getTime();
					console.log( 'file ' + _file );
					$.ajax( {
							url      : [ _settings.url , '/' , _file , '.' , _settings.fileExt ].join( '' ),
							data     : { r : Math.random() },
							dataType : 'text',
							success  : function(){
								var
									time = (new Date()).getTime() - begin;
								results.push( size * 8 / time );
								if ( time < _settings.minRequestTime ){
									_file ++;
								}
								_trigger( EVENT_PROGRESS, { progress : Math.floor( ( results.length / _settings.requestsNum ) * 100 ) } );
								_$elem.dequeue();
							}
						}
					);
				} );
			}
			_$elem.queue( function(){
				var
					res,
					mid = Math.floor( results.length / 2 );
				results.sort();
				if ( results.length % 2 == 0 ){
					res = Math.floor( ( results[ mid - 1 ] + results[ mid ] ) / 2 );
				}
				else{
					res = Math.floor( results[ mid ] );
				}
				_trigger( EVENT_COMPLETE, { speed : res } );
				if ( _settings.trackByOpenstat ){
					_trackByOpenstat( { speed : res } );
				}
			} )
		},

		/**
		 * Creates and sets up jQuery object
		 */
			_initialize = function(){
			if ( ! _$elem || ! _$elem.length ){
				_$elem = $( '<div/>' )
					.hide()
					.ajaxError( function( evt, xhr, stg, err ){
						if ( stg.url.indexOf( _settings.url ) + 1 ){
							_trigger( EVENT_ERROR, { error : err } );
						}
					} )
					.appendTo( document.body );
			}
		}

	/* Taking into account settings given by user */
	settings && $.extend( _settings, settings );

	/* Normalizing URL */
	_settings.url = String( _settings.url ).replace( /\/+$/, '' );

	return {
		/**
		 * Starts process
		 *
		 * @return {SpeedTest()}
		 */
		run        : function(){
			_initialize();
			_reset();
			_download();
			return this;
		},
		/**
		 * Binds given listener to the progress event
		 *
		 * @param {Function)
		 * @return {SpeedTest()}
		 */
		onProgress : function( ls ){
			_bind( EVENT_PROGRESS, ls );
			return this;
		},
		/**
		 * Binds given listener to the complete event
		 *
		 * @param {Function)
		 * @return {SpeedTest()}
		 */
		onComplete : function( ls ){
			_bind( EVENT_COMPLETE, ls );
			return this;
		},
		/**
		 * Binds given listener to the error event
		 *
		 * @param {Function)
		 * @return {SpeedTest()}
		 */
		onError    : function( ls ){
			_bind( EVENT_ERROR, ls );
			return this;
		}
	}
}
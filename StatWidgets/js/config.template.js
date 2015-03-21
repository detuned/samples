(function( global ){
	(global.liteApp = global.liteApp || {}).config = {

		/**
		 * Sets debug mode on
		 * @type {boolean}
		 * @default false
		 */
//		debug : true,


		/**
		 * Sets min level of log displaying via window.console
		 * Supported values (in order of ascending): all, debug, log, info, warn, error, none
		 * @type {string}
		 * @default 'none'
		 */
//		logLevel : 'log',

		/**
		 * Min level of log to be cached
		 * Supported values are the same as log
		 * @type {string}
		 * @default 'all'
		 */
//		logLevelToCache : 'log',

		/**
		 * Max number of log entries to cache
		 * Note that only hidden log messages are caching,
		 * and those which shown in console are not.
		 * Zero means no caching
		 * @type {number}
		 * @default 1000
		 */
//		logCacheCapacity : 0,

		/**
		 * Max length of log message
		 * Used in log cache only
		 * @type {number}
		 * @default 400
		 */
//		logEntryMaxLength : 100,


		/**
		 * Flag means if app managing by console is enabled or not
		 * @type {boolean}
		 * @default true
		 */
//		enableConsole : false,

		/**
		 * Flag means if console management possibilities extended by default or not
		 * If false, user has to run sudo before (it's not protected for now)
		 * This param make sense only if enableConsole is true
		 * @type {boolean}
		 * @default false
		 */
//		extendedConsole : true,


		/**
		 * Ids of statistics counters to be appended to user's counters list
		 * Specifying as comma separated string where each part must looks like
		 * ID:TITLE
		 * where ID — counter id, TITLE — a name to represent counter in the list
		 * @type {string}
		 * @default undefined
		 */
//		extraCounters : '0:The Whole Internet'


		/**
		 * Nothing meaningful parameter placed in the end to avoid
		 * 'trailing comma in object literal' bug (especially in legacy browsers)
		 * So keep it last and uncommented
		 */
		dummy : true

	};
})( this );
;
(function( g ){
	var
		f = 'StatWidget', n = 'x', wf = ( g[f] = g[f] || {} ), wn = ( wf[n] = wf[n] || {} ),
		config = ( wn.config = wn.config || {} );

	/*
	 * ============================================
	 * Config starts here.
	 * Each entry should look like
	 * config.%KEY% = %VALUE%;
	 * ============================================
	 */



	/**
	 * Path to folder where all widgets of x-family could be found
	 * @type {string}
	 * @default '/w/x'
	 */
//	config.familyPath = '/widgets/x';

	/**
	 * Path to folder where all JS libraries could be found
	 * @type {string}
	 * @default '/w/lib'
	 */
//	config.commonLibPath = '/widgets/lib';


})( this );
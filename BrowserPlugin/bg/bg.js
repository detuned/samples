(function(){

	var libPath = chrome.extension.getURL( 'js/lib' );
	require.config( {
		baseUrl : chrome.extension.getURL( 'js/bg/modules' ),
		paths   : {
			jquery              : libPath + '/jquery',
			underscore          : libPath + '/underscore',
			'underscore.string' : libPath + '/underscore.string',
			sockjs              : libPath + '/sockjs',
			moment              : libPath + '/moment'
		}
	} );

	require( ['main'], function( main ){
		main.init();
	} )

})();
(function ( $ ){
	$( function (){
		$( '.nav, .nav-overlay' ).on( 'click', function (){
		    $( document.body ).toggleClass( 'nav-opened' );
		})
	} );
})( jQuery );
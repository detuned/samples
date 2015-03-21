angular.module( 'plugin' )
	.filter( 'nl2br', [
		'$sce',
		function( $sce ){
			return function( text ){
				return text ? $sce.trustAsHtml( text.replace( /\n/g, '<br/>' ) ) : '';
			};
		}] );
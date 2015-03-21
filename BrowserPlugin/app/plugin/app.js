angular.module( 'plugin', [ 'plugin.config', 'ui.bootstrap', 'utils' ] )
	.constant( 'CONST', {
		//...
	} )
	.config( [
		'$sceProvider',
		function( $sceProvider ){
			//Disabled to have an easy access to the templates etc
			$sceProvider.enabled( false );
		}] );
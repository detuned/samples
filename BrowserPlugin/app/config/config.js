angular.module( 'plugin.config', [] )
	.config( [ '$provide', function( $provide ){
		$provide.decorator( '$log', [
			'$delegate',
			'logService',
			function( $delegate, logService ){
				angular.forEach( logService.getAllLevels(), function( level ){
					$delegate[ level ] = logService.getDecorator( level, $delegate[ level ] )
				} );
				return $delegate;
			}] );
	}] );
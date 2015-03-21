angular.module( 'config', [] )
	.config( [
		'$provide',
		function( $provide ){
			$provide.decorator( '$log', [
				'$delegate',
				'logService',
				function( $delegate, logService ){
					angular.forEach( logService.getAllLevels(), function( level ){
						$delegate[ level ] = logService.getDecorator( level, $delegate[ level ] )
					} );
					return $delegate;
				}] );
		} ] )

	.config( [
		'$httpProvider',
		function( $httpProvider ){
			$httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
			$httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
			$httpProvider.defaults.transformRequest = function( data ){
				if( data === undefined ){
					return data;
				}
				return $.param( data );
			};
		}] );
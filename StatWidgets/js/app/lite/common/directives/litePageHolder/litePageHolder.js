angular.module( 'lite' )
	.directive( 'litePageHolder', [
		'$compile',
		'$timeout',
		'templateService',
		function( $compile, $timeout, templateService ){
			return {
				templateUrl : templateService.getUrl( '//lite/common/litePageHolder' ),
				replace     : true,
				link        : function( scope, element, attrs ){
					scope.state = {
						loading : true
					};

					scope.$on( 'userAuthChanged', function( $event, data ){
						if ( ! data || ! _.isBoolean( data.authorized ) ){
							element.html();
							scope.state.loading = true;
						}
						else{
							render( data && data.authorized );
						}
					} );

					function render( state ){
						var html = state
							? '<div data-lite-page-user></div>'
							: '<div data-lite-page-guest></div>';

						$compile( element.html( html ).contents() )( scope );
						$timeout(function (){
							scope.state.loading = false;
						});
					}

				}
			}

		}] );
angular.module( 'index' )
	.directive( 'reload', [ 'utilsService', function ( utilsService ){
		return {
			link : function ( scope, element, attrs ){
				element.on( 'click', function (){
					utilsService.redirect( '/' );
				});
			}
		}

	}] );
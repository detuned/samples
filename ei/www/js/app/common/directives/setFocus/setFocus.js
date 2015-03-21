angular.module( 'index' )
	.directive( 'setFocus', [ '$timeout', function ( $timeout ){
		return function ( scope, element, attrs ){
			var isFocus;
			scope.$watch( attrs.setFocus, function ( v, prev ){
				isFocus = v;
				if ( v && ! prev ){
					$timeout(function (){
						if ( v == isFocus && element.is( ':visible' ) ){
							element.focus();
						}
					},100)
				}
			})
		};
	} ] );
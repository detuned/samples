angular.module( 'utils' )
	.directive( 'collapsingTextfield', [ '$timeout', function( $timeout ){
		return {
			scope   : {
				'model' : '=ngModel'
			},
			require : 'ngModel',
			link    : function( scope, element, attrs, ctrl ){
				var node = element.get( 0 );

				scope.$watch( 'model', function(){
					var
						i = 0,
						prevHeight = element.height();
					element.removeAttr( 'style' );
					while( ( node.clientHeight + 2 < node.scrollHeight ) && i ++ < 100 ){
						element.height( element.height() + 15 );
					}
					if ( prevHeight != element.height() ){
						scope.$emit( 'collapsingTextfieldUpdated' );
					}
				} );

				element.addClass( 'expanded_textfield' );
			}
		}
	}] );
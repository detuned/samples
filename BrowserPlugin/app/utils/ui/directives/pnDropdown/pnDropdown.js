angular.module( 'utils' )
	.directive( 'pnDropdown', [ '$document', function( $document ){
		return {
			link : function( scope, element, attrs ){
				var
					toggleElement = element.find( '[role="pn-dropdown-toggle"]' ),
					openClass = 'pn-dropdown_opened';

				toggleElement.on( 'click', function(){
					element.toggleClass( openClass );
					if( element.hasClass( openClass ) ){
						$document.on( 'click', onDocumentClick );
					}
					else{
						$document.off( 'click', onDocumentClick );
					}
				} );

				function onDocumentClick( e ){
					if ( e.target !== toggleElement[0] ){
						element.removeClass( openClass );
					}
				}

			}
		}

	}] );
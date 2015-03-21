angular.module( 'index' )
	.directive( 'selectOnClick', [ 'utilsService', function( utilsService ){
		function selectNode( node ){
			var
				body = $document.find( '>body' )[0];
			if( ! node ){
				return;
			}
			var selection, range, doc, win;
			if(
				(doc = node.ownerDocument) &&
					(win = doc.defaultView) &&
					typeof win.getSelection != 'undefined' &&
					typeof doc.createRange != 'undefined' &&
					(selection = window.getSelection()) &&
					typeof selection.removeAllRanges != 'undefined'
				){
				range = doc.createRange();
				range.selectNodeContents( node );
				selection.removeAllRanges();
				selection.addRange( range );
			}
			else if(
				body &&
					typeof body.createTextRange != 'undefined' &&
					(range = body.createTextRange())
				){
				range.moveToElementText( node );
				range.select();
			}
		}

		return {
			link : function( scope, element, attrs ){
				if( angular.element.inArray( element.prop( 'tagName' ).toLowerCase(), [ 'textarea', 'input' ] ) >= 0 ){
					if( utilsService.OPERATING_SYSTEM.isOs ){
						element.removeAttr( 'readonly' );
					}
					element.on( 'click', function(){
						element.focus();
						element.select();
						if( element[0] && element[0].setSelectionRange ){
							element[0].setSelectionRange( 0, 9999 );
						}
					} );
				}
				else {
					element.on( 'click', function(){
						selectNode( element[0] );
					} );
				}
			}
		}
	}] );
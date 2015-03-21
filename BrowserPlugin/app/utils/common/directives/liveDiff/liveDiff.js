angular.module( 'utils' )
	.directive( 'liveDiff', [
		'utilsService',
		'tickService',
		function( utilsService, tickService ){
			return function( scope, element, attrs ){
				var
					isOn = false,
					val = attrs.liveDiff;

				function render(){
					if ( val ){
						element.text( moment.unix( + val ).fromNow() );
					}
					else{
						element.text( '' );
					}
				}

				function on(){
					if ( ! isOn ){
						isOn = true;
						tickService.onTick( render );
					}
				}

				function off(){
					if ( isOn ){
						isOn = false;
						tickService.offTick( render );
					}
				}


				utilsService.elementDestructor( element ).push( attrs.$observe( 'liveDiff', function ( v, prev ){
					if ( v ){
						val = v;
						render();
						on();
					}
					else {
						val = '';
						off();
					}

				}), off );
			}
		}] );
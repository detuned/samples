angular.module( 'plugin.panel' )
	.directive( 'panelScrollableArea', [
		'$timeout',
		'utilsService',
		function( $timeout, utilsService ){
			return {
				link : function( scope, element, attrs ){
					var
						position = attrs.position || 'bottom',
						isPreserveScroll = 'preserveScroll' in attrs,
						preserveScrollDirection = attrs.preserveScroll,
						containerElement = element.closest( '[role="panelSection"]' ),
						sectionName = containerElement.data( 'sectionName' ),
						timers = utilsService.timersManager(),
						watchers = [],
						lastValue;

					function actualize(){
						var
							siblingsHeight = 0,
							siblings = element[ position == 'top' ? 'nextAll' : 'prevAll' ](),
							pos = siblings.each(function(){
								var
									el = angular.element( this );
								siblingsHeight += el.outerHeight();
							} ).position(),
							scrollTop = element.scrollTop(),
							elementHeight = element.height(),
							newValue;

						if ( position === 'top' ){
							element.css( 'bottom', newValue = siblingsHeight );
						}
						else{
							element.css( 'top', newValue = ( siblingsHeight + pos.top ) );
						}

						if ( isPreserveScroll ){
							if ( preserveScrollDirection === 'bottom' ){
								element.scrollTop( Math.max( 0, scrollTop + elementHeight - element.height() ) );
							}
							else{
								element.scrollTop( scrollTop );
							}
						}

						if ( newValue != lastValue ){
							lastValue = newValue;
							timers.setTimer( 'actualize', actualize, 50 );
						}
					}

					function enable(){
						disable();
						watchers.push( scope.$on( 'panelContentUpdated', actualize ) );
						actualize();
					}

					function disable(){
						timers.resetTimer( 'actualize' );
						angular.forEach( watchers, function( item ){
							item();
						} );
					}


					utilsService.elementDestructor( element ).push(
						disable,
						scope.$watch( 'activeSection.name', function( v ){
							if( v === sectionName ){
								enable();
							}
							else {
								disable();
							}
						} )
					);
				}
			}

		}] );
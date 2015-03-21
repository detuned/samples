angular.module( 'index' )
	.directive( 'beatsChart', [
		'configService',
		'beatsService',
		function( configService, beatsService ){
			return {
				templateUrl : configService._getUrl( '//APP/beats/directives/beatsChart/beatsChart.html' ),
				replace     : true,
				link        : function( scope, element, attrs ){
					var
						chartElement = element.find( '[role="chart"]' );

					beatsService.onBeatsUpdate( function( event, v ){
						if( v.beats && v.beats.length ){
							render( v.beats );
						}
					} );

					function render( values ){
						var min, max;
						angular.forEach( values, function( v ){
							if( ! min || v < min ){
								min = v;
							}
							if( ! max || v > max ){
								max = v;
							}
						} );
						scope.minValue = min;
						scope.maxValue = max;
						chartElement.sparkline( values, {
							type         : 'line',
							minSpotColor : false,
							maxSpotColor : false,
							spotColor    : false,
							width        : '100%',
							height       : '100%',
							lineColor    : '#547AA4',
							fillColor    : false
						} );
					}
				}
			}

		}] );
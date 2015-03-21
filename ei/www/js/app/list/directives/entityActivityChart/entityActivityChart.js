angular.module( 'index' )
	.directive( 'entityActivityChart', [
		'$timeout',
		'$compile',
		'configService',
		'listService',
		'utilsService',
		function( $timeout, $compile, configService, listService, utilsService ){
			return {
				templateUrl : configService._getUrl( '//APP/list/directives/entityActivityChart/entityActivityChart.html' ),
				replace     : true,
				scope       : {
					entity : '='
				},
				link        : function( scope, element, attrs ){
					var
						destructor = utilsService.elementDestructor( element ),
						chartsHolderElement = element.find( '[role="chartsHolder"]' ),
						chartsData = {
							hours : {
								title      : 'last 48h',
								timeFormat : 'D MMM, HH:mm',
								last       : moment().startOf( 'hour' ),
								units      : 'hour',
								units      : 'hours'
							},
							days  : {
								title      : 'all history',
								timeFormat : 'D MMM',
								last       : moment().startOf( 'day' ),
								unit       : 'days',
								units      : 'days'
							}
						},
						chartsInstances = [],
						load = _.debounce( function(){
							scope.state.loading = true;
							listService.getEntityActivityStat( scope.entity.id ).then( function( res ){
								scope.charts = [];
								scope.chartIndex = 0;
								_.map( chartsInstances, function( item ){
									item.destroy();
								} );
								chartsHolderElement.empty();
								angular.forEach( [ 'days', 'hours' ], function( key ){
									if( res[key] && res[key].length && ( ! configService.minSocialActivityPoints || res[key].length >= configService.minSocialActivityPoints  ) ){
										scope.charts.push( angular.extend( {},
											chartsData[key],
											{
												values : res[key],
												id     : key
											}
										) );
									}
								} );
								$timeout( renderChart );
							} )['finally']( function(){
								scope.state.loading = false;
							} );
						}, 500 );

					scope.state = {
						loading : true
					};

					scope.charts = [];

					scope.chartsData = chartsData;

					scope.nextChart = function(){
						scope.chartIndex = scope.charts[ scope.chartIndex + 1 ]
							? scope.chartIndex + 1
							: 0;
						$timeout( renderChart );
					};

					function renderChart(){
						if ( ! scope.charts[ scope.chartIndex ] ){
							return;
						}
						var
							chart = scope.charts[ scope.chartIndex ],
							el = chartsHolderElement.find( '[role="chart-' + chart.id + '"]' ),
							chartInstance, dataLabelIndex, markedMaxPoint;
						if( el.length ){
							//Already rendered
							return;
						}

						$compile( el = angular.element( '<div ' +
							'role="chart-' + chart.id + '" ' +
							'class="activity-chart__chart activity-chart__chart_' + chart.id + '" ' +
							'data-ng-show="charts[chartIndex].id == \'' + chart.id + '\'"' +
							'></div>' ).appendTo( chartsHolderElement ) )( scope );

						chartInstance = new Highcharts.Chart( {
							chart       : {
								type            : 'line',
								renderTo        : el[0],
								height          : 110,
								backgroundColor : '#EEE',
								style           : {
									fontFamily : 'OpenSans, Arial, sans-serif'
								},
								marginTop       : 0,
								marginRight     : 18,
								marginBottom    : 0,
								marginLeft      : 18
							},
							title       : false,
							colors      : ['#6DACE1'],
							plotOptions : {
								series : {
									lineWidth : 1,
									marker    : {
										enabled : false,
										radius  : 3
									},
									states    : {
										hover : {
											lineWidth : 1
										}
									}
								},
								line   : {
									dataLabels : {
										enabled   : true,
										useHTML   : true,
										backgroundColor : 'rgba( 238,238,238,0.3 )',
										formatter : function(){
											var
												pointsNum = this.series.xData.length,
												res = '';
											if( ( this.point.index - dataLabelIndex < 4 && pointsNum > 10 ) ){
												res = '';
											}
											else if( this.point.index == 0 ){
												dataLabelIndex = this.point.index;
												res = getDataLabelHtml( this.point, '#6DACE1' );
											}
											else if ( this.point.index == pointsNum - 1 ){
												res = getDataLabelHtml( this.point, '#6DACE1' );
												//This loop finished, reset to allow next rendering
												markedMaxPoint = false;
												dataLabelIndex = undefined;
											}
											else if( this.series.dataMax && this.y === this.series.dataMax && ! markedMaxPoint ){
												dataLabelIndex = this.point.index;
												markedMaxPoint = true;
												res = getDataLabelHtml( this.point, '#00A651' );
											}
											return res;
										}
									}
								}
							},

							xAxis : {
								gridLineWidth : 1,
								gridLineColor : '#FAFAFA',
								lineWidth     : 0,
//								tickInterval  : 2,
								tickWidth     : 0,
								tickLength    : 0,
								labels        : {
									enabled : false
								}
							},
							yAxis : {
								gridLineWidth : 0,
								labels        : {
									enabled : false
								},
								title         : {
									text : null
								}
							},

							legend  : {
								enabled : false
							},
							tooltip : {
								useHTML: true,
								borderWidth:0,
								borderRadius:0,
								backgroundColor:"rgba(255,255,255,0)",
								shadow:false,
								formatter : function(){
									if( chart.tooltipFormat ){
										return  chart.tooltipFormat( this );
									}
									return '<div style="font-size:11px">' +
										moment.unix( this.x ).startOf( chart.unit ).format( chart.timeFormat ) + '<br/>' +
										'<strong>' +
										Highcharts.numberFormat( this.y, 0, ',', ' ' ) +
										'</strong>' +
										'</div>';
								}
							},
							credits : {
								enabled : false
							},
							series  : [
								{
									name : chart.title,
									data : _.map( chart.values, function( v ){
										return [ v.ts, v.count ]
									} )
								}
							]
						} );

						function getDataLabelHtml( point, color ){
							return '<div style="color:' + color + ';font:10px \'OpenSans Semibold\',Arial,sans-serif">' +
								Highcharts.numberFormat( point.y, 0, ',', ' ' ) +
								'</div>' +
								'<div style="color:#818181;font:10px \'OpenSans Semibold\',Arial,sans-serif;">' +
								moment.unix( point.x ).format( chart.timeFormat ) +
								'</div>'
						}

						chartsInstances.push( chartInstance );

					}

					destructor.push( scope.$watch( 'entity.id' ), function( v ){
						if( v ){
							load()
						}
					} );

					if( scope.entity.id ){
						load();
					}


				}
			}

		}] );
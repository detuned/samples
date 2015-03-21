define( 'vz/linechart/linechart', [ 'jquery', 'underscore', 'xcore', 'highcharts', 'moment' ], function( $, _, xcore, highcharts, moment ){

	var onRender = _.debounce( function(){
		$( window ).trigger( 'resize' );
	}, 200 );


	function Widget( settings ){
		var
			element = settings.element,
			minErr = xcore.minErr( 'vz-linechart' ),
			widget = {},
			data, dom, init, chart, serviceSeriesIndexes = [];

		if( ! element ){
			throw minErr( 'no element specified' );
		}

		settings = _.defaults( settings, {
			maxSeries       : 5,
			timeMask        : 'YYYYMMDDHH',
			height          : 300,
			backgroundColor : '',
			colors          : '#569E45,#ED1C2F,#11AAE3,#F9961E,#A24086',
			numericSymbols  : ' K, M, G, T, P, E',
			thousandsSep    : ' ',
			decimalPoint    : ', ',
			font            : 'Arial, sans-serif',
			series          : '',

			tooltipTimeFormat : 'D MMM, HH:mm',

			xAxisType        : 'datetime',
			xAxisLineColor   : '#DDD',
			xAxisTickColor   : '#DDD',
			xAxisTickLength  : 5,
			xAxisLabelsColor : '#999',
			xAxisLabelFormat : 'HH:mm',

			yAxisTitle             : '',
			yAxisGridLineWidth     : 1,
			yAxisGridLineColor     : '#F5F5F5',
			yAxisMinValue          : 0,
			yAxisTickPixelInterval : 80,
			yAxisLabelsColor       : '#999',

			legend               : true,
			legendItemFontWeight : 'normal',
			legendItemFontSize   : undefined,
			legendItemColor      : '#3F3F3F',
			legendMargin         : 10,

			highlightLast      : false,
			dashStyle          : 'solid',
			highlightDashStyle : 'dash'

		} );

		element.height( settings.height );
		dom = xcore.Dom( 'vz-linechart', element );

		init = _.once( function(){
			highcharts.setOptions( {
				lang : {
					numericSymbols : settings.numericSymbols.split( ',' ),
					thousandsSep   : settings.thousandsSep,
					decimalPoint   : settings.decimalPoint
				}
			} );

			chart = new highcharts.Chart( {
				chart       : {
					type            : 'spline',
					renderTo        : element[0],
					height          : settings.height,
					backgroundColor : settings.backgroundColor,
					style           : {
						fontFamily : settings.font
					},
					marginLeft      : 60
				},
				title       : false,
				colors      : xcore.utils.parseCsvString( settings.colors ),
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
					}
				},
				xAxis       : {
					type       : settings.xAxisType,
					lineColor  : settings.xAxisLineColor,
					tickColor  : settings.xAxisTickColor,
					tickLength : settings.xAxisTickLength,
					labels     : {
						style     : {
							color : settings.xAxisLabelsColor
						},
						formatter : function(){
							return settings.xAxisType === 'datetime'
								? moment.unix( this.value ).format( settings.xAxisLabelFormat )
								: this.value;
						}
					}
				},
				yAxis       : {
					title             : settings.yAxisTitle || null,
					min               : settings.yAxisMinValue,
					gridLineWidth     : settings.yAxisGridLineWidth,
					gridLineColor     : settings.yAxisGridLineColor,
					tickPixelInterval : settings.yAxisTickPixelInterval,
					labels            : {
						style : {
							color : settings.yAxisLabelsColor
						}
					}
				},
				tooltip     : {
					formatter : function(){
//							'<b>' + this.series.name + '</b><br/>' +
//							Highcharts.dateFormat( '%Y-%m-%d %H:%M:%S', this.x * 1000 ) + '<br/>'
						var name = this.series.name || '';
						return   moment.unix( this.x ).format( settings.tooltipTimeFormat ) + '<br/>' +
							'<strong>' +
							( this.series.name ? this.series.name + ' — ' : '' ) +
							Highcharts.numberFormat( this.y, 0, ',', ' ' ) +
							'</strong>';
					}
				},
				legend      : {
					enabled   : ! ! + settings.legend,
					margin    : settings.legendMargin,
					itemStyle : {
						fontSize   : settings.legendItemFontSize,
						fontWeight : settings.legendItemFontWeight,
						color      : settings.legendItemColor
					}
				},
				credits     : {
					enabled : false
				},
				series      : [
				]
			} );


		} );

		widget.setData = function( newData ){
			var
				prevTime,
				isReversed,
				seriesSettings = xcore.utils.parseCsvString( settings.series );
			data = {
				series : []
			};
			_.each( newData || [], function( item ){
				var
					time = + item.Ts;
				if( prevTime && time - prevTime < 0 ){
					isReversed = true;
				}
				prevTime = time;
				_.each( item.Rs, function( rsItem, index ){
					if( ! data.series[index] ){
						if( settings.maxSeries && data.series.length >= settings.maxSeries ){
							return;
						}
						data.series[index] = {
							data : [],
							name : seriesSettings[index] || rsItem.Section || 'Неизвестно'
						};
						if( settings.highlightLast ){
							data.series[index].events = {
								legendItemClick: function () {
									return false;
								}
							};
						}
					}
					data.series[index].data.push(
						{
							x : time,
							y : Number( rsItem.Count )
						}
					);
				} );
			} );

			if( isReversed ){
				data.series = _.map( data.series, function( series ){
					series.data = series.data.reverse();
					return series;
				} )
			}

			if( settings.highlightLast ){
				_.each( data.series, function ( series, index ){
					var ss = _.pick( series, 'name' );
					ss.dashStyle = settings.highlightDashStyle;
					ss.data = series.data.slice( series.data.length - 2 );
					ss.parentSeries = index;
					ss.showInLegend = false;
					series.data.pop();
					data.series.push( ss );
				})
			}

			return widget;
		};

		widget.resetData = function(){
			while( chart && chart.series && chart.series.length ){
				chart.series[0].remove( true );
			}
			chart.colorCounter = 0;
			chart.symbolCounter = 0;
		};


		widget.render = function(){
			if( ! chart ){
				return;
			}
			_.each( data.series, function( series, index ){
				if( ! chart.series[index] ){
					if ( ! isNaN( series.parentSeries ) && chart.series[ series.parentSeries ] ){
						series.color = chart.series[ series.parentSeries ].color;
						series.marker = {
							symbol : chart.series[ series.parentSeries ].symbol
						};
					}
					//Create new series
					chart.addSeries( series );
				}
				else {
					//Update existent series
					chart.series[index].setData( series.data );
				}
			} );
			onRender();
		};

		init();
		return widget;
	}

	return {
		create : Widget
	}
} );
define( 'vz/columnchart/columnchart', [ 'jquery', 'underscore', 'xcore', 'highcharts', 'moment' ], function( $, _, xcore, highcharts, moment ){

	var onRender = _.debounce(function (){
		$( window ).trigger( 'resize' );
	}, 200 );

	function Widget( settings ){
		var
			DATA_TYPE_STATIC = 'static',
			DATA_TYPE_DYNAMIC = 'dynamic',
			element = settings.element,
			miErr = xcore.minErr( 'vz-columnchart' ),
			widget = {},
			data = {},
			colors = [],
			highlightColors = [],
			dom, init, chart, dataParsers = {}, dataType;
		if( ! element ){
			throw minErr( 'no element specified' );
		}

		settings = _.defaults( settings, {

			title           : '',
			chartType       : 'column',
			/**
			 * Possible types: static, dynamic
			 */
			dataType        : '',
			maxSeries       : 5,
			timeMask        : 'YYYYMMDDHH',
			height          : 300,
			backgroundColor : '',
			colors          : '#B8EBAB,#FE939D,#9FE2FB,#FFC57E,#E6A1D2',
			colorsShift     : 0,
			numericSymbols  : ' K, M, G, T, P, E',
			thousandsSep    : ' ',
			decimalPoint    : ', ',
			font            : 'Arial, sans-serif',
			series          : '',

			highlightLast   : false,
			/**
			 * Possible forms are '#F00' (concrete color), 'b+0.05' (brightness up)
			 */
			highlightColors : 'b+0.1',

			tooltipTimeFormat : 'D MMM, HH:mm',

			xAxisType       : 'category',
			xAxisLineColor  : '#DDD',
			xAxisTickColor  : '#DDD',
			xAxisTickLength : 5,

			xAxisLabels               : true,
			xAxisLabelsColor          : '#999',
			xAxisLabelFormat          : 'HH:mm',
			xAxisLabelMaxStaggerLines : 1,
			xAxisLabelOverflow        : 'justify',
			xAxisTickPixelInterval    : 50,
			xAxisTickmarkPlacement    : 'on',
			xAxisShowFirstLabel       : true,
			xAxisShowLastLabel        : true,

			seriesStacking     : 'normal',
			columnGroupPadding : 0,
			columnPadding      : 0,
			columnBorderWidth  : 1,
			columnBorderColor  : '',

			yAxisTitle             : '',
			yAxisGridLineWidth     : 1,
			yAxisGridLineColor     : '#F5F5F5',
			yAxisMinValue          : 0,
			yAxisTickPixelInterval : 80,
			yAxisLabelsColor       : '#999',

			legend                 : true,
			legendAlign            : 'center',
			legendLayout           : 'horizontal',
			legendVerticalAlign    : 'bottom',
			legendWidth            : null,
			legendItemMarginBottom : 12,
			legendItemFontWeight   : 'normal',
			legendItemFontSize     : undefined,
			legendItemColor        : '#3F3F3F',
			legendMargin           : 10

		} );

		element.height( settings.height );
		dom = xcore.Dom( 'vz-columnchart', element );

		init = _.once( function(){

			highcharts.setOptions( {
				lang : {
					numericSymbols : settings.numericSymbols.split( ',' ),
					thousandsSep   : settings.thousandsSep,
					decimalPoint   : settings.decimalPoint
				}
			} );

			colors = xcore.utils.parseSettingsList( settings.colors, settings.colorsShift );
			highlightColors = xcore.utils.parseSettingsList( settings.highlightColors, settings.colorsShift );


			chart = new highcharts.Chart( {
				chart       : {
					type            : settings.chartType,
					renderTo        : element[0],
					height          : settings.height,
					backgroundColor : settings.backgroundColor,
					style           : {
						fontFamily : settings.font
					},
					marginLeft      : 60
				},
				title       : false,
				colors      : colors,
				plotOptions : {
					column : {
						groupPadding : settings.columnGroupPadding,
						pointPadding : settings.columnPadding,
						borderWidth  : settings.columnBorderWidth,
						borderColor  : settings.columnBorderColor
					},
					series : {
						stacking : settings.seriesStacking
					}
				},
				xAxis       : {
					type              : settings.xAxisType,
					lineColor         : settings.xAxisLineColor,
					tickColor         : settings.xAxisTickColor,
					tickLength        : settings.xAxisType ? settings.xAxisTickLength : 0,
					tickPixelInterval : settings.xAxisTickPixelInterval,
					tickmarkPlacement : settings.xAxisTickmarkPlacement,
					showFirstLabel    : ! ! + settings.xAxisShowFirstLabel,
					showLastLabel     : ! ! + settings.xAxisShowLastLabel,

					labels : {
						enabled         : ! ! settings.xAxisLabels,
						maxStaggerLines : settings.xAxisLabelMaxStaggerLines,
						style           : {
							color : settings.xAxisLabelsColor
						},
						formatter       : function(){
							return settings.xAxisType === 'datetime'
								? moment.unix( this.value ).format( settings.xAxisLabelFormat )
								: this.value;
						},
						overflow        : settings.xAxisLabelOverflow
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
						var
							name, xMoment, xFormatted;
						if( dataType === DATA_TYPE_DYNAMIC ){
							xFormatted = ( xMoment = moment.unix( data.rawCategories[this.point.x] ) ).isValid()
								? xMoment.format( settings.tooltipTimeFormat )
								: '';
							name = this.series.name || '';
						}
						else {
							xFormatted = this.x;
							name = '';
						}
						return ( xFormatted ? xFormatted + '<br/>' : '' ) +
							'<strong>' +
							( name ? name + ' — ' : '' ) +
							Highcharts.numberFormat( this.y, 0, ',', ' ' ) +
							'</strong>';
					}
				},
				legend      : _.extend( {
					enabled          : ! ! + settings.legend,
					align            : settings.legendAlign,
					verticalAlign    : settings.legendVerticalAlign,
					itemMarginBottom : settings.legendItemMarginBottom,
					layout           : settings.legendLayout,
					margin           : settings.legendMargin,
					itemStyle        : {
						fontSize   : settings.legendItemFontSize,
						fontWeight : settings.legendItemFontWeight,
						color      : settings.legendItemColor
					}
				}, settings.legendWidth ? { width : settings.legendWidth } : {} ),
				credits     : {
					enabled : false
				},
				series      : [
				]
			} );


		} );

		dataParsers[ DATA_TYPE_STATIC ] = function( newData ){
			var
				seriesSettings = xcore.utils.parseSettingsList( settings.series ),
			//Get last value to use for static render
			//We expect here that list sorted as time DESC
				item = newData[0];

			data.series[0] = {
				data : []
			};
			_.each( item.Rs, function( rsItem, index ){
				data.categories[index] = seriesSettings[index] || rsItem.Section;
				data.series[0].data[index] = Number( rsItem.Count );
			} );

		};

		dataParsers[ DATA_TYPE_DYNAMIC ] = function( newData ){
			var
				seriesSettings = xcore.utils.parseSettingsList( settings.series ),
				prevTime,
				isReversed;
			_.each( newData || [], function( item, itemIndex ){
				if( settings.maxPoints && data.categories.length >= + settings.maxPoints ){
					return;
				}

				var
					time = + item.Ts;
				if( prevTime && time - prevTime < 0 ){
					isReversed = true;
				}
				prevTime = time;

				data.categories[itemIndex] = moment.unix( time ).format( settings.xAxisLabelFormat );
				data.rawCategories[itemIndex] = time;

				_.each( item.Rs, function( rsItem, index ){
					var rsData = {};
					if( ! data.series[index] ){
						if( settings.maxSeries && data.series.length >= settings.maxSeries ){
							return;
						}
						data.series[index] = {
							data : [],
							name : seriesSettings[index] || rsItem.Section || 'Неизвестно'
						};
					}
					data.series[index].data.push( {
						y : Number( rsItem.Count )
					} );
				} );

			} );

			if( isReversed ){
				data.series = _.map( data.series, function( series ){
					series.data = series.data.reverse();
					return series;
				} );
				data.categories = data.categories.reverse();
				data.rawCategories = data.rawCategories.reverse();
			}

			if( + settings.highlightLast ){
				_.each( data.series, function( series, index ){
					var
						baseColor = colors[index],
						color = highlightColors[index] || highlightColors[0],
						m;
					if( m = String( color ).match( /^b\+([\.0-9]+)$/ ) ){
						color = new Highcharts.Color( baseColor ).brighten( + m[1] ).get();
					}
					series.data[ series.data.length - 1 ].color = color;
				} );
			}
		};


		widget.setData = function( newData ){
			data = {
				series        : [],
				categories    : [],
				rawCategories : []
			};

			if( settings.dataType && dataParsers[ settings.dataType ] ){
				dataType = settings.dataType;
			}
			else {
				//Trying to automatically define dataType by data structure
				dataType = ( newData.length == 1 )
					? DATA_TYPE_STATIC
					: DATA_TYPE_DYNAMIC;
			}

			dataParsers[ dataType ]( newData );

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
			chart.xAxis[0].setCategories( data.categories );
			_.each( data.series, function( series, index ){
				if( ! chart.series[index] ){
					//Create new series
					chart.addSeries( series );
				}
				else {
					//Update existent series
					chart.series[index].setData( series.data );
				}
			} );
			onRender();
			return widget;
		};

		init();
		return widget;
	}

	return {
		create : Widget
	}
} );
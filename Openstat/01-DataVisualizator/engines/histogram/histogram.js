/** 
 * @include "../../vzr.js"
 */
 
 ;(function(){
 	var
 		TYPE_FREQUENCY 		= 'frequency',
 		TYPE_STRUCTURAL 	= 'structural',
 		vzrHistogram = {
	 		_requiredCss : ['histogram.css'],
	 		
	 		_settings : {
	 			
	 				/** @type {String} */
	 				type						: TYPE_FREQUENCY,
	 				/** @type {Number} */
	 				normalizationValue			: undefined,
		 			/* Base containers */
					containerClass				: '',
					chartClass					: 'histogram',
					chartClassTypeBase			: 'histogram-type-',
					chartWithMetaCaptionsClass	: 'histogram-with-meta-captions',
					/**
					 * In percents
					 */
					chartPaddingTop				: 10,
					
					/* Grid */
					gridClass					: 'histogram-grid',
					gridLineClass				: 'histogram-grid-line',
					gridLineCaptionClass		: 'histogram-grid-line-caption',
					yAxisTitleClass				: 'histogram-y-axis-caption',
					axisNameClass				: 'histogram-axis-name',
					xAxisNameClass				: 'histogram-axis-x-name',
					yAxisNameClass				: 'histogram-axis-y-name',
					maxGridLines				: 4,
					/** @type {String} */
					valuesUnitCaption			: undefined,
					
					gridFactorTitles			: {
						1E9					: _('billions'),
						1E6					: _('millions'),
						1E3					: _('thousands')
						},
						
					showAxisNames				: false,
					
					/* Sections */
					sectionsWrapClass			: 'histogram-sections-wrap',
					sectionClass				: 'histogram-section',
					sectionClassNumBase			: 'histogram-section-num-',
					sectionFirstClass			: 'histogram-section--first',
					sectionLastClass			: 'histogram-section--last',
					sectionSkipClass			: 'histogram-section--skip',
					sectionTitleClass			: 'histogram-section-title',
					sectionMetaTitleClass		: 'histogram-section-metatitle',
					sectionCanvasClass			: 'histogram-section-canvas',
					sectionCanvasClassNumBase	: 'histogram-section-canvas-num-',
					
					minSectionTitleWidth		: 4,
					
					/* Balloon */
					
					useBalloon					: true,
					balloonClass				: 'histogram-balloon',
					balloonTitleClass			: 'histogram-balloon-title',
					balloonOffsetX				: 20,
					balloonOffsetY				: -5,
					displaySetsTitlesInBalloon	: false,
					balloonSetTitleClass		: 'histogram-balloon-set-title',
					
					/* Bars */
					sectionBarClass				: 'histogram-section-bar',
					sectionBarClassNumBase		: 'histogram-section-bar-num-',
					sectionBarHighlightedClass	: 'histogram-section-bar-highlighted',
					barColors					: ['#569D9C','#78BDEE','#00E3B6','#FF9599','#D6D6D6'],
					highlightColor				: '#FF9599',
					/**
					 * In percents
					 * @type {Numbers}
					 */
					barMaxWidth					: 50,
					
					/** 
					 * Min non-zero bar height in percents
					 */
					barMinHeight					: 0.4,
					/**
					 * Distance between side bars in neighboring sections
					 * In parts of bar width
					 * @type {Number}
					 */
					sectionBarDistance			: 1,
					displayBarCaptions			: false,
					sectionBarCaptionClass		: 'histogram-section-bar-caption',
					captionsDecimalPlacesNum	: 2,
					
					/* Bars parts (in structural type) */
					sectionBarPartClass			: 'histogram-section-bar-part',
					sectionBarPartClassNumBase	: 'histogram-section-bar-part-num-',
					
					/* Linechart */
					lineWidth					: 2
	 				},
	 		
	 		/** @type {jQuery} */
	 		$chart : undefined,
	 		/** @type {jQuery} */
	 		$sectionsWrap : undefined,
	 		/** @type {jQuery} */
	 		$grid : undefined,
	 		/** @type {jQuery} */
	 		$sections : undefined,
	 		/** @type {jQuery} */
	 		$sectionsCanvas : undefined,
	 		
	 		/** @type {Number} */
	 		yScale : 1,
	 		
	 		/** 
	 		 * Using this factor to reduce grid labels 
	 		 * @type {Number}
	 		 */
	 		gridLabelsFactor : 1,
	 		
	 		/**
			 * Data set which using for X-Axis 
			 * @type {Vzr.DataSet.Instance()}
			 */
			_argSet : undefined,
	 		
	 		/** 
	 		 * Balloon interface
	 		 */
	 		balloon : {
	 			initialize 	: function(_s){},
				setText 	: function(text){},
				show 		: function(){},
				place 		: function(x, y){},
				hide 		: function(){}
	 			},
	 			
	 		/** @type {Number} */
	 		_sectionWidth : undefined,
	 		
	 		
	 		afterInitialize : function(){
//	 			this.settings();
	 				
	 			},
	 			
	 		onSetContainer : function(){
	 			var $this = this;
	 			this.$container.addClass(this._settings.containerClass);
				this.$chart = $(['<div class="' , this._settings.chartClass , '"/>'].join(''))
					.appendTo(this.$container);
				this.$sectionsWrap = $(['<div class="' , this._settings.sectionsWrapClass , '"/>'].join(''))
					.appendTo(this.$chart);
					
				if (this._settings.useBalloon){
					this.$sectionsWrap
						.mousemove(function(/* Event */e){
							$this._settings.useBalloon 
								&& $this.balloon.place(e.pageX, e.pageY);
							})
						.delegate('div.' + this._settings.sectionCanvasClass, 'hover', function(/* Event */e){
							if (!$this._settings.useBalloon){
								return;
								} 
							if (e.type == 'mouseover' && this.balloonText){
								$this.balloon.setText(this.balloonText);
								}
							else{
								$this.balloon.hide();
								}
							});
					}
				this.$grid = $(['<div class="' , this._settings.gridClass , '"/>'].join(''))
					.appendTo(this.$chart);
				
				this.balloon = (function(){
					var
						/** @type {jQuery} */
						$balloon,
						_isInitialized = false,
						_settings = {
							},
						_width,
						winW, winH,
						
						
						actualize = function(){
							winW = $(window).width(); 
							winH = $(window).height(); 
							},
						
						/** 
						 * Public of balloon
						 */
						_obj = {
							initialize : function(_s){
								if (_isInitialized){
									/* Have initialized earlier */
									return;
									}
								if (_s){
									$.extend(_settings, _s);
									}
								$balloon = $(['<div class="' , $this._settings.balloonClass , '" />'].join(''))
									.hide()
									.appendTo(document.body);
								$(window).resize(actualize);
								actualize();
								_isInitialized = true;
								},
							setText : function(text){
								$balloon[0].innerHTML = text;
								$balloon[0].style.display = 'block';
								_width = $balloon.outerWidth();
								},
							show : function(){
								$balloon.showBlock();
								},
							place : function(x, y){
								var
									newX = x + $this._settings.balloonOffsetX,
									newY = y + $this._settings.balloonOffsetY;
								if (winW && (newX + _width) > winW){
									newX = x - _width - $this._settings.balloonOffsetX;
									}
								$balloon[0].style.left = newX + 'px';
								$balloon[0].style.top = newY + 'px';
								},
							hide : function(){
								$balloon.hide();
								}
							};
					return _obj;
					})();
				this.balloon.initialize();
	 			},
	 		
	 		actualize : function(){
	 			var 
	 				$this = this,
	 				maxValue,
	 				minValue,
	 				maxPositive,
	 				maxNegative,
	 				maxDiff;
	 			this._superMethod('actualize');
	 			if (this._settings.type == TYPE_STRUCTURAL){
	 				maxPositive = this._settings.normalizationValue || this.getMaxPositiveSumValue();
	 				maxNegative = this.getMaxNegativeSumValue() || 0;
	 				this.yScale = (100 - this._settings.chartPaddingTop) / ( (maxPositive + maxNegative) || 1);
	 				if (this._settings.normalizationValue){
	 					this._settings.chartPaddingTop = this._settings.chartPaddingTop
	 						? Math.max(this._settings.chartPaddingTop, 15)
	 						: 15;
	 					}
	 				}
	 			else {
	 				maxPositive = this._maxValue;
	 				this.yScale = (100 - this._settings.chartPaddingTop) / (maxPositive || 1);
	 				}
	 			
	 			/* Defining appropriate gridFactor by analyzying maxValue */
	 				this.gridLabelsFactor = 1;
	 				$.each([1E9, 1E6, 1E3], function(){
	 					if (maxPositive > Number(this) || maxNegative > Number(this)){
	 						$this.gridLabelsFactor = Number(this);
	 						return false;
	 						}
	 					});
	 				
	 			if (this._valuesSets[0]){
	 				/* Using unitCaption of first value dataset as caption for y-Axis */
	 				this._settings.valuesUnitCaption = this._valuesSets[0].getMeta('unitCaption');
	 				}
	 			if (
	 				this.gridLabelsFactor > 1 
	 				&& this._settings.gridFactorTitles[this.gridLabelsFactor]
	 				){
	 				this._settings.valuesUnitCaption = this._settings.gridFactorTitles[this.gridLabelsFactor] + (
	 					this._settings.valuesUnitCaption
	 						? ' ' + this._settings.valuesUnitCaption
	 						: ''
	 						);  
	 				}
	 			},
	 			
	 		renderGrid : function(){
	 			var
	 				$this = this,
	 				topValue,
					gridStep,
					$gridLine,
	 				maxPositive = this.getMaxPositiveSumValue(),
					maxNegative = this.getMaxNegativeSumValue(),
					zeroLevel = (100 * (maxNegative / (maxNegative + maxPositive))).roundFloat(1);
	 			/* Drawing grid */
					if (this.$grid){
						this.$grid.empty();
						topValue = 100 / this.yScale;
						if (this._settings.type == TYPE_STRUCTURAL && this._settings.normalizationValue){
							/* 
		 					 * For normalized structural type making most top grid line 
		 					 * matching normalization value 
		 					 */
							gridStep = ( this._settings.normalizationValue / (this._settings.maxGridLines + 1) );
							}
						else{
							gridStep = Math.ceil(topValue / (this._settings.maxGridLines + 1));
							}
						
						/* Drawing grid lines */	
						(function(){
							var
								addGridLine = function(value){
									$gridLine = $([
										'<div ',
											'class="' , $this._settings.gridLineClass , '" ',
											'style="bottom:' , (value * $this.yScale).roundFloat(1) + zeroLevel  , '%"',
											'>',
											'<span class="' , $this._settings.gridLineCaptionClass , '">',
												$this.gridLabelsFactor > 1
													? (value / $this.gridLabelsFactor).roundFloat(1).format()  
													: value
												,
											'</span>',
										'</div>'].join(''))
										.appendTo($this.$grid);
									}
							if (maxNegative > 0){
								/* 
								 * Got a negative part, so at first draw zero line  
								 */
								addGridLine(0);
								for (var value = gridStep; value < maxPositive; value += gridStep) {
									addGridLine(value)
									}
								for (var value = - gridStep; value > - maxNegative; value -= gridStep) {
									addGridLine(value)
									}
								}
							else{
								for (var value = gridStep; value < topValue; value += gridStep) {
									addGridLine(value)
									}
								}
							})();
							
						/* Adding unit caption */
						if (this._settings.valuesUnitCaption){
							this.$grid.append($(['<span class="' , this._settings.yAxisTitleClass , '">' ,
								this._settings.valuesUnitCaption, 
								'</span>'].join('')));
							}
							
						if (this._settings.showAxisNames){
							;(function(){
								var
									xName = $this._argSet && $this._argSet.getMeta('title'),
									yName = $this._valuesSets && $this._valuesSets[0] && $this._valuesSets && $this._valuesSets[0].getMeta('title');
								if (xName){
									$this.$grid.append($([
										'<span class="' , $this._settings.axisNameClass, ' ', $this._settings.xAxisNameClass , '">' ,
											xName, 
										'</span>'].join('')));
									}
								if (yName){
									$this.$grid.append($([
										'<span class="' , $this._settings.axisNameClass, ' ', $this._settings.yAxisNameClass , '">' ,
											yName, 
										'</span>'].join('')));
									}
								})();
							}
						
						}
	 			},
	 			
	 		renderBars : function(){
				var
					$this = this,
					maxPositive = this.getMaxPositiveSumValue(),
					maxNegative = this.getMaxNegativeSumValue(),
					zeroLevel = (100 * (maxNegative / (maxNegative + maxPositive))).roundFloat(1),
					barWidth,
					legendHtml = [],
					realPaddingHor,
					sumValues = this._settings.type == TYPE_STRUCTURAL
						? this.getSumValues()
						: [],
					positiveSumValues = this._settings.type == TYPE_STRUCTURAL
						? this.getPositiveSumValues()
						: [],
					negativeSumValues = this._settings.type == TYPE_STRUCTURAL
						? this.getNegativeSumValues()
						: [],
					/** 
					 * Array of values dataSets that must be displaying as bars
					 * @type {Array}
					 */
					barsSets = (function(){
						var
							res = [],
							/** @type {Vzr.DataSet.Instance()} */
							_ds,
							/** @type {String} */
							vzType;
							
						if ($this._valuesSets.length){
							for (var i = 0, l = $this._valuesSets.length; i < l; i++) {
								_ds = $this._valuesSets[i];
								if (!(vzType = _ds.getMeta('vz_type')) || vzType == 'bars'){
									res.push(_ds);
									}
								}
							}
						return res;
						})();
				/* Drawing bars */
					if (this._settings.type == TYPE_STRUCTURAL){
						/* Structural histogramm always has single bar in each section */
						barWidth = Math.min((
								100 / (1 + this._settings.sectionBarDistance)
								).roundFloat(1), 
							this._settings.barMaxWidth);
						realPaddingHor = (100 - barWidth) / 2;
						}
					else{
						/* Frequency histogramm has manu bars in each section */
						barWidth = Math.min((
								100 / (barsSets.length + this._settings.sectionBarDistance)
								).roundFloat(1), 
							this._settings.barMaxWidth);
						realPaddingHor = (100 - barWidth * barsSets.length) / 2;
						}
					
					if (barsSets.length){
						$this.$sectionsCanvas.each(function(index){
							var
								$canvas = $(this).empty(),
								/** @type {jQuery} */
								$bar,
								/** 
								 * Using for structural type
								 * @type {Number}
								 */
								_barSectionsPositiveHeight = 0,
								/** 
								 * Using for structural type
								 * @type {Number}
								 */
								_barSectionsNegativeHeight = 0,
								/** 
								 * Using for structural type
								 * @type {Number}
								 */
								_barSectionHeight = 0,
								/** @type {Number} */
								_barHeight,
								/** @type {Number} */
								_barZeroLevel,
								/** 
								 * Sum of all values in this position
								 * Using for structural type
								 * @type {Number}
								 */
								positiveSumValue = $this._settings.normalizationValue || positiveSumValues[index] || 0,
								negativeSumValue = negativeSumValues[index] || 0,
								sumValue = positiveSumValue + negativeSumValue,
								color,
								value,
								valueRepr,
								fillLegend = ($this.$legend && !legendHtml.length),
								balloonText = [
									'<h3 class="' , $this._settings.balloonTitleClass , '">', 
										$this._argSet 
											? $this._argSet.getFormattedValue(index)
											: '',
											
									'</h3>'],
								_balloonTextItems = [],
								isHighlighted = $this._argSet 
												&& typeof $this._argSet.getMeta('highlightValue') != 'undefined'
												&& index == + $this._argSet.getMeta('highlightValue');
												
							if ($this._settings.type == TYPE_STRUCTURAL){
								_barHeight = (sumValue * $this.yScale).roundFloat(1);
								_barZeroLevel = 100 * (negativeSumValue / sumValue);
								$bar = $([
									'<div ',
										'class="' , [
											$this._settings.sectionBarClass,
											$this._settings.sectionBarClassNumBase + index
											].join(' ') ,'" ',
										'style="',
											'height:' , _barHeight  , '%;',
											'width:' , barWidth ,'%;',
											'left:' , realPaddingHor ,'%;',
											'bottom:', (zeroLevel - (negativeSumValue * $this.yScale)).roundFloat(1), '%;',
											'  "/>'
									].join(''));
								$canvas.append($bar);
								}
								
							for (var i = 0, l = barsSets.length; i < l; i++) {
								value = barsSets[i].getValue(index);
								valueRepr = ! isNaN(value)
											? value 
												? (
													$this.gridLabelsFactor > 1
														? (value / $this.gridLabelsFactor).roundFloat(1).format()
														: String(value).numberFormat(2)
													)
												: 0
											: '&mdash;';
								if ( ! ( color = barsSets[i].getMeta('color') ) ){
									color = $this._settings.barColors[i % $this._settings.barColors.length];
									barsSets[i].setMeta('color', color);
									}
								
								if ($this._settings.type == TYPE_STRUCTURAL){
									/* Adding bar parts */
									_barSectionHeight = (100 * Math.abs(value) / sumValue).roundFloat(1);
									if (i == l - 1){
										/* Last value cannot by greater then tail */
										_barSectionHeight = Math.min(100 - _barSectionsPositiveHeight - _barSectionsNegativeHeight , _barSectionHeight); 
										}
									if (value >= 0){
										$bar.append([
											'<div ',
												'class="' , [
													$this._settings.sectionBarPartClass,
													$this._settings.sectionBarPartClassNumBase + index
													].join(' ') ,'" ',
												'style="',
													'height:' , _barSectionHeight , '%;',
													'bottom:' , _barZeroLevel + _barSectionsPositiveHeight  , '%;',
													'background-color:' , color ,
													'  "/>'
											].join(''));
										_barSectionsPositiveHeight += _barSectionHeight;
										}
									else {
										$bar.append([
											'<div ',
												'class="' , [
													$this._settings.sectionBarPartClass,
													$this._settings.sectionBarPartClassNumBase + index
													].join(' ') ,'" ',
												'style="',
													'height:' , _barSectionHeight , '%;',
													'top:' , (100 - _barZeroLevel) + _barSectionsNegativeHeight  , '%;',
													'background-color:' , color ,
													'  "/>'
											].join(''));
										_barSectionsNegativeHeight += _barSectionHeight;
										}
									}
								else {
									_barHeight = (value * $this.yScale).roundFloat(1);
									if ( _barHeight > 0 && _barHeight < $this._settings.barMinHeight ){
										_barHeight = $this._settings.barMinHeight;
										}
									$bar = $([
										'<div ',
											'class="' , [
												$this._settings.sectionBarClass,
												$this._settings.sectionBarClassNumBase + index
												].join(' ') ,'" ',
											'style="',
												'height:' , _barHeight , '%;',
												'width:' , barWidth ,'%;',
												'left:' , (realPaddingHor + barWidth * i ) ,'%;',
												'background-color:' , isHighlighted ? $this._settings.highlightColor : color ,
												'  ">',
										$this._settings.displayBarCaptions
											? [
												'<span class="' , $this._settings.sectionBarCaptionClass , '">',	
													valueRepr,
												'</span>'
												].join('')
											: '',
										'</div>'
												
										].join(''));
									$canvas.append($bar);
									}
									
								_balloonTextItems[
									$this._settings.type != TYPE_STRUCTURAL || value < 0 //Hack to set right order in positive/negative reports 
										? 'push'
										: 'unshift' 
									]([
									'<div style="color:' , color , '">' ,
										$this._settings.displaySetsTitlesInBalloon
											? [
												'<span class="' , $this._settings.balloonSetTitleClass , '">', 
													barsSets[i].getTitle(),
												'</span>'].join('')
											: '',
										! isNaN(value)
											? [
												value 
													? (
														$this.gridLabelsFactor > 1
															? (value / $this.gridLabelsFactor).roundFloat(1).format()
															: String(value).numberFormat(2)
														)
													: 0,
												$this._settings.valuesUnitCaption
												].join(' ')
											: '&mdash;'
										,
									'</div>'].join(''));
								if (fillLegend){
									legendHtml.push([
										'<li>',
											'<strong style="color:' , color , '">',
												barsSets[i].getTitle(),
											'</strong>', 
										'</li>'
										].join(''));
									}
								}
							balloonText.push(_balloonTextItems.join(''));
							this.balloonText = balloonText.join('');
							});
						}
						
				/* Drawing legend */
					if (this.$legend){
						//FIXME : legend must be drawing in tracker report engine not here
						this.$legend.html(legendHtml.join(''));
						}
				
				},
			
				
			/**
			 * Draw engine 
			 * @type {Raphael()} 
			 * */
			_svgDriver : undefined,
			
			/** @type {jQuery} */
			$lineChartsContainer : undefined,
			
			_renderedLineChart : false,
				
			renderLineCharts : function(){
				var
					$this = this,
					/** 
					 * Array of values dataSets that must be displaying as bars
					 * @type {Array}
					 */
					lineChartSets = (function(){
						var
							res = [],
							/** @type {Vzr.DataSet.Instance()} */
							_ds,
							/** @type {String} */
							vzType;
							
						if ($this._valuesSets.length){
							for (var i = 0, l = $this._valuesSets.length; i < l; i++) {
								_ds = $this._valuesSets[i];
								if ((vzType = _ds.getMeta('vz_type')) && vzType == 'linechart'){
									res.push(_ds);
									}
								}
							}
						return res;
						})(),
					/** @type {Vzr.DataSet.Instance()} */
					_dataSet,
					/** 
					 * Actual canvas width
					 * @type {Number}
					 */
					canvasWidth,
					/** 
					 * Actual canvas height
					 * @type {Number}
					 */
					canvasHeight,
					/** @type {Number} */
					sectionWidthAbs,
					maxPositive = this.getMaxPositiveSumValue(),
					maxNegative = this.getMaxNegativeSumValue(),
					zeroLevel = (100 * (maxNegative / (maxNegative + maxPositive))).roundFloat(1),
					/** @type {Number} */
					zeroLevelAbs,
					yScaleAbs;
				if (!lineChartSets.length){
					return;
					}
				/* Preparing container and driver */
					if (!this._svgDriver){
						/* Extending Raphael */
							$.extend(Raphael.fn, {
									spath: function(/* Array */points, color, width, props){
										var 
											pp = [],
											p;
										color = color || '#000';
										width = width || 1;
										if (points && points.length){
											for (var i = 0; i < points.length; i += 2){
												pp.push( (pp.length ? 'L' : 'M'), points[i], ' ', points[i + 1] );
												}
											p = this.path(pp.join(''));
											p.attr($.extend({
												stroke: 		color,
												'stroke-width': width
												}, props || {}));
											}
										return p;
										}
									});
									
						this.$lineChartsContainer = $('<div class="histogram-linecharts-wrap" />')
							.mousemove(function(/* Event */e){
								var
									el = this,
									x = (function(){
										var res = e.layerX;
										if (typeof res == 'undefined'){
											if (typeof el._offsetLeft == 'undefined'){
												el._offsetLeft = $(el).offset().left;
												$(window).resize(function(){
													el._offsetLeft = $(el).offset().left;
													});
												}
											res = e.pageX - el._offsetLeft;
											}
										return res;
										})(),
									sectionCanvas = $this.$sections.eq(Math.floor(x / ( canvasWidth * $this._sectionWidth / 100 ) )).find('>div.' + $this._settings.sectionCanvasClass)[0];
									 
								if ($this._settings.useBalloon && sectionCanvas && sectionCanvas.balloonText){
									$this.balloon.setText(sectionCanvas.balloonText);
									$this.balloon.place(e.pageX, e.pageY);
									}
								else{
									$this.balloon.hide();
									}
								})
							.mouseout(function(){
								$this.balloon.hide();
								})
							.appendTo(this.$chart);
						this._svgDriver = Raphael(this.$lineChartsContainer.get(0));
						$(window).resize(function(){
							$this.renderLineCharts();
							})
						}
					
						
				/* Clearing canvas to redraw */
					this._svgDriver.clear();
					
				/* Actualizing canvas size and related params */
					canvasWidth = this.$lineChartsContainer.width();
					canvasHeight = this.$lineChartsContainer.height();
					sectionWidthAbs = BROWSER.isWebkit || BROWSER.isOpera
						? this.$sections.eq(0).outerWidth()
						: canvasWidth * $this._sectionWidth / 100;
					this._svgDriver.setSize(canvasWidth + 1, canvasWidth + 1);
					zeroLevelAbs = Math.round(zeroLevel * canvasHeight / 100);
					yScaleAbs = this.yScale * canvasHeight / 100;
					
				/* Drawing line(s) */	
					;(function(){
						if (!lineChartSets.length){
							/* Nothing to draw */
							return
							}
						var 
							lines = [],
							/** @type {Number} */
							x,
							/** @type {Number} */
							y,
							color,
							$sectionCanvas,
							value;
						/* Compiling point coords for each line */
							for (var i = 0, l = lineChartSets[0].getValuesLength(); i < l; i++) {
								x = Math.round(sectionWidthAbs * (i + 0.5));
								for (var j = 0, k = lineChartSets.length; j < k; j++) {
									_dataSet = lineChartSets[j];
									if (!lines[j]){
										if ( ! ( color = lineChartSets[i].getMeta('color') ) ){
											color = $this._settings.barColors[i % $this._settings.barColors.length];
											lineChartSets[i].setMeta('color', color);
											}
										lines[j] = {
											points : [],
											color : color 
											};
										}
									value = _dataSet.getValue(i);
									y = Math.round(canvasHeight - zeroLevelAbs - value * yScaleAbs);
									lines[j].points.push(x, y);
									if (!$this._renderedLineChart){
										$sectionCanvas = $this.$sections.eq(i).find('>div.' + $this._settings.sectionCanvasClass);
										if ($sectionCanvas[0] && $sectionCanvas[0].balloonText){
											$sectionCanvas[0].balloonText += [
												'<div style="color:' , lines[j].color , '">' ,
													! isNaN(value)
														? [
															value 
																? (
																	$this.gridLabelsFactor > 1
																		? (value / $this.gridLabelsFactor).roundFloat(1).format()
																		: String(value).numberFormat(2)
																	)
																: 0,
															$this._settings.valuesUnitCaption
															].join(' ')
														: '&mdash;'
													,
												'</div>'].join('');
											}
										}
									}
								}
						/* Drawing each line */
							;(function(){
								for (var i = 0, l = lines.length; i < l; i++) {
									$this._svgDriver.spath(lines[i].points, lines[i].color, $this._settings.lineWidth);
									}
								})();
						})();
				this._renderedLineChart = true;
				},	
				
	 		render : function(){
	 			var 
	 				$this = this,
	 				/** @type {Array} */
	 				args,
	 				argsType,
	 				argsStep;
	 			if (!this.$container){
	 				/* Cannot render without container */
	 				return;
	 				}
				this.$sectionsWrap.empty();
				this.$sections = $();
				this.$sectionsCanvas = $();
				this._renderedLineChart = false;
				
				$.each([TYPE_FREQUENCY, TYPE_STRUCTURAL], function(){
					var type = this.toString();
					$this.$chart
						.toggleClass(
							$this._settings.chartClassTypeBase + type, 
							$this._settings.type == type
							);
					});
				
				this.$chart.toggleClass(
					this._settings.chartWithMetaCaptionsClass,
					this._argSet && (
						'day' == this._argSet.getMeta('step')
						|| 'month' == this._argSet.getMeta('step')
						)
					);
				
				if (this._argSet && (args = this._argSet.getValues()) && args.length){
					argsType = this._argSet.getType();
					argsStep = this._argSet.getMeta('step');
					/* Drawing sections */
						(function(){
							var
								/** @type {jQuery} */
								$section,
								width = $this._sectionWidth = (100 / args.length).roundFloat(2),
								multiplicity = width < $this._settings.minSectionTitleWidth 
									? Math.ceil($this._settings.minSectionTitleWidth / width)
									: 1,
								wideLabelsStyle = multiplicity > 1
									? [' style="width:' , multiplicity * 100 , '%;',
										'text-align:left;right:auto;"'].join('')
									: '',
								_skip = false,
								totalWidth = 0,
								hasMetaCaption = false,
								/** 
								 * @param {Date}
								 */
								getMetaCaptionHtml = function(dt){
									var
										res = [
											'<div class="' , $this._settings.sectionMetaTitleClass , '">',
												dt.format( argsStep == 'month'
													? 'Y'
													: "G'y"
													),
											'</div>'
											].join('');
									hasMetaCaption = true;
									return res;
									};
							for (var i = 0, l = args.length; i < l; i++) {
								if (i == l - 1){
									width = 100 - totalWidth;
									}
								_skip = multiplicity != 1 && (i % multiplicity);
								$section = $([
									'<div class="' ,[
											$this._settings.sectionClass,
											$this._settings.sectionClassNumBase + i,
											i == 0
												? $this._settings.sectionFirstClass
												: '',
											i == l - 1
												? $this._settings.sectionLastClass
												: '',
											_skip 
												? $this._settings.sectionSkipClass
												: ''
											].join(' '),
										'" style="width:' , width , '%">',
										(
											_skip
												? ''
												: [
													'<div class="' , $this._settings.sectionTitleClass , '"',
													wideLabelsStyle,
													'>',
													argsType == Vzr.DataSet.TYPE_DATE
														? args[i].format(
															argsStep == 'month'
																? 'G'
																: 'j'
															)
														: args[i],
													'</div>'].join('')
											),
										(
											('day' == argsStep && 1 == args[i].getDate())
											|| ('month' == argsStep && 0 == args[i].getMonth())
												? getMetaCaptionHtml(args[i])
												: ''
											),
									'</div>'].join('')).appendTo($this.$sectionsWrap);
									
									$this.$sectionsCanvas = $this.$sectionsCanvas.add(
										$(['<div class="' , [ 
												$this._settings.sectionCanvasClass,
												$this._settings.sectionCanvasClassNumBase + i
												].join(' '),
											'"/>'].join(''))
											.appendTo($section)
										);
										
									$this.$sections = $this.$sections.add($section);
									
									totalWidth += width;
									}
								if (!hasMetaCaption && (
									'day' == argsStep
									|| 'month' == argsStep
									)){
									$this.$sections.eq(0).append(
										getMetaCaptionHtml(args[0])
										);
									}
								})();
					this.renderGrid();
					this.renderBars();
					this.renderLineCharts();
					}
				
				
				this.render_legend();
				return this;
				}
	 		
	 		
	 		
	 		};
	 		
	 		
	 window['Vzr'] && Vzr.registerEngine('histogram', vzrHistogram);
 	})();
 
 
 



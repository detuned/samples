/** 
 * @include "./widget_core.js"
 * @include "./widget_report.js"
 * @include "../js/geomap.js"
 */
 
 ;(function(){
 	
 	
 	/* Class: table */
 	WidgetCore.registerEngine({
 		rpr:		'hierarchical',
 		'class':	'table'
 		},{
 			
 		render:function(){
 			this.render_table({
 				showTotal:true
 				});
 			}
 			
 		});
 		
 	WidgetCore.registerEngine({
 		rpr:		'hierarchical',
 		'class':	'table',
 		'w':		2
 		},{
 			
 		render:function(){
 			this.render_table({
 				sparklines: true
 				});
 			}
 			
 		});
 		
 		
 	/* Class: list */
 	WidgetCore.registerEngine({
 		rpr:		'hierarchical',
 		'class':	'list'
 		},{
 		
 		render:function(){
 			this.render_list();
 			}
 		});
 	
 		
 	/* Class: pie
	 * Report: sources
	 */
	WidgetCore.registerEngine({
 		rpr:		'hierarchical',
 		report:		'sources',
		'class': 	'pie'
		}, $.extend({}, 
				WidgetCore.ClassPieBase, {
				 run: function(){
				 	var 
				 		$this = this,
				 		segment = this.reportData.segments[0],
				 		sset = {
	 						name: 'transitions_sum'
	 						},
		 				ssetPercent = {
	 						name: 'transitions_sum_verticalpercent'
	 						}
		 			this.data.widget.data.columns = [
		 				{
			 				segment: 	segment.id,
			 				'set':		sset.name
			 				},
			 			{
			 				segment: 	segment.id,
			 				'set':		ssetPercent.name
			 				}
			 			];
			 		if (this.customField){
				 		this.customField.setOptions([{
				 			value:		sset.name,
				 			caption:	[
								segment.title,
								$this.getSetTitle(sset.name).toString().toLocaleLowerCase()
								].join(', '),
							data: {
								'set':		sset,
								'segment':	segment
								}
				 			}]);
				 		this.customField.disable();
				 		}
					WidgetCore.ClassPieBase.run.apply(this);
					}
				}
			));	
			
 	/* Class: pie */
 	 WidgetCore.registerEngine({
 		rpr:		'hierarchical',
		'class': 	'pie'
		}, $.extend({}, 
				WidgetCore.ClassPieBase, {
				
				}
			)); 
			
			
			
			
 	/* Class: geomap */
 	WidgetCore.registerEngine({
 		rpr:		'hierarchical',
		'class': 	'geomap'
		},{
			
		_geomap:					undefined,
		/** @type {JsGeomap()} */
		_geomapJs : 	undefined,
		_globalMouseWheelBinded: 	false,
		container:function(c){
			this._superMethod('container', c);
			if (c){
				this.$content.html([
					'<div class="openstat-report-widget-geomap-container"></div>'
					].join(''));
				this.$geomap = this.$content.find('>div.openstat-report-widget-geomap-container');
				}
			},
			
		run:function(){
			this.globalMessage(false);
			this.render();
			},
		render:function(){
			this.render_geomap();
			},
		render_geomap:function(){
			if (
				this.settings.useJsChartOnly ||
				(
					!this.settings.requiredSwfVer && 
					!this.settings.requiredSwfVerAlt && 
					!BROWSER.isIE)){
				return this.render_geomapJs();	
				}
			var
				$this = this,
				/** @type {jQuery} */
				$geomap = (this.$geomap && this.$geomap.length)
					? this.$geomap
					: this.$content,
				geomapData = this.getGeomapData(true);
			if ( geomapData.rest_host_flash ){
				geomapData.rest_host = geomapData.rest_host_flash;
				}
			if (
				(
					!this._geomap && 
					!(this._geomap = $flashMovie('report_geomap_widget_' + $this.getInstanceId()))
					) 
				|| !this._geomap.refresh 
				){	
				$geomap.html($flash({
					src:		$this.settings.geomapSrc,
					version:	$this.settings.geomapSwfVer,
					name:		'report_geomap_widget_' + $this.getInstanceId(),
					params:		geomapData,
					noFlash: 	message('noFlashRequired')
					}));
				if (!BROWSER.isIE && !this._globalMouseWheelBinded){
					;(function(){
						
						var 
							isOver = false,
							fl = $flashMovie('report_geomap_widget_' + $this.getInstanceId()),
							onDraggingOut = function(){
								if (fl && fl.releaseOutside){
									fl.releaseOutside();
									}
								$(document.body).unbind('mouseup', onDraggingOut);
								},
							timer,
							lastWheelOver = undefined,
							wheelUsed = false,
							tick = function(){
								if (timer){
									return;
									}
								if (wheelUsed){
									lastWheelOver = isOver;
									timer = setTimeout(function(){
										clearTimeout(timer);
										timer = undefined;
										tick();
										}, 500);
									}
								wheelUsed = false;
								};
						$('#dashboard')	
							.bind('mousewheel', function(/* Event */e, delta){
								if (isOver && lastWheelOver === true &&  fl && fl.zoomIn && fl.zoomOut){
									if (delta > 0){
										fl.zoomIn();
										}
									else{
										fl.zoomOut();
										}
									return false;
									}
								wheelUsed = true;
								tick();
								});
						$geomap
							.mousedown(function(){
								$(document.body).bind('mouseup', onDraggingOut);
								})
							.mouseup(function(){
								$(document.body).unbind('mouseup', onDraggingOut);
								})
							.hover(
								function(){
									isOver = true;
									},
								function(){
									isOver = false;
									}
								);
						})();
					this._globalMouseWheelBinded = true;
					}
				}
			else{
				this._geomap.refresh(geomapData);
				}
			},
		render_geomapJs : function(){
			var $this = this;
			if (!window.JsGeomap){
				WidgetCore.scriptLoad(
					'/a/js/lib/jquery.svg.js', 
					'/a/js/lib/jquery.svganim.min.js', 
					'/a/tracker/report/vzr/engines/geomap/geomap_svg.js', 
					function(){
						$this.render_geomapJs();
						});
				return;
				}
			var
				/** @type {jQuery} */
				$geomap = (this.$geomap && this.$geomap.length)
						? this.$geomap
						: this.$content;
			if (!this._geomapJs){
				this._geomapJs = JsGeomap({
					$container	: $geomap.addClass('geomap-js')
					})
				}
			this._geomapJs.refresh(this.getGeomapData());
			},
		getGeomapData:function(serialize){
			var
				$this = this,
				columns = (function(){
					var 
						res = [];
					if ($this.data.widget.data.columns && $this.data.widget.data.columns[0]){
						res.push(
							$this.data.widget.data.columns[0].segment,
							$this.getSetFullName($this.data.widget.data.columns[0]['set'])
							);
						}
					return serialize ? res.join('%0D') : res;
					})(),
				date = (function(){
					var
						limits = $this.getDateLimits(),
						_res ={
							from 	: $this.settings.date.from.duplicate(),
							to 		: $this.settings.date.to.duplicate()
							};
					if ( _res.to.greater( limits.max ) ){
						_res.to = limits.max.duplicate()
						}
					if ( _res.from.greater( _res.to ) ){
						_res.from = _res.to.duplicate()
						}
					return _res;
					})(),
				geomapData = {
					counter_id:			$this.data.widget.counter  && $this.data.widget.counter.url
											? encodeURIComponent( $this.data.widget.counter.url )
											: encodeURIComponent(counterCompactUrl()) || encodeURIComponent( data.counterId || $this.counterData.id),
					report_id:			$this.reportData.id,
					level:				$this.data.widget.data.level,
					detalisation:		$this.data.widget.data.detalisation,
					rest_host:			$this.settings.host,
					rest_host_flash:	$this.settings.flashHost,
					rest_url:			$this.settings.restUrlColumns,
					columns:			columns,
					primary_column:		0, 					
					date_from:			serialize 
											? date.from.getTimeStamp() 
											: date.from,
					date_to:			serialize
											? date.to.getTimeStamp() 
											: date.to,
					lang:				$this.settings.lang,
					
					country_hue_min:	166,
					country_hue_max:	169,
					country_saturation_min: 0.3,
					country_saturation_max: 0.3,
					country_brightness_min: 0.88,
					country_brightness_max: 0.62,
					
					region_hue_min:	166,
					region_hue_max:	169,
					region_saturation_min: 0.3,
					region_saturation_max: 0.3,
					region_brightness_min: 0.88,
					region_brightness_max: 0.62,
					
					district_hue_min		: 166,
					district_hue_max		: 169,
					district_saturation_min	: 0.3,
					district_saturation_max	: 0.3,
					district_brightness_min	: 0.88,
					district_brightness_max	: 0.62
					};
			if ( $.isPlainObject( $this.data.widget.data.geomap ) ){
				$.extend( geomapData , $this.data.widget.data.geomap );
				}
			return geomapData;
			}
		});
 	
 	})();
 	
 	/* Class: stackchart */
 	WidgetCore.registerEngine({
 		rpr:		'hierarchical',
 		'class':	'stackchart'
 		},{
 		/** @type {StackChart()} */
 		_stackChart : undefined,
 		/** @type {jQuery} */
 		$stachChartContainer : undefined,
 		/** @type {jQuery} */
 		$totalContainer : undefined,
 		render : function(){
			this.render_stackchart();
 			},
 		
 		/** @type {Object} */
 		_sortHash : undefined,	
 			
 		purgeValues : function(raw){
 			var 
 				$this = this,
 				/** @type {Array} */
 				res = this._superMethod('purgeValues', raw);
 			if ( 
 				res 
 				&& res.length 
 				&& this.data.widget.data.attrOrder 
 				&& this.data.widget.data.attrOrder.length
 				){
 				if ( ! this._sortHash ){
 					this._sortHash = {};
 					for (var i = 0, l = this.data.widget.data.attrOrder.length; i < l; i++) {
 						this._sortHash[ this.data.widget.data.attrOrder[i] ] = i;
 						}
 					}
 				res.sort(function(a, b){
 					if ( ! isNaN( $this._sortHash[a.v] ) && ! isNaN( $this._sortHash[b.v] ) ){
 						return $this._sortHash[a.v] > $this._sortHash[b.v]
 							? 1
 							: -1
 						}
 					return 0;
 					});
 				}
 			return res;
 			},
 			
 		render_stackchart : function(){
 			var 
 				$this = this,
 				columns = this.data.widget.data.columns || [],
 				values = [],
 				total = [],
 				cl = arguments.callee;
 			if (!window['StackChart']){
				/* At first loading js file containing stackchart engine */
				if (!cl.loaded){
					this._core.scriptLoad(this.settings.stackchartEngineSrc, function(){
						cl.loaded = true;
						$this.render_stackchart();
						});
					}
				return;
				}
			values = (function(){
				var
					v = [],
					_v = {
						title 	: undefined,
						value	: undefined
						},
					_item;
				if ($this.values.length){
					for (var i = 0, l = $this.values.length; i < l; i++) {
						_item = $this.values[i];
						if (_item.v == '-'){
							/* Sum value */
							if ($this.data.widget.showTotal){
								for (var j = 0, k = _item.c.length; j < k; j++) {
									total[j] = Number(_item.c[j]);
									}
								}
							continue;
							}
						v.push({
							title : $this.getAttributeOutput(_item),
							value : _item.c[0]
							});
						}
					}	
					
				return v;
				})();
 			if (!this._stackChart){
 				this.$stachChartContainer = $('<div/>').appendTo($this.$content);
				this._stackChart = StackChart({
					$container					: $this.$stachChartContainer,
					valuesUnitCaption			: '%',
					total						: 100,
					maxPartsNum					: $this.data.widget.data.maxPartsNum || 4,
					minPartFactor				: $this.data.widget.data.minPartFactor,
					captionsDecimalPlacesNum 	: 1
					});
				}
			if (this.data.widget.showTotal){
				if (!this.$totalContainer){
					this.$totalContainer = $('<div class="openstat-report-widget-total" />')
						.appendTo(this.$content);
					}
				this.$totalContainer.html([
					'<span>',
						_('Total'), 
					'</span> ',
					'<strong>',
						Number(total[1]).format(),
					'</strong>'
					].join(''));
				
				}
			if (this.values.length){
				this.globalMessage(false);
				this._stackChart
					.setValues(values)
					.render();
				}
			else{
				this.globalMessage();
				}
 			}
 		});
 	
 	/* Class: histogram */
 	WidgetCore.registerEngine({
 		rpr			: 'hierarchical',
 		'class'		: 'histogram'
 		}, {
 		
 		/** @type {histogram()} */
 		_histoChart : undefined,
 		
 		render : function(){
 			this.render_histogram();
 			},
 			
 		/** @type {Vzr.Instance()} */
 		_vzr : undefined,
 			
 		render_histogram : function(){
 			var 
 				$this = this,
 				columns = this.data.widget.data.columns || [],
 				histoChartData,
 				data;
 			this.loadVzr(function(){
 				if ( ! $this._vzr){
 					$this._vzr = Vzr.Instance({
 						type 		: 'histogram',
 						container	: $this.$content
 						});
 					}
				var
					/** @type {Array} */
					values = $this.values,
					vzSettings = $.extend({
						argsType			: 'attribute',
						setType 			: 'absolute',
						showAxisNames	 	: true,
						useBalloon			: $this.data.widget.data.useBalloon === true,
						displayBarCaptions	: $this.data.widget.data.displayBarCaptions !== false,
						renderLegend		: false
						}, $this.data.widget.data.vzSettings || {}),
					vzSetType = vzSettings.setType,//FIXME
					noEmptyItems = 0,
					data = (function(){
						var
							_item,
							num = 0,
							vc = $this.data.widget.data.columns || [],
							sets = [],
							args = {
								meta : {
									title : $this.data.widget.data.xAxisName || ''
									},
								values : []
								},
							hlInd = undefined;
						//FIXME
						for (var i = 0, l = vc.length; i < l; i++) {
							sets.push({
								meta : {
									title : $this.data.widget.data.yAxisName || $this.getSetTitle(vc[i]['set']),
									unitCaption :  String(vc[i]['set']).indexOf('percent') + 1
										? '%'
										: ''
									},
								values : [],
								type : 'numeric'
								});
							}
						if (values.length){
							for (var i = 0, l = values.length; i < l; i++) {
								_item = values[i];
								if (_item.v == '-'){
									continue;
									}
								if (
									$this.data.widget.data.highlightAttr 
									&& _item.v == $this.data.widget.data.highlightAttr
									){
									args.meta.highlightValue = args.values.length;	
									}
								args.values.push($this.getAttributeOutput(_item));
								for (var j = 0, k = vc.length; j < k; j++) {
									sets[j].values.push(_item.c[j]);
									noEmptyItems += _item.c[j] ? 1 : 0;
									}
								if (vzSettings.argsLimit && ++num  >= vzSettings.argsLimit ){
									break;
									}
								}
							}
						return {
							args 	: args,
							sets	: sets
							};
						})();
				if (!noEmptyItems){
					$this.globalMessage();
					return;
					}
				$this.globalMessage(false);
				$this._vzr.setData(data.sets);
				var ds = $this._vzr.appendDataSet(data.args);
				ds.setMeta('arguments', true)
				$this._vzr.vzSettings(vzSettings);	
				$this._vzr.refresh();
 					
 				});	
 				
 			return;	
 				
 			if (!window['HistoChart']){
				/* At first loading js file containing histochart engine */
				if (!arguments.callee.loaded){
					this._core.scriptLoad(this.settings.histochartEngineSrc, function(){
						$this.render_histochart();
						});
					}
				arguments.callee.loaded = true;
				return;
				}
			/* Composing data for histoChart */
			 histoChartData = (function(){
				var
					_item,
					sets = [{
						values : []
						}],
					params = [],
					_num = 0;
				if ($this.values.length){
					for (var i = 0, l = $this.values.length; i < l; i++) {
						_item = $this.values[i];
						if (! $this.isItemDisplayable(_item)){
							continue;
							}
						_num ++;
						if ($this.data.widget.data.limit && _num > $this.data.widget.data.limit){
							break;
							}
						params.push($this.getAttributeOutput(_item));
						if (_item._c && _item._c.length){
							sets[0].values.push(_item._c[0]._factor);
							}
						}
					}
				return {
					params 	: params,
					sets	: sets
					};
				})(); 
			if (!this._histoChart){
				this._histoChart = HistoChart({
					$container					: $this.$content,
					chartPaddingTop				: 15,
					valuesUnitCaption			: '%',
					maxGridLines				: 3,
					displayBarCaptions			: true,
					captionsDecimalPlacesNum	: 1,
					useBalloon					: false
					})
					.setParams(histoChartData.params);
				}
			if (histoChartData.sets[0] 
					&& histoChartData.sets[0].values 
					&& histoChartData.sets[0].values.length
					){
				this.globalMessage(false);
				this._histoChart
					.setValues(histoChartData.sets)
					.render();
				}
			else{
				this.globalMessage();
				}
			
 			}
 		
 		});
 	
WidgetCore.loadedFiles['hierarchical'] = true;
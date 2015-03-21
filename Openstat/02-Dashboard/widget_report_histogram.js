/** 
 * @include "./widget_core.js"
 * @include "./widget_report.js"
 * @include "../vzr/vzr.js"
 */
 
 ;(function(){
 	
 	WidgetCore.registerEngine({
 		rpr:		'histogram'
 		},{
 		_set:					'',
 		_segment:				0,
 		_maxColumnsNum:			6,
 		_rowsPerAttribute:		1,
 		_hasNotEmptyValues:		false,
 		_globMaxFactor:			100,
 		_segmentsOrder:			{},
 		_valuesMeta:			{},
 		
 		getGradStr:function(val, forceNext){
			var 
				$this = this,
				grad = (Number(val) - 1) || 0,
				grads = this.reportData.grads;			
			if (!grads){
				return 'unknown';
				}
			
			var 
				endingType = (this.reportData.grads_title.toLowerCase() || '').split('.').pop(),
				gradVal = Number(grads[grad]),
				nextGradVal = Number(grads[grad + 1]),
				isTime = this.reportData._config.attrTypeTime || (endingType == 'sessionduration');
			if (isTime){
				if ( ! ( endingType = this.reportData._config.attrTimeDetalisation)){
					endingType = 'seconds';
					if (gradVal / 60 > 1){
						endingType = 'minutes';
						gradVal = Math.floor(gradVal/60);
						nextGradVal = Math.round(nextGradVal/60)+1;
						}
					}
				}
			var getEnding = function(num, isGenetive){
				var 
					v = $this.reportData.id == 'time' ? Number(num).setDigits(2) : num,
					p = '(1) '+ endingType + (isGenetive?' (gn)':'');
				return $this.data.widget.data.attr_repr == 'simple'
					? v
					: _(p, v);
				}
			if (grad < 0 ){
				return '&lt;&nbsp;' + getEnding(nextGradVal,true);
				}
			if (nextGradVal && !forceNext){
				if ((nextGradVal - gradVal)>1){
					return gradVal + '&nbsp;— ' + getEnding(nextGradVal - 1);
					}			
				}
			else{
				return [
					isTime
						? '≥'
						: '&gt;',
					'&nbsp;',  
					getEnding(
						isTime || gradVal ==  1
							? gradVal
							: gradVal - 1,
						true
						)
					].join('');
				}
			return getEnding(gradVal);
			},
			
		isItemDisplayable:function(item){
			var res = true;
			if ( item.v == 0 ){
				if (
					this.reportData.id == 'pageviewsonvisit' || 
					this.reportData.id == 'pageviewsonvisitor'
					){
					return false;
					}
				res = false;
				for (var i = 0; i < item._c.length; i++){
					if ( item._c[i] != undefined && 
						item._c[i].v != 0 && 
						String(item._c[i].v).toLowerCase() != 'nan'
						){
						res = true;
						break;
						}
					}
				}
			return res;
			},
			
		purgeValues:function(raw){
 			var 
				$this = this,
				
				/** @type {Array} Loaded values */
				values = [],
				
				/** @type {Array} Sum values by columns */
				sum = [],
				
				limit = this.data.widget.data.limit || 0,
				
				aggregateItem = {
					c 	: [],
					_c 	: [],
					r	: []
					};
				
			this._globMaxFactor = 0;
				
			
			if (!raw || !raw.report || !raw.report.item || !raw.report.item[0]){
				return [];
				}
			this._valuesMeta = raw.report.meta || {};
				
			/* Counting values sum by every columns */
				$.each(raw.report.item,function( num ){
					if ( this.v == '-'){
						for (var i = 0; i < this.c.length; i++){
							if (this.c[i] == undefined || String(this.c[i]).toLowerCase() == 'nan'){
								continue;
								}
							sum[i] = Number(this.c[i]);
							}
						raw.report.item.splice( num , 1 );
						return false;
						}
					});
			
			this.valuesTotal = sum;
			$.each(raw.report.item, function(num){
				this.v = Number(this.v);
				this._c = [];
				for (var i = 0; i < this.c.length; i++){
					this._c[i] = {
						v: this.c[i],
						_factor: sum[i] ? ( 100 * Number(this.c[i]) / sum[i] ).roundFloat() : 0
						}
					!isNaN(this._c[i]._factor) && 
						($this._globMaxFactor = Math.max($this._globMaxFactor , this._c[i]._factor));
						
					if (limit && num >= limit - 1){
						if (!aggregateItem._c[i]){
							aggregateItem._c[i] = {
								v : 0,
								_factor : 0
								}
							}
						if ( ! isNaN( Number( this.c[i] ) ) ){
							aggregateItem.c[i] = (aggregateItem.c[i] || 0) + Number(this.c[i]);
							aggregateItem._c[i].v += Number(this._c[i].v);
							aggregateItem._c[i]._factor += Number(this._c[i]._factor);
							}
						if (!aggregateItem.r.length){
							aggregateItem.r = [$this.getGradStr(this.v, true)];
							}
						}	
						
					}
				this.r=[$this.getGradStr(this.v)];	
				});
			if (limit && raw.report.item.length >= limit){
				raw.report.item = raw.report.item.slice(0, limit - 1);
				/* if (this.reportData.grads && this.reportData.grads.length){
					this.reportData.grads = this.reportData.grads.splice(0, limit - 1);
					} */
				for (var i = 0, l = aggregateItem._c.length; i < l; i++) {
					aggregateItem._c[i]._factor = Number(aggregateItem._c[i]._factor).roundFloat(); 
					}
				raw.report.item.push(aggregateItem);
				}
			return raw.report.item;
 			},
 			
			
		getAttributeOutput:function(item){
			var 
				attrStr = this.getAttributeR(item) || this.getGradStr(item['v']);
			return [
				attrStr
				].join('')
			}
 		});
 	
 	
 	/* Class: table */
 	WidgetCore.registerEngine({
 		rpr:		'histogram',
 		'class':	'table'
 		},{
 		
 		initialize:function(data, $container){
 			this._superMethod('initialize', data, $container);
 			if (this.reportData.sets[0]){
				this._set = this.reportData.sets[0]['name'];
				}
			if (!this.data.widget.data.columns || !this.data.widget.data.columns.length){
				this.data.widget.data.columns = [{
					segment: 0, 
					'set': this._set, 
					visibility: true
					}];
				}
			this.data.widget.data.primary_column = 0;
			this._isOneUnitInterval = false;
			this._isMultiSets = !!(this.reportData.sets && this.reportData.sets.length > 1);
 			},
 			
		
 		
 		render:function(){
 			this.render_table();
 			},
 		render_table:function(){
 			var
 				html = [],
 				columns = this.data.widget.data.columns || [],
 				dispCorrection = this._globMaxFactor ? (100 / this._globMaxFactor) : 1,
 				_dispFactor,
 				_item,
				_val,
				_dval,
				
				/** @type {Object} Current column */
				_col,
				
				/** @type {Object} Current metric */
				_metric,
				
				/** @type {String} Metric sign to display in every col cell */
				_metricSign,
				
				_isEmpty = false,
				
				_attr,
				_num = 0;
				
 			if (this.values.length){
				for (var i = 0, l = this.values.length; i < l; i++) {
					_item = this.values[i];
					if (!this.isItemDisplayable(_item)){
						/* Sum value */
						continue;
						}
					_num ++;
					if (this.data.widget.data.limit && _num > this.data.widget.data.limit){
						break;
						}
					_attr = this.getAttributeOutput(_item);
					html.push(
						'<tr>',
							'<th scope="row">',
								'<span class="item-name-core" title="' , htmlspecialchars(_attr) , '">',
									'<span class="attribute-name">',
										_attr,
									'</span>',
								'</span>',
								'<span class="fader"></span>',
							'</th>'
							);
						_col = columns[0];
						_isEmpty = !!(
							_item._c[0].v == undefined || 
							String(_item._c[0].v).toLowerCase() == 'nan'
							);
						_dispFactor = _item._c[0]._factor * dispCorrection;
						html.push(
							'<td class="item-val">',
								'<span class="cell cell-clickable cell-scaled',
									'">',
									'<span class="scale-wrap">',
										'<span class="scale">',
											'<span class="bar" style="width:', _dispFactor, '%;', 
												(_dispFactor == 0
													? 'border:none;'
													: ''),
												'">',
												'<span class="label">',
													(_isEmpty 
														? '&mdash;' 
														: String(_item._c[0]._factor).numberFormat(2) + '%'),
												'</span>',
											'</span>',
										'</span>',
									'</span>',
								'</span>',
								'<span class="fader"></span>',
							'</td>');
					html.push('</tr>');
					}
				if (html.length){
					html.unshift('<table class="openstat-report-widget-table"><tbody>');
					html.push('</tbody></table>');
					}
				}
 			this.$content.html(html.join(''));
 			}
 		
 			
 		});
 	
 	/* Class: pie */
 	WidgetCore.registerEngine({
 		rpr:		'histogram',
		'class': 	'pie'
		}, $.extend({
			}, WidgetCore.ClassPieBase, {
			pieAttrFunc: function(){
				return arguments[0] && arguments[0][0]
					? this.getGradStr(arguments[0][0])
					: undefined;
				}
			}));
 	
 	})();
 	
 	
 	/* Class: histogram */
 	WidgetCore.registerEngine({
 		rpr			: 'histogram',
 		'class'		: 'histogram'
 		}, {
 		
 		/** @type {histogram()} */
 		_histoChart : undefined,
 		
 		initialize:function(data, $container){
 			this._superMethod('initialize', data, $container);
 			if (this.reportData.sets[0]){
				this._set = this.reportData.sets[0]['name'];
				}
			if (!this.data.widget.data.columns || !this.data.widget.data.columns.length){
				this.data.widget.data.columns = [{
					segment: 0, 
					'set': this._set, 
					visibility: true
					}];
				}
			if (!this.data.widget.data.attr_repr){
				this.data.widget.data.attr_repr = 'simple';
				}
			this.data.widget.data.primary_column = 0;
			this._isOneUnitInterval = false;
			this._isMultiSets = !!(this.reportData.sets && this.reportData.sets.length > 1);
 			},
 		
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
					vzSettings = {
						setType 			: 'absolute',
						showAxisNames 		: true,
						useBalloon			: $this.data.widget.data.useBalloon === true,
						displayBarCaptions	: $this.data.widget.data.displayBarCaptions !== false,
						renderLegend		: false
						},
					vzSetType = vzSettings.setType,//FIXME
					noEmptyItems = 0,
					data = (function(){
						var
							_item,
							vc = $this.data.widget.data.columns || [],
							sets = [],
							_num = 0,
							args = {
								values : [],
								meta : {
									title : _($this.reportData.grads_title).split(',').shift()//XXX Dirty hack
									}
								};
						for (var i = 0, l = vc.length; i < l; i++) {
							sets.push({
								meta : {
									title : String($this.getSetTitle(vc[i]['set'])).split(',').shift(),
									unitCaption :  vzSetType == 'percent' || String(vc[i]['set']).indexOf('percent') + 1
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
								if (! $this.isItemDisplayable(_item)){
									continue;
									}
								_num ++;
								if ($this.data.widget.data.limit && _num > $this.data.widget.data.limit){
									break;
									}
								args.values.push($this.getAttributeOutput(_item));
								if (_item._c && _item._c.length){
									for (var j = 0, k = _item._c.length; j < k; j++) {
										sets[j].values.push(
											vzSetType == 'percent'
												? _item._c[j]._factor
												: _item._c[j].v
											);
										if (_item._c[j]._factor){
											noEmptyItems ++;
											}
										}
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
				$this._vzr.vzSettings(vzSettings);	
				$this._vzr.setData(data.sets);
				var ds = $this._vzr.appendDataSet(data.args);
				ds.setMeta('arguments', true)
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
 	
WidgetCore.loadedFiles['histogram'] = true;
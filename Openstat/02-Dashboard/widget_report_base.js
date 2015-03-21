/** 
 * @include "./widget_core.js"
 * @include "./widget_report.js"
 */

	
	WidgetCore.registerEngine({
		'rpr': 			'base',
		'class': 		'chart'
		},
		{
		
		/** @type {jQuery} */
		$legend:		undefined,
		/** @type {jQuery} */
		$legendHeader:	undefined,
		/** @type {jQuery} */
		$separator:		undefined,
		
		container:function(c){
			this._superMethod('container', c);
			if (c){
				this.$content.html([
					'<div class="openstat-report-widget-base-legend"></div>',
					'<div class="openstat-report-widget-base-chart"></div>'
					].join(''));
				this.$legend = this.$content.find('>div.openstat-report-widget-base-legend');
				this.$chart = this.$content.find('>div.openstat-report-widget-base-chart');
				}
			},
			
		run:function(){
			/* Starting chart rendering before loading complete */
			this.render_chart();
			this._superMethod('run');
			},
			
		composeUrl:function(){
			var 
				uriParts = [];
			uriParts.push(
				this.settings.restUrl,
				counterCompactUrl() || encodeURIComponent(this.counterData.id),
				'summary',
				this.settings.date.to.format('Y-m-d')
				);
			return uriParts.join('/') + '.json';
			},
			
		purgeValues:function(raw){
			var values = [];
			if (raw && raw['report'] && raw['report']['attendance_day']){
				values = raw['report'];				
				}
			return values;
			},
			
		render: function(){
			if (!this.$separator || !this.$separator.length){
				this.$separator = $('<span class="openstat-report-widget-base-separator"></span>')
					.appendTo(this.$body);
				}
			if (!this.$legendHeader || !this.$legendHeader.length){
				this.$legendHeader = $('<span class="openstat-report-widget-base-legend-header">&nbsp;</span>')
					.prependTo(this.$header);
				}
			this.render_legend();
			},
		render_legend: function(){
			if (!this.values['attendance_day'] || !this.values['attendance_day']['date']){
				this.$legend.html(message('noData'))
				return false;
				}
			var 
				day = this.values['attendance_day'],
				date = day.date.toString().dateFromDt(),
				_chartline = {
					'segment':	undefined,
					'set':		undefined,
					'color':	undefined
					},
				_set,
				getLegendRowHtml = function(s, color){
					return [
						'<li>',
							'<h4>', 
								s.title , '<span class="line-color"',
									(
										color
											? ' style="background-color:' + color
											: ''
										),'"></span>',
							'</h4>',
							'<div>',
								'<strong>',
								(
									day[s.name] != undefined && day[s.name].toString().toLowerCase() != 'nan'
										? Number(day[s.name]).format() + 
											(s.name == 'bouncerate' ? '%' : '')
										: '<span class="none">&mdash;</span>'
									),
								'</strong>',
							(
								day[s.name + '_change'] != undefined
									? getDiffSign(day[s.name + '_change'])
									: ''
								),
							'</div>',
						'</li>'
						].join('');
					},
				html = [];
			this.$legendHeader.html([
				'<strong>',
					_('per (1)', date.format('d M')).toString().firstCharUpper(), 
				'</strong> ',
				(is_valid_date(date)
					? '(' + date.format('r') + ')' 
					: '')
				].join(''));
			if (this.data.widget.data.chartlines){
				html.push('<ul>');
				for (var i = 0, l = this.data.widget.data.chartlines.length; i < l; i++) {
					_chartline = this.data.widget.data.chartlines[i];
					if (_chartline['set']){
						try{
							_set = this.reportData.allSets[_chartline['set'].toString().split('_').shift()];
							} catch (e){};
						if (_set && _set.title){
							html.push(getLegendRowHtml(_set, _chartline.color));
							}
						}
					}
				/* Adding bouncerate */
				day['bouncerate'] != undefined && 
					html.push(getLegendRowHtml({
						name: 'bouncerate',
						title: _('-counters-stat-set-bouncerate')
						}));
				html.push('</ul>');
				}
			this.$legend.html(html.join(''));
			}
		});
	
	/**
	 * Special virtual report for domains indexpage
	 */ 
	(function(){
		
		var 
			domainsCountPrototype = {
				/** @type {jQuery} */
				$legend:		undefined,
				/** @type {jQuery} */
				$legendHeader:	undefined,
				/** @type {jQuery} */
				$separator:		undefined,
				
				/** @type {Date} */
				statDate : new Date(),
				
				_counterEntityId : window.SEID && window.SEID.entity_id ? encodeURIComponent(window.SEID.entity_id) : undefined,
				
				run : function(){
					var $this = this;
					
					var 
						maxPossibleSideTo = this.reportData.maxPossibleDates && this.reportData.maxPossibleDates[DETALISATION_DAILY]
							? this.reportData.maxPossibleDates[ DETALISATION_DAILY ]
							: this.getDateLimits('max');
					if (this.statDate.greater(maxPossibleSideTo)){
						this.statDate = maxPossibleSideTo;
						if (!this._counterEntityId){
							this.settings.date.to = this.statDate;
							}
						}
						
					if ( this.data.widget.data.detalisation == DETALISATION_MONTHLY ){
						this.settings.date.from = this.getDateLimits('min');
						}
					
					/* Starting chart rendering before loading complete */
					this.render_chart();
					
					this.load(function(){
						$this.render();
						});
					},
				
				
				container:function(c){
					/* Hack to avoid multi extending bug */
					WidgetCore.Engines.WidgetReport.prototype.container.apply(this, arguments);
					if (c){
						this.$content.html([
							'<div class="openstat-report-widget-base-legend"></div>',
							'<div class="openstat-report-widget-base-chart"></div>'
							].join(''));
						this.$legend = this.$content.find('>div.openstat-report-widget-base-legend');
						this.$chart = this.$content.find('>div.openstat-report-widget-base-chart');
						}
					},
				composeUrl : function(){
					return ( this._counterEntityId
								? '/rest/_stats/' + this._counterEntityId + '/' + this.settings.date.to.format('Y-m-d') 
								: '/_stats/' + this.statDate.format('Y-m-d')
							); 
					},
					
				purgeValues : function(v){
					return v;
					},
				render: function(){
					if (!this.$separator || !this.$separator.length){
						this.$separator = $('<span class="openstat-report-widget-base-separator"></span>')
							.appendTo(this.$body);
						}
					if (!this.$legendHeader || !this.$legendHeader.length){
						this.$legendHeader = $('<span class="openstat-report-widget-base-legend-header">&nbsp;</span>')
							.prependTo(this.$header);
						}
					this.render_legend();
					},
				render_legend : function(){
					var 
						/** @type {Date} */
						date;
					if (this._counterEntityId){
						/* Concrete counter */
						date = this.settings.date.to;
						this.render_legend_counter();
						}
					else{
						/* Global */
						date = this.statDate;
						this.render_legend_global();
						}
					this.$legendHeader.html([
						'<strong>',
							_('per (1)', date.format('d M')).toString().firstCharUpper(), 
						'</strong> ',
						'(', date.format('r'), ')' 
						].join(''));
					},
				render_legend_counter : function(){
					var
						$this = this,
						getLegendRowHtml = function(s, color){
							return [
								'<div class="legend-section legend-section-light">',
									'<h4 class="legend-section-title">',
										s.title , 
										color &&
											['<span class="line-color"',
												' style="background-color:' + color,
												'"></span>'].join(''),
									'</h4>',
									'<div>',
										'<strong class="legend-section-value">',
											! isNaN( + s.total )
												? Number(s.total).format() + (s.total_unit || '')
												: '&mdash;',
										'</strong>',
										'<span class="legend-section-diff">',
											getDiffSign(s.diff),
										'</span>',
									'</div>',
								'</div>'
								].join('');
							},
						html = [];
					
					this.$legend.html([
						getLegendRowHtml({
							title : _('-widget-domainscount-total-domains'),
							total : $this.values.total,
							diff : $this.values.total_diff
							}, $this.settings.colors[0]),
						getLegendRowHtml({
							title : _('-widget-domainscount-delegated-domains'),
							total : $this.values.delegated,
							diff : $this.values.delegated_diff
							}, $this.settings.colors[1]),
						getLegendRowHtml({
							title : _('-widget-domainscount-delegated-percent-domains'),
							total : $this.values.delegated_percent,
							total_unit : '%', 
							diff : $this.values.delegated_percent_diff
							})
						].join(''));
					},
				render_legend_global : function(){
					var
						getLegendRowHtml = function(s, color){
							return [
								'<div class="legend-section">',
									'<h4 class="legend-section-title">',
										'<a href="' , s.url , '">',
											s.title , 
										'</a>',
										'<span class="line-color"',
											color && (' style="background-color:' + color),
											'"></span>',
									'</h4>',
									(
										! isNaN( + s.total)
											? ['<h3 class="legend-section-subtitle">' , _('-widget-domainscount-total-domains') , '</h3>',
												'<div>',
													'<strong class="legend-section-value">',
														Number(s.total).format(),
													'</strong>',
													'<span class="legend-section-diff">',
														getDiffSign(s.total_diff),
													'</span>',
												'</div>'].join('')
											: ''
										),
									!isNaN( + s.month_add)
										? [
											'<div class="legend-section-add-value">',
												_('-widget-domainscount-monthadd'), ' ',
												'<strong>' , Number(s.month_add).format()  , '</strong>',
											'</div>'
											].join('')
										: ''
										,
								'</div>'
								].join('');
							},
						html = [];
					
					this.$legend.html([
						getLegendRowHtml($.extend({
							title : _('-menu-ru'),
							url : '/tld/ru'
							}, this.values['ru']), this.settings.colors[0]),
						getLegendRowHtml($.extend({
							title : _('-menu-rf'),
							url : '/tld/рф'
							}, this.values['xn--p1ai']), this.settings.colors[1])
						].join(''));
					
					}
				}; 
		
		WidgetCore.registerEngine({
			'rpr': 			'base',
			'class': 		'chart',
			'report':		'domainsdynamic'
			}, $.extend({}, domainsCountPrototype));
			
		WidgetCore.registerEngine({
			'rpr': 			'base',
			'class': 		'chart',
			'report':		'domainscount'
			}, $.extend({}, domainsCountPrototype));
		})();
			
	/* Class: stackchart */
 	WidgetCore.registerEngine({
 		rpr:		'base',
 		'class':	'stackchart'
 		},{
 		/** @type {StackChart()} */
 		_stackChart : undefined,
 		composeUrl : function(_data){
 			var url = this._superMethod('composeUrl', _data);
 			url += '&reversed_dates=1'; //FIXME fckngsht
 			return url;
 			},
 		render_custom : function(){
 			var $this = this;
 			this.customOptions = [
				{
					segment		: this.reportData.segments[0],
					'set'		: {
						name : 'transitions_sum_verticalpercent'
						}
					},
				{
					segment		: this.reportData.segments[0],
					'set'		: {
						name : 'sessions_sum_verticalpercent'
						}
					},
				{
					segment		: this.reportData.segments[0],
					'set'		: {
						name : 'visitors_sum_average_verticalpercent'
						}
					}
				];
 			this._superMethod('render_custom');
 			},
 		render : function(){
			this.render_stackchart();
 			},
 			
 		render_stackchart : function(){
 			var 
 				$this = this,
 				columns = this.data.widget.data.columns || [],
 				values = [],
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
							continue;
							}
						
						for (var j = 0, k = _item.c.length; j < k; j++) {
							if (! isNaN( + _item.c[j])){
								v.push({
									title : $this.getSetTitle($this.data.widget.data.columns[j]['set']),
									value : _item.c[j]
									});
								}
							}
						break;
						}
					}	
					
				return v;
				})();
 			if (!this._stackChart){
				this._stackChart = StackChart({
					$container					: $this.$content,
					valuesUnitCaption			: '%',
					total						: 100,
					maxPartsNum					: 4,
					captionsDecimalPlacesNum 	: 1
					});
				}
			if (values.length){
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
			
WidgetCore.loadedFiles['base'] = true;
/** 
 * @include "./widget_core.js"
 * @include "../../../js/lib/jschart.raphael.js"
 */

(function(){
	/** 
	 * Base class for report widgets
	 */
	function Widget(data, $container){
		this.initialize(data, $container);
		}
	Widget.prototype = {
		_widgetEngineName: 'WidgetReport',
		_instanceId:'',
		
		/** @type {WidgetCore} */
		_core:					undefined,
		
		data:{
			w: 	1,
			h: 	1,
			widget:{
				report: 	'',
				custom:		false,
				'class':	'',
				view_id:	'',
				customExt:	undefined,
				data:		{
					detalisation	: DETALISATION_DAILY,
					columns			: [],
					chartlines		: [],
					chart			: {},
					level			: 1,
					limit			: 5,
					attributte		: undefined,
					primary_column	: 0
					}
				},
			onchange:function(){}
			},
		reportData:{
			isAttributive:	true,
			min_date:			{
									hour: 	'2009-01-01 00:00:00',
									day:	'2009-01-01 00:00:00',
									week:	'2009-01-01 00:00:00',
									month:	'2009-01-01 00:00:00'
									},
			max_date:			{
									hour: 	(new Date()).offsetDays(-1).toDT(),
									day:	(new Date()).offsetDays(-1).toDT(),
									week:	(new Date()).offsetDays(-1).toDT(),
									month:	(new Date()).offsetDays(-1).toDT()
									},
			minPossibleDates:	{},
			maxPossibleDates:	{},
			metrics:			{},
			allMetrics:			{},
			sets:				[],
			_segmentsNum:		0,
			segments:			[],
			allSets:			{},
			setTitles:			{},
			iconset : 			undefined,
			iconCss : 			undefined,
			_config : 			{
									iconsCss : '',
									iconsSet : ''
									}
			},
		counterData:{
			id:					'',
			title: 				'',
			url:				''
			},
		
		maxPossibleDates 		: {},	
		minPossibleDates 		: {},	
			
		settings: {
			host: 				'',
			uri:				'',
			url:				'',
			restUrl:			'',
			restUrlColumns:		'',
			lang:				'',
			chartSrc:			undefined,
			chartSwfVer:		undefined,
			pieSrc:				undefined,
			pieSwfVer:			undefined,
			pieSwfVerAlt:		undefined,
			vzrSrc:				undefined,
			geomapSrc:			undefined,
			geomapSwfVer:		undefined,
			date:				{
									from:	(new Date()).offset({months:-1}),
									to:		new Date()
									}
			},
			
		/** @type {Array} */
		customOptions:			undefined,
		
		
		/** @type {jQuery} */
		$containerWrap:			undefined,
		/** @type {jQuery} */
		$container:				undefined,
		/** @type {jQuery} */
		$header:				undefined,
		/** @type {jQuery} */
		$body:					undefined,
		/** @type {jQuery} */
		$content:				undefined,
		/** @type {jQuery} */
		$chart:					undefined,
		/** @type {jQuery} */
		$loader:				undefined,
		/** @type {jQuery} */
		$loaderOverlay:			undefined,
		/** @type {jQuery} */
		$loaderCore:			undefined,
		/** @type {jQuery} */
		$loaderBar:				undefined,
		/** @type {jQuery} */
		$message:				undefined,
		
		/** @type {jQuery} */
		$custom:				undefined,
		/** @type {jQuery} */
		$customField:			undefined,
		
		/** @type {Select} */
		customField:			undefined,
		
		/** @type {window.jschart} */
		_chartJs:				undefined,
		
		_pie:					undefined,
		
		/** @type {Array} */
		pieValues:				undefined,
		
		_isOneUnitInterval: 	false,
		
		trackerReportInterface:	{},
		
		/**
		 * Loaded values 
		 * @type {Array} 
		 */
		values: 				[],
		
		cache: 					{},
		
		
		initialize:function(data, $container){
			var 
				$this = this;
			this._core = WidgetCore;
			this.data = $.extend(true, {}, this.data, data || {});
			
			/* Cannot use recursive extending cause of dates are corrupting */
			this.settings = $.extend({}, this.settings, this._core.settings()); 
			
			if (this.data._counter){
				this.counterData = this.data._counter;
				delete this.data._counter;
				}
			if (this.data._maxPossibleDates){
				this.maxPossibleDates = $.extend({}, this.data._maxPossibleDates);
				delete this.data._maxPossibleDates;
				}
			if (this.data._minPossibleDates){
				this.minPossibleDates = $.extend({}, this.data._minPossibleDates);
				delete this.data._minPossibleDates;
				}
			if (this.data.widget.report == 'domainsage' 
				&& window.SEID 
				&& window.SEID.entity_id == 'рф'){
				this.data.widget.data.limit = (new Date).getFullYear() - 2009;
				}
			
			this.configure();
			this.container($container);
			this.render_header();
			this.render_custom();
			},
			
			
		configure : function(applyNewReport){
			var 
				$this = this;
			if (this.data.widget.report){
				this.reportData = applyNewReport || 1 //FIXME wtf
					? $.extend({}, this.reportData, this._core.getReportData(this.data.widget.report), this.data.widget.reportData || {})
					:  $.extend(true, {}, this._core.getReportData(this.data.widget.report),  this.reportData, this.data.widget.reportData || {});
				if (window['TrackerReport']){
					/*
					 * FIXME For correct separating widget engine 
					 * we cannot using global TrackerReport here 
					 */ 
					this.reportData._config = TrackerReport.Config.getReportConfig(this.reportData);
					if ( this.reportData.iconset && TrackerReport.ICONS_CSS[ this.reportData.iconset ]){
						this.reportData.iconCss =  TrackerReport.ICONS_CSS[ this.reportData.iconset ];
						}
					}
				}
				
			/* Convert data.dates to Date format if its not */
			if (this.data.widget.data.dates){
				if (
					this.data.widget.data.dates.from 
					&& !is_date(this.data.widget.data.dates.from)
					&& !is_date(this.data.widget.data.dates.from = String(this.data.widget.data.dates.from).dateFromDt())
					){
					delete this.data.widget.data.dates.from;
					}
				if (
					this.data.widget.data.dates.to 
					&& !is_date(this.data.widget.data.dates.to)
					&& !is_date(this.data.widget.data.dates.to = String(this.data.widget.data.dates.to).dateFromDt())
					){
					delete this.data.widget.data.dates.to;
					}
				}
			
			/* Setting up max/min possible dates */
			if (this.maxPossibleDates || this.minPossibleDates){
				this.reportData.detalisationAvailable = [];
				$.each([
					DETALISATION_HOURLY,
					DETALISATION_DAILY,
					DETALISATION_WEEKLY,
					DETALISATION_MONTHLY,
					DETALISATION_YEARLY
					],function(){
						var d = this.toString();
						if ($this.minPossibleDates && $this.minPossibleDates[d]){
							$this.reportData.detalisationAvailable.push(d);
							$this.reportData.minPossibleDates[d] = $this.minPossibleDates[d].duplicate();
							}
						else if ($this.reportData.min_date && $this.reportData.min_date[d]){
							$this.reportData.detalisationAvailable.push(d);
							$this.reportData.minPossibleDates[d] = $this.reportData.min_date[d].dateFromDt();
							}
						if ($this.maxPossibleDates && $this.maxPossibleDates[d]){
							$this.reportData.maxPossibleDates[d] = $this.maxPossibleDates[d].duplicate();
							}
						else if ($this.reportData.max_date && $this.reportData.max_date[d]){
							$this.reportData.detalisationAvailable.push(d);
							$this.reportData.maxPossibleDates[d] = $this.reportData.max_date[d].dateFromDt();
							}
						});
				}
				
			/* Switching sets object to array */
			;(function(){
				$this.reportData.allSets = $this.reportData.sets;
				$this.reportData.sets = (function(){
					var setsArray = [];
					is_object($this.reportData.sets) && $.each($this.reportData.sets,function(d){
						$this.reportData.setTitles[this.name] = this.title;
						setsArray.push(this);
						});
					return setsArray;
					})();
				})();
				
			/* Converting segments tree to flat */
			;(function(){
				var ss = {};
				$this.reportData._segmentsNum = 0;
				if ($this.reportData.segments && $this.reportData.segments.length){
					$this.reportData.segmentsList = $this.reportData.segments;
					$this.reportData._segmentsNum = $this.reportData.segments.length;
					for (var i = 0, l = $this.reportData.segments.length; i < l; i++) {
						ss[$this.reportData.segments[i]['id']] = $this.reportData.segments[i];
						}
					$this.reportData.segments = ss;				
					}
				})();
			
			/* Filling up metrics and sets maps */
			;(function(){
				$this.reportData.allMetrics=(function(metrics){
					var res={};
					is_object(metrics) && $.each(metrics,function(m){
						this.suffix && (res[this.suffix] = this);
						});
					return res;
					})($this.reportData.metrics);
				})();
				
			/* Supporting TrackerReport interface */
			this.trackerReportInterface = {
				getData:function(key){
					var d = $.extend({}, $this.data.widget.data, {
						selected: 	$this.data.widget.data.chartlines,
						date:		$this.settings.date,
						remoteHost:	$this.settings.host,
						remoteUrl:	$this.settings.restUrlColumns,
						report:		$this.reportData,
						reportName:	$this.reportData.id
						});
					switch(key){
						case 'counter.id':
							return $this.counterData.id;
						case undefined:
							return d;
						default:
							return d[key]
						}
					}
				}
			
			if (this.data.widget.customOptions && this.data.widget.customOptions.length){
				this.customOptions = (function(){
					var 
						res = [],
						_co;
					for (var i = 0, l = $this.data.widget.customOptions.length; i < l; i++) {
						_co = $this.data.widget.customOptions[i];
						res.push({
							segment 	: {id : _co.segment},
							'set' 		: {name : _co['set']},
							title		: _co.title 
							})
						}
					return res;
					})();
				}
			},
		
		/** 
		 * Sets widget container and creates main needed containers inside
		 */
		container:function(c){
			if (c){
				
				this.$containerWrap = $(c);	
				
				this.$containerWrap.html([
					'<div class="openstat-report-widget">',
						'<div class="openstat-report-widget-header">' , 
						'</div>',
						'<div class="openstat-report-widget-body">',
							'<div class="openstat-report-widget-content">',
							'</div>',
							'<div class="openstat-report-widget-loader">',
								'<span class="openstat-report-widget-loader-overlay"></span>',
								'<div class="openstat-report-widget-loader-core">',
									'<span class="openstat-report-widget-loader-text">', _('Loading...') ,'</span>',
								'</div>',
							'</div>',
						'</div>',
					'</div>'
					].join(''));
					
				this.$container = this.$containerWrap.find('>div.openstat-report-widget')
					.click(function(/* Event */e){
						var 
							$target = $(e.target),
							href,
							/** @type {new TrackerReport()} */
							reportEngine = undefined;
						if ($target.is('a.cross-report-link')){
							if (
								(reportEngine = window['ActiveTrackerReport'])
								&& (href = reportEngine.transformExitUrl($target.attr('href')))){
								SitePage.redirect(href);
								return false;
								}
							return preserveHashOnClick($target);
							}
						});
				
				this.$header = this.$container.find('div.openstat-report-widget-header:first');
				this.$body = this.$container.find('div.openstat-report-widget-body:first');
				this.$content = this.$container.find('div.openstat-report-widget-content:first');
				
				this.$loader = this.$container.find('div.openstat-report-widget-loader:first').hide();
				this.$loaderCore = this.$loader.find('>div.openstat-report-widget-loader-core:first');
				this.$loaderOverlay = this.$loader.find('>span.openstat-report-widget-loader-overlay:first');
				this.$loaderBar = this.$loaderCore.find('>span.openstat-report-widget-loader-bar:first');
				
				if (this.reportData.id){
					this.$container.addClass('openstat-report-widget-report-id-' + this.reportData.id);
					}
				else if (this.data.widget.report){
					this.$container.addClass('openstat-report-widget-report-' + this.data.widget.report);
					}
				if (this.reportData.representation_class){
					this.$container.addClass('openstat-report-widget-rpr-' + this.reportData.representation_class);
					}
				if (this.data.widget['class']){
					this.$container.addClass('openstat-report-widget-class-' + this.data.widget['class']);
					}
				if (this.data.widget.custom){
					this.$container.addClass('openstat-report-widget-custom-on');
					}
				else{
					this.$container.addClass('openstat-report-widget-custom-off');
					}
				}
			return this.$container
			},
			
		loadVzr : function(listener){
			if (window.Vzr){
				listener();
				return;
				}
			var
				/** @type {Array} */
				listeners = arguments.callee._listeners || (arguments.callee._listeners =  []);
			listeners.push(listener);
			if (!arguments.callee._loading){
				this._core.scriptLoad(this.settings.vzrSrc, function(){
					while(listeners.length){
						listeners.shift()(window.Vzr);
						}
					});				
				}
				
			},	
			
		composeUrl:function(_data){
			var 
				data = _data 
					? $.extend({}, this.data.widget.data, _data)
					: this.data.widget.data,
				$this 					= this,
				uriParts 				= [],
				params 					= [],
				detalisation 			= data.detalisation,
				detalisationSegment 	= detalisation,
				isAttributive 			= isset(data['isAttributive'])?data['isAttributive']:this._isAttributive;
				
			uriParts.push(
				this.settings.restUrlColumns,					
				this.data.widget.counter  && this.data.widget.counter.url
					? encodeURIComponent( this.data.widget.counter.url )
					: encodeURIComponent(counterCompactUrl()) || encodeURIComponent( data.counterId || this.counterData.id),
				data.reportName || this.reportData.id
				);				

			uriParts.push(
				this.composeUrlDatesPart(this.settings.date)
				);
			$.each(this.data.widget.data.columns,function(){
				params.push(['column',([this.segment, $this.getSetFullName(this.set)]).join('%0D')]);
				});
			this.hasConcreteAttibute() && isAttributive && params.push(['attribute',encodeURIComponent(this.data.attribute.v)]); 
			if (data['level']!=null && data['level']!=1){
				params.push(['level',data['level']]);
				}				
			if (data['limit']!=null){
				params.push(['limit',data['limit']]);
				}
			if (data['offset']!=null && data['offset']!=TrackerReport.OFFSET_DEFAULT){					
				params.push(['offset',data['offset']]);
				}
			if (data.reversed_dates || this.hasConcreteAttibute()){
				params.push(['reversed_dates',1]);
				}
			if (data['primary_column'] >= 0){
				params.push(['primary_column',data['primary_column']]);
				}
			if (data.detalisation==DETALISATION_WEEKLY){
				params.push(['week',1]);
				}
			if (data.includeDetalisation){
				params.push(['detalisation', detalisation]);
				}
			if (data.no_total!=undefined){
				params.push(['no_total',data.no_total]);
				}
			if (data.attribute_starts_with){
				params.push(['attribute_starts_with',encodeURIComponent(data.attribute_starts_with)]);
				}
			if (data.view_id){
				params.push(['view_id',data.view_id]);
				}
			if (data.report_id != undefined){
				params.push(['report_id',data.report_id]);
				}
			
			if (data.includeSelected && data.selected){
				if (data.attribute != undefined 
					&& data.attribute.v
					&& is_date(data.attribute.v)){
						params.push(['attribute', data.attribute.v.format(TrackerReport.REMOTE_DATE_FORMATS[data.detalisation])]);
					}
				$.each(data.selected, function(id){
					params.push(['chartline',id]);
					});
				}
			if (data.includeViewTitle){
				params.push(['view_title', data.title || this._view.title]);
				}
			return [
				uriParts.join('/'),
				'.', (data['dataFormat'] || 'json'), 
				'?', (function(){
					var o = [];
					for (var i in params){
						o.push(params[i][0] + '=' + params[i][1]);							
						}						
					return o.join('&');
					})()].join('');
			},
			
		composeUrlDatesPart:function(_data){
			var data = _data 
					? $.extend({}, this.data.widget.data, _data)
					: this.data.widget.data,
				dateSegment,
				date = this.data.widget.data.dates || this.settings.date,
				detalisation = data.detalisation,
				dateFormat = TrackerReport.REMOTE_DATE_FORMATS[detalisation];
			if (date.from && date.to){
				if (data.detalisation==DETALISATION_WEEKLY){
					var 
						sideTo = date.to.duplicate().getNearestWeekday(0,1),
						maxPossibleSideTo = (new Date()).getNearestWeekday(0,-1);
					if (sideTo.greater(maxPossibleSideTo)){
						sideTo = maxPossibleSideTo;
						}
					dateSegment = date.from.duplicate().getNearestWeekday(0,1).format(dateFormat)+'-'+sideTo.format(dateFormat);
					}
				else{
					var 
						maxPossibleSideTo=this.getDateLimits('max'),
						sideTo=date.to.duplicate();
					if (sideTo.greater(maxPossibleSideTo)){
						sideTo=maxPossibleSideTo;
						}
					dateSegment = date.from.format(dateFormat) + '-' + sideTo.format(dateFormat);
					}
				}
			return dateSegment;
			},
		
		getDateLimits:function(key){
			var limits={
				min: 	this.reportData.minPossibleDates[this.data.widget.data.detalisation],
				max:	this.reportData.maxPossibleDates[this.data.widget.data.detalisation]
				};
			return key ? limits[key] : limits;
			},
			
		getSetFullName:function(s){
			if (!s){
				return;
				}
			var 
				sp=s.split('_'),
				metric={},
				name=s,
				sset;
			if (sp.length>1){
				sset = this.reportData.allSets[sp.shift()];
				metric = this.reportData.allMetrics[sp.join('_')];
				}
			else{
				sset = this.reportData.allSets[s];
				if (sset && sset.metrics && sset.metrics[0]){
					metric = this.reportData.metrics[sset.metrics[0]];
					}
				}
			/* XXX is it correct to return back given set name if it was not found in registry? */
			return sset 
				? sset.name + (
					(metric && metric.suffix)
						? '_' + metric.suffix
						: ''
					)
				: s;
			},
			
		/**
		 * 
		 * @return {Boolean}
		 */
		hasConcreteAttibute:function(){
			return (this.data.widget.data.attribute != undefined);
			},
			
		actualize:function(){
			this.actualize_date();
			},
		actualize_date:function(){
			this._isOneUnitInterval = 
				this.settings.date && 
				this.settings.date.from && 
				this.settings.date.from.equal(
					this.settings.date.to,
					this.data.widget.data.detalisation == DETALISATION_MONTHLY
						? 'month'
						: undefined
					);
			},
		
		run:function(){
			var 
				$this = this;
			this.globalMessage(false);
			this.load(function(){
				$this.render();
				});
			},
			
		request:function(data){
			var 
				$this = this,
				clientSuccess = data.success,
				clientError = data.error,
				cacheKey;
			data.success=function(res){
				$this.loader(false);
				$this.cache[cacheKey] = res;
				clientSuccess && clientSuccess(res);
				};
			data.error = function(res){
				$this.loader(false);
				$this.globalMessage(message('error'), 'error');
				delete $this.cache[cacheKey];
				clientError && clientError(res);
				};
			if (!data.data){
				data.data={};
				}
			if (!data.type){
				data.type = 'get';
				}
			else{
				data.type = data.type.toLowerCase();
				}
			
			if (data.type == 'get'){
				!data.data.lc && this.settings.lang && (data.data.lc = this.settings.lang);
				}
			if (!data.url){
				data.url = this.composeUrl();
				}
			cacheKey = escape(data.url).replace(/\./g, "_");
			if (data.type == 'get' && !data.chop && cacheKey in this.cache){
				data.success(this.cache[cacheKey]);
				return;
				}
			!data.quite && this.loader(true);			
			$.ajax($.extend({},{
				dataType:	'json'
				}, data));
			},
			
		load:function(onload){
			var 
				$this = this;
			this.request({
				success:	function(res){
					$this.values = $this.purgeValues(res);
					onload && onload($this.values);	
					}
				});
			},
			
			
			
		purgeValues:function(raw){
			var values = [];
			if (raw && raw['report'] && raw['report']['item']){
				values = raw['report']['item'];
				if (!values || !values[0] || !values[0].val && values[0].c == undefined){					
					return values;
					}
				if (values[0].v.isDate()){
					$.each(values,function(){
						this.purgedDate = this.v.dateFromDt();
						})
					}				
				}
			return values;
			},
			
		render:function(){
			},
			
		render_table:function(_params){
			
			var 
				$this = this,
				html = [],
				hasIcon = false,
				maxDate = this.reportData.maxPossibleDates[
					(this.reportData.representation_class == 'base' && !this.hasConcreteAttibute())
						? DETALISATION_DAILY
						: this.data.widget.data.detalisation],
				columns = this.data.widget.data.columns || [], 
				_item,
				_itemNum = 0,
				val,
				_val,
				_dval,
				
				/** @type {Object} Current column */
				_col,
				
				/** @type {Object} Current metric */
				_metric,
				
				/** @type {String} Metric sign to display in every col cell */
				_metricSign,
				
				total = [],
				getSparklineSrc = function(item){
					var 
						url = [
							$this.settings.restUrl,
							'sparklines',
							counterCompactUrl() || $this.counterData.id,
							$this.composeUrlDatesPart($this.settings.date)],
						query = [];
					query.push('sparkline=' + [
						$this.reportData.id,
						$this.data.widget.data.level,
						item.v,
						columns[0]['segment'],
						columns[0]['set']
						].join('%0D'),
						'width=' + params.sparklineWidth,
						'height=' + params.spaklineHeight,
						'color=' + encodeURIComponent(
							$this.settings.colors[_itemNum % ($this.settings.colors.length)]
							)
						);
					if (BROWSER.isIE6){
						query.push('bgcolor=' + encodeURIComponent('#F8F8F8'));
						}
					return url.join('/') + '?' + query.join('&');
					},
				params = {
					sparklines: 		false,
					sparklineWidth:		100,
					spaklineHeight:		30,
					$container:			this.$content,
					showTotal:			false				
					};
			_params && $.extend(params, _params);
			if (this.values.length){
				if (this.reportData.iconCss){
					this._core.cssLoad(this.reportData.iconCss);
					}
				_itemNum = 0;
				for (var i = 0, l = this.values.length; i < l; i++) {
					_item = this.values[i];
					if (_item.v != '-'){
						html.push(
							'<tr>',
								(params.sparklines
									? ['<td class="sparkline">', 
											'<img src="' , getSparklineSrc(_item) , '" width="' , params.sparklineWidth , '" height="' , params.spaklineHeight , '" alt=""  />',
										'</td>'].join('')
									: ''),
								'<th scope="row">',
									'<span class="item-name-core">',
										(
											(!this.hasConcreteAttibute() && _item.iid != undefined && !BROWSER.isIE6 && (hasIcon = true))
												? '<span class="ico ico-' + this.reportData.iconset + '-' + _item.iid + '"></span>' 
												: '' 
											),
										'<span class="attribute-name">',
											this.getAttributeOutput(_item),
										'</span>',
									'</span>',
									'<span class="fader"></span>',
								'</th>'
								);
						_itemNum++;
						}
					for (var colNum = 0;colNum < columns.length; colNum++){
						if (_item.v == '-'){
							total[colNum] = _item.c[colNum];
							continue;
							}
						_col = columns[colNum];
						_metric = this.getSetMetric(_col['set']);
						_metricSign = (_metric && _metric['short'])
							? '&nbsp;' + _metric['short']
							: '';
						
						
						val = String(
							!this.reportData.representation_class == 'base' && 
							this.reportData.id != 'robot' && 
							this.reportData.id != 'login' && 
							this._isOneUnitInterval
								? parseInt(_item.c[colNum])
								: _item.c[colNum]
								);
								
						if (
							val.toLowerCase() == 'nan' || 
							(
								val == 0 && 
								_item.purgedDate &&
								_item.purgedDate.greater(maxDate))
								){
							_dval = '&mdash;';
							}
						else if (
							(
								this.reportData.id == 'robot' || 
								this.reportData.id == 'login'
								) && 
							_col['set'] == 'lastvisit_lastvisit'
							){
							_dval = (new Date(val * 1000)).format('Y-m-d H:i:s');
							}
						else{
							_dval = val.numberFormat() + _metricSign;
							}
						html.push(
							'<td class="item-val">',
								_dval,
								'<span class="fader"></span>',
							'</td>');
						}	
						
					html.push('</tr>');
					}
				if (html.length){
					html.unshift('<table class="openstat-report-widget-table' +
						( 
							hasIcon 
								? ' openstat-report-widget-table-with-icons'
								: ''
							) + 
						( 
							params.sparklines 
								? ' openstat-report-widget-table-with-sparklines'
								: ''
							) + 
						'"><tbody>');
					html.push('</tbody></table>');
					
					if (total.length == 1 || params.showTotal){
						html.push(
							'<div class="openstat-report-widget-total">',
								'<span>',
									_('Total'), 
								'</span> ',
								'<strong>',
									Number(total[0]).format(),
								'</strong>',
								total.length > 1
									? [
										'<strong>', 
											Number(total[1]).format(),
											(
												!!(columns[1]['set'].toString().indexOf('percent') + 1)
													? '%'
													: ''
												),
										'</strong>'
										].join('')
									: '',
							'</div>');
						}
					}
				}
			else{
				this.globalMessage();
				}
			params.$container.html(html.join(''));
			},
			
		render_list:function(){
			var 
				html = [],
				hasIcon = false,
				_item;
			if (this.values.length){
				if (this.reportData._config.iconsCss){
					this._core.cssLoad(this.reportData._config.iconsCss);
					}
				for (var i = 0, l = this.values.length; i < l; i++) {
					_item = this.values[i];
					if (_item.v == '-'){
						/* Sum value */
						continue;
						}
					html.push(
						'<li>',
							(
								(!this.hasConcreteAttibute() && _item.iid != undefined && !BROWSER.isIE6 && (hasIcon = true))
									? '<span class="ico ico-' + this.reportData.iconset + '-' + _item.iid + '"></span>' 
									: '' 
								),
							this.getAttributeOutput(_item),			
						'</li>'
						);
					}
				if (html.length){
					html.unshift('<ul class="openstat-report-widget-list' +
						( 
							hasIcon 
								? ' openstat-report-widget-list-with-icons'
								: ''
							) + 
						'">');
					html.push('</ul>');
					}
				}
			else{
				this.globalMessage()
				}
			this.$content.html(html.join(''));
			},
		
		render_chart:function(){
			if (
				this.settings.useJsChartOnly ||
				(
					!this.settings.requiredSwfVer && 
					!this.settings.requiredSwfVerAlt && 
					!BROWSER.isIE6)){
				return this.render_chartJs();	
				}
			var 
				$this = this,
				chartData = this.getChartData(),
				/** @type {jQuery} */
				$chart = (this.$chart && this.$chart.length)
					? this.$chart
					: this.$content;
			$chart.html($flash({
				src:		this.settings.chartSrc,
				version:	this.settings.chartSwfVer,
				name:		'report_chart',
				params:		$.extend(chartData,{
								useExternalInterface:	0,
								attributive:			Number(chartData.attributive)
								}),
				noFlash: 	message('noFlashRequired')
				}));
			},
		render_chartJs:function(){
			var 
				$this = this,
				/**
				 * Data for loader 
				 * @type {Object} 
				 **/
				loadData = {
					report: $this.trackerReportInterface
					},
				/** @type {jQuery} */
				$chart = (this.$chart && this.$chart.length)
					? this.$chart
					: this.$content;
			if (!this._chartJs){
				this._chartJs = $chart.jschart({
					orderTypeX				: window.jschart.constant('ORDERTYPE_ASC'),
					infoNoDataText			: _('No attributes selected for display on the chart'),
					progressBarText			: _('Loading...'),
					infoErrorLoadingText	: message('error'),
					useChartEvents			: false, // No events in domains
					colors					: ['#569D9C','#FF9599','#22A0F4','#00E3B6','#FF33FE']
					});
				this._core.cssLoad(this.settings.chartJsCss);
				}
			this._chartJs.load(loadData);
			},	
		
		render_header : function(){
			var 
				cntUrl = counterUrl(),
				isClickable = (cntUrl || this.data.widget.url) 
				&& this.data.widget.url !== false 
				&& + this.data.widget.url !== 0; 
			this.$header.html([
				isClickable
					?  [
						'<a href="', 
							this.data.widget.url 
							|| [ '/', cntUrl , '/report/' , this.reportData.id , '/',  
								(
									this.data.widget.view_id
										? '#' + this.data.widget.view_id
										: ''
									)
								].join(''),
							'" class="cross-report-link" ',
							' title=" ' , htmlspecialchars(this.data.widget.title || this.reportData.title) ,  
							'">' 
							].join('')
					: '',
				typo( this.data.widget.title || this.reportData.title ),
				
				isClickable
					? '</a>'
					: ''
				].join(''));
			},	
			
		render_custom:function(force){
			var 
				$this = this,
				_set;
			if (this.data.widget.custom || force){
				if (!this.$custom){
					this.$custom = $([
						'<div class="openstat-report-widget-custom">',
							'<div class="w-select-wrap">',
								'<span class="w-select"></span>',
							'</div>',
						'</div>'
						].join(''))
						.prependTo(this.$body);
					}
				if (! this.customField){
					this.customField = this.$custom.find('.w-select').wSelect({
						onchange: function(){
							var 
								selected = this.getSelectedData(); 
							$this.data.widget.data.columns[0]['set'] = selected['set']['name'];
							$this.data.widget.data.columns[0]['segment'] = selected['segment']['id'];
							
							$this.run();
							$this.change();
							}
						});
					}
				this.customField.setOptions((function(){
					if (!$this.customOptions && !$this.reportData.segments.length){
						return [];
						}
					var 
						res = [],
						segmentTitle = $this.reportData.segments[0].title,
						append = function(segment, sset, caption){
							res.push({
								value: 		sset.name,
								caption:	caption || (trimStr(segment.title)
									? [
										segment.title,
										$this.getSetTitle(sset.name).toString().toLocaleLowerCase()
										].join(', ')
									: $this.getSetTitle(sset.name)
									),
								data:		{
									'set':		sset,
									'segment':	segment	
									}
								});
							};
					if ($this.customOptions && $this.customOptions.length){
						for (var i = 0, l = $this.customOptions.length; i < l; i++) {
							append($this.customOptions[i]['segment'], $this.customOptions[i]['set'], $this.customOptions[i]['title']);
							}
						}
					else{
						if ($this.reportData.sets.length > 1 && $this.reportData.segments[0]){
							for (var i = 0, l = $this.reportData.sets.length; i < l; i++) {
								append(
									$this.reportData.segments[0], 
									$this.reportData.sets[i]
									);
								}
							}
						else if ($this.reportData._segmentsNum >= 1 && $this.reportData.sets[0]){
							$.each($this.reportData.segments, function(){
								append(
									this, 
									$this.reportData.sets[0]
									);
								});
							}
						}
					return res;
					})());
				if (
					$this.data.widget.data && 
					$this.data.widget.data.columns &&
					$this.data.widget.data.columns[0] &&
					$this.data.widget.data.columns[0]['set']
					){
					this.customField.val($this.data.widget.data.columns[0]['set']);
					}
				if (this.customField.getOptionsLength() <= 1){
					this.customField.disable();
					}
					
				/* Adding custom ext fields if needed */
				if (this.data.widget.customExt && this.data.widget.customExt.length){
					;(function(){
						var 
							activeClass = 'openstat-report-widget-custom-ext-tab-active',
							/** @type {jQuery} */
							$customExt,
							$_tab,
							_ce;
						$customExt = $this.$custom.find('>div.openstat-report-widget-custom-ext');
						if (!$customExt.length){
							$customExt = $(['<div class="openstat-report-widget-custom-ext"></div>'].join(''))
								.prependTo($this.$custom)
								.delegate('span.openstat-report-widget-custom-ext-tab', 'click', function(){
									var 
										d,
										selectedColNum = $this.customField.getSelectedIndex(),
										newSelectedColNum;
									if ($(this).hasClass(activeClass)){
										return false;
										}
									$(this)
										.siblings().removeClass(activeClass).end()
										.addClass(activeClass);
									
									
									d = $(this).data('_customExtData');
									/* Extending widget data */
									$this.data.widget = $.extend(true, $this.data.widget, d);
									
									/* 
									 * Fucking dirty hack to preserve value seleced in customField
									 * when switch customExt 
									 */
									if (selectedColNum && $this.data.widget.customOptions[selectedColNum]){
										$this.data.widget.data.columns[0] = $.extend({}, $this.data.widget.customOptions[selectedColNum]); 
										}
									/* ..and totally refreshing widget */
									$this.configure(true);
									$this.render_custom(true);
									$this.render_header();
									$this.run();
									$this.change();
									});
							}
						$customExt.empty();
						for (var i = 0, l = $this.data.widget.customExt.length; i < l; i++) {
							_ce = $this.data.widget.customExt[i];
							$_tab = $([
								'<span class="openstat-report-widget-custom-ext-tab' , ( _ce.report == $this.data.widget.report ? ' openstat-report-widget-custom-ext-tab-active' : '') , '"><span>' , _ce._title , '</span></span>'
								].join(''))
								.appendTo($customExt)
								.data('_customExtData', _ce);
							}
						$this.$custom.addClass('openstat-report-widget-custom-with-ext');
						})();
					}
						
				
				if (this.data.widget.customTitle){
					this.$custom.prepend([
						'<div class="openstat-report-widget-custom-title">',
							this.data.widget.customTitle,
						'</div>'
						].join(''));
					}	
					
				this.$custom.show();
				}
			else{
				if (this.$custom){
					this.$custom.hide();
					}
				}
			},
			
		render_pie: function(){
			var
				$this = this,
				$pie = (this.$pie && this.$pie.length)
					? this.$pie
					: this.$content,
				pieData = this.getPieData();
			
			/* Preventing re-render swf */
			if ( ! arguments.callee._rendered){
				$this.isPieReady = false;
				$pie.html($flash({
					src:		$this.settings.pieSrc,
					version:	$this.settings.pieSwfVer,
					name:		'report_pie_widget_' + $this.getInstanceId(),
					params:		$.extend(pieData,{
									use_external_interface:	0
									}),
					noFlash: 	function(){
									$this.$pie && $this.$pie.hide();
									}
					}));
				arguments.callee._rendered = true;
				}
			if (this.pieValues && this.pieValues.length){
				;(function(){
					var 
						update = function(){
							var 
								sectors = [],
								color,
								$cnts,
								/** @type {jQuery} */
								$cnt,
								$color;
							if ((
									$._pie 
									|| ($this._pie = $flashMovie('report_pie_widget_' + $this.getInstanceId()))
									)
								&& $this._pie.update){
								sectors = $this._pie.update({
									values:	$this.pieValues
									});
								if (
									sectors && 
									sectors.length &&
									$this.$pieLegend &&
									($cnts = $this.$pieLegend
										.addClass('with-item-color-signs')
										.find('tbody span.item-color-sign'))){
									for (var i = 0, l = sectors.length; i < l; i++) {
										$cnts.eq(i).css('backgroundColor', '#' +  sectors[i].toString(16));
										}
									}
								}
							}
					$this.onPieReady(update);
					})();
				
				}
			},
		
		getPieData: function(){
			var
				$this = this,
				column = $this.data.widget.data.columns[0],
				pieData = {
					counter:			encodeURIComponent(counterCompactUrl() || this.counterData.id),
					counter_url:		encodeURIComponent(this.counterData.url),
					counter_uri:		encodeURIComponent(counterUrl()),
					report:				$this.reportData.id,
					level:				$this.data.widget.data.level,
					remoteHost:			$this.settings.flashHost,
					remoteUrl:			$this.settings.restUrlColumns,
					primary_column:		0, 					
					datefrom:			$this.settings.date.from.getTimeStamp(),
					dateto:				$this.settings.date.to.getTimeStamp(),
					lang:				$this.settings.lang,
					column_segment:		column.segment,
					column_set:			column['set'],
					showLegend:			false,
					
					// Special view
					colors:				'cbe0db,e9f0fd,10e3b6,ff9599,ffc7c7,f2f2f2',
					maxCount:			$this.data.widget.data.limit || 5
					// /Special view
					};
			if (this.pieAttrFuncName){
				pieData.pieAttrFuncName = this.pieAttrFuncName;
				}
			if (this.pieReadyFuncName){
				pieData.pieReadyFuncName = this.pieReadyFuncName;
				}
			return pieData;
			},
			
		render_pieLegend:function(){
			var 
				$this = this,
				/** @type {jQuery} */
				$pieLegend = (this.$pieLegend && this.$pieLegend.length)
					? this.$pieLegend
					: this.$content,
				columns = this.data.widget.data.columns || [], 
				html = [],
				/** @type {Object} */
				_item,
				_itemNum = 0,
				_notEmptyItemNum = 0,
				_val,
				_dval,
				_title,
				
				/** @type {Object} */
				_pieVal = {
					title: 	undefined,
					value:	undefined,
					data:	{}
					},
				
				/** @type {Object} Current column */
				_col,
				
				/** @type {Boolean} */
				_isPercentValue,
				
				/** @type {Object} Current metric */
				_metric,
				
				/** @type {String} Metric sign to display in every col cell */
				_metricSign,
				
				total = [];
			this.pieValues = [];
			if (this.values.length){
				_itemNum = 0;
				for (var i = 0, l = this.values.length; i < l; i++) {
					_pieVal = {};
					_item = this.values[i];
					if (_item.v != '-'){
						_title = this.getAttributeOutput(_item);
						html.push(
							'<tr>',
								'<th scope="row">',
									'<span class="item-name-core">',
										'<span class="item-color-sign"></span>',
										_title,
									'</span>',
									'<span class="fader"></span>',
								'</th>'
								);
						_pieVal.title = strip_tags(_title);
						_itemNum++;
						}
					for (var colNum = 0; colNum < columns.length; colNum++){
						if (_item.v == '-'){
							total[colNum] = _item.c[colNum];
							continue;
							}
						_col = columns[colNum];
						_metric = this.getSetMetric(_col['set']);
						_metricSign = (_metric && _metric['short'])
							? '&nbsp;' + _metric['short']
							: '';
						_isPercentValue = !!(_col['set'].toString().indexOf('percent') + 1); 
						if (_isPercentValue){
							_pieVal.value = +_item.c[colNum];
							}
						else{
							_pieVal.rawValue = +_item.c[colNum];
							_pieVal.value = +_item.c[colNum];
							}
						
						val = String(_item.c[colNum]);
								
						if (
							val.toLowerCase() == 'nan' || 
							(
								val == 0 && 
								_item.purgedDate &&
								_item.purgedDate.greater(maxDate))
								){
							_dval = '&mdash;';
							}
						else{
							_notEmptyItemNum ++;
							_dval = val.numberFormat() + _metricSign;
							}
						html.push(
							'<td class="item-val' , 
								(_isPercentValue ? ' item-val-accent' : '') , 
								'">',
								_dval,
								'<span class="fader"></span>',
							'</td>');
						if (!_isPercentValue && columns.length == 1 && _item._c){
							html.push(
								'<td class="item-val  item-val-accent">',
									val.toLowerCase() == 'nan' && ! _item._c[colNum]._factor
										? '&mdash;'
										: String(_item._c[colNum]._factor).numberFormat(2) + '&nbsp;%',
									'<span class="fader"></span>',
								'</td>');							
							}
						}
					this.pieValues.push(_pieVal);
					html.push('</tr>');
					if (this.data.widget.data.limit && _itemNum >= this.data.widget.data.limit){
						break;
						}
					}
				if (!_notEmptyItemNum){
					this.globalMessage();
					}
				else if (html.length){
					html.unshift('<table class="openstat-report-widget-table"><tbody>');
					html.push('</tbody></table>');
					if (total.length == 1 || ( this.valuesTotal && this.valuesTotal[0] ) ){
						html.push(
							'<div class="openstat-report-widget-total">',
								'<span>',
									_('Total'), 
								'</span> ',
								'<strong class="openstat-report-widget-total-raw">',
									Number( total[0] || 
										( this.valuesTotal && this.valuesTotal[0] )
											? this.valuesTotal[0]
											: 0
										).format(),
								'</strong>',
								'<strong class="openstat-report-widget-total-percent">100%</strong>',
							'</div>'
							);
						}
					$pieLegend.html(html.join(''));
					}
				}
			else{
				this.globalMessage();
				}
			},
		
		getChartData:function(){
			var 
				$this = this,
				data = this.data,
				_chartline = {
					'segment'		: undefined,
					'set'			: undefined,
					'color'			: undefined,
					'counter'		: undefined,
					'report'		: undefined
					},
				/** @type {Array} */
				chartlines = (function(){
					var 
						res = [],
						_cl = [];
					if ($this.data.widget.data.chartlines && $this.data.widget.data.chartlines.length){
						for (var i = 0, l = $this.data.widget.data.chartlines.length; i < l; i++) {
							_chartline = $this.data.widget.data.chartlines[i];
							if (_chartline.segment == undefined || _chartline['set'] == undefined){
								continue;
								}
							if (!_chartline.color){
								_chartline.color = $this.settings.colors[i];
								}
							_cl = [
								_chartline.segment,
								$this.getSetFullName(_chartline['set']),
								_chartline.attribute
									? _chartline.attribute.v
									: undefined,
								_chartline.color
								];
							if (_chartline.counter 
								|| _chartline.report){
								_cl.push(
									encodeURIComponent(_chartline.counter),
									_chartline.report
									);
								}
							res.push(_cl.join('%0D'));
							}
						}
					return res;
					})(),
				chartData = {
					counter:			encodeURIComponent(counterCompactUrl() || this.counterData.id),
					counter_url:		encodeURIComponent(this.counterData.url),
					report:				this.reportData.id,
					detalisation:		this.data.widget.data.detalisation,
					level:				1,
					remoteHost:			this.settings.flashHost,
					remoteUrl:			this.settings.restUrlColumns,
					fillEmpty:			1,
					useScroller:		0,
					primary_column:		0, 					
					datefrom:			this.settings.date.from.getTimeStamp(),
					dateto:				this.settings.date.to.getTimeStamp(),
					lang:				this.settings.lang,
					is_attendance: 		1, // XXX wtf?
					columnsList:		chartlines.join('%0A')					
					};
			return chartData;
			},
			
		loader:function(state){
			var 
				$this = this,
				interval, 
				bgpos = 0,
				actualize = function(){
					if (bgpos++ >= 18){
						bgpos = 0;
						}
					$this.$loaderBar[0].style.backgroundPosition = bgpos + 'px -600px';
					};
			if (state){
				if (!this.$loader.is(':visible')){
//					actualize();
					this.$loader.show();
					this.$loaderOverlay.hide().fadeIn(1500);
//					this.$loader.data('interval', setInterval(actualize,30));
					}
				}
			else if (this.$loader){
				this.$loader.hide();
//				clearInterval(this.$loader.data('interval'));
				}
			
			},
			
		getAttributeOutput:function(item){
			if (item.purgedDate){				
				return item.purgedDate.format(TrackerReport.DISPLAY_DATE_FORMATS[this.data.detalisation])+(this.data.detalisation==DETALISATION_DAILY?'&nbsp;<span class="attr-date attr-date attr-date-day-'+item.purgedDate.getDay()+'">('+item.purgedDate.getWeekday().toLowerCase()+')</span>':''); 
				}
	
			return this.getAttributeR(item, 'table');
			},
			
		getAttributeR:function(a, type){
			if (!a){
				/*Attribute not defined for example in summary report*/
				return undefined;
				}
			return getAttributeRepresentation(a, this.reportData.id, this.data.widget.data, type);
			},
		
			
		/** 
		 * Gets and returns metric object by set name
		 * @param {String} s Set name
		 * @return {Object}
		 */
		getSetMetric:function(s){
			var 
				sp = s.split('_'),
				metric = {},
				sset;
			if (sp.length > 1){
				sp.shift();
				metric = this.reportData.allMetrics[sp.join('_')];
				}
			else{
				sset = this.reportData.allSets[s];
				if (sset && sset.metrics && sset.metrics[0]){
					metric = this.reportData.metrics[sset.metrics[0]];
					}
				}
			return metric;
			},	
		
		getSetTitle:function(s, isHtml){
			if (typeof(s) == 'object'){
				return s.title||'';
				}
			else{
				s = String(s);
				var	
					sset = s,
					sp = sset.split('_'),
					metricName,
					metric;
				if (sp.length > 1){
					sset = sp.shift();
					if (this._isOneUnitInterval && sp[0] == 'sum' && sp[1] == 'average'){
						sp[0] = 'amount';
						sp.splice(1, 1);
						metricName = sp.join('_');
						if (!this.reportData.allMetrics[metricName]){
							metricName = 'amount';
							}
						}
					else{
						metricName = sp.join('_'); 	
						}
					metric = this.reportData.allMetrics[metricName];
					}
				else{
					var setMetrics = this.reportData.allSets[sset].metrics;
					if (setMetrics && setMetrics[0]){
						metricName=setMetrics[0];
						if (this._isOneUnitInterval && metricName == 'average'){
							metricName = 'amount'
							}
						metric = this.reportData.metrics[metricName];
						}
					}
				var 
					html = this.reportData.setTitles[sset] || sset,
					metricTitle = (metric && metric.title)
						? metric.title
						: '';
				if (metric){
					html += ', ';
					if (isHtml){
						html = [
							'<span class="title-sub1">', 
								html, 
							'</span>',
							'<span class="title-sub2">', 
								metricTitle.toLocaleLowerCase(), 
							'</span>'
							].join('');
						}
					else{
						html += metricTitle.toLocaleLowerCase();
						}
					}
				return html;
	
				}
			},
			
		/** 
		 * Throws change event to external listeners
		 */
		change:function(){
			this.data.onchange && this.data.onchange();
			},
			
		exportData:function(){
			var d = this.data;
			d = $.extend(true, {}, this.data);
			if (!d.widget.custom){
				delete d.widget.custom;
				}
			if (!d.widget.data.chartlines || !d.widget.data.chartlines.length){
				delete d.widget.data.chartlines;
				}
			delete d.onchange;
			
			return d;
			},
		
		getEngineId:function(){
			return this._widgetEngineName;
			},
		getInstanceId:function(){
			return this._instanceId;
			},
		setInstanceId:function(id){
			this._instanceId = id;
			},
		globalMessage:function(msg, type){
			if (msg === false){
				if (this.$message){
					this.$message.hide();
					}
				return false;
				}
			if (!this.$message || !this.$message.length){
				this.$message = $([
					'<div class="openstat-report-widget-global-message' ,
						' openstat-report-widget-global-message-type-' + (type || 'notice'),
						'">',
					'</div>'
					].join('')).appendTo(this.$body);
				}
			this.$message.html(
				msg || 
				message('noData_report-' + this.reportData.id)||
//				message('noData_detalisation-' + this.data.widget.data.detalisation)||
				//XXX Detalisation messages looks strange in Domains
				message('noData')
				).show();
			}
		
		}
		
	WidgetCore.Engines.WidgetReport = Widget;
	
	
	WidgetCore.ClassPieBase = {
		pieAttrFuncName: undefined,
		/** @type {jQuery} */
		$pie: undefined,
		/** @type {jQuery} */
		$pieLegend: undefined,
		
		pieReadyListeners: [],
		isPieReady: false,
		container:function(c){
			var $this = this;
			this._superMethod('container', c);
			if (c){
				this.$content.html([
					'<div class="openstat-report-widget-pie-container"></div>',
					'<div class="openstat-report-widget-pie-legend"></div>'
					].join(''));
				this.$pie = this.$content.find('>div.openstat-report-widget-pie-container');
				this.$pieLegend = this.$content.find('>div.openstat-report-widget-pie-legend');
				
				this.$pieLegend.delegate('tbody>tr', 'hover', function(/* Event */e){
					var 
						/** @type {jQuery} */
						$target = $(e.target),
						num = $target.closest('tr').prevAll('tr').length;
					if ($this._pie && $this._pie.activateSector){
						$this._pie.activateSector(num);
						}
					})
				}
			},
 		/** 
		 * Function to communicate with pie chart
		 */
		pieAttrFunc: function(){
			return __getAttributeRepresentation.apply(undefined, arguments);
			},
		onPieReady: function(listener){
			if ($.isFunction(listener)){
				if (this.isPieReady){
					listener();
					}
				else{
					this.pieReadyListeners.push(listener);
					}
				}
			},
 		run: function(){
 			var $this = this;
 			this.pieAttrFuncName = '__pieChartAttribute_' + this.getInstanceId();
 			this.pieReadyFuncName = '__pieChartReady_' + this.getInstanceId();
 			window[this.pieAttrFuncName] = function(){
 				var 
					pr = arguments.length == 1
						? arguments[0]
						: arguments;
				pr[0] = setArray(pr[0]);
 				return $this.pieAttrFunc.apply($this, pr);
 				};
 			window[this.pieReadyFuncName] = function(){
 				for (var i = 0, l = $this.pieReadyListeners.length; i < l; i++) {
 					$this.pieReadyListeners[i]();
 					}
 				$this.pieReadyListeners = [];
 				$this.isPieReady = true;
 				};
 			
 			this.globalMessage(false);
 			/** 
 			 * Need pre-render pie to start loading swf earlier 
 			 */
 			this.render_pie();
 			this.load(function(){
				$this.render();
				});
 			},
 			
 		render:function(){
 			if (this.data.w >= 2){
	 			this.render_pieLegend();
 				}
 			else{
 				this.$pieLegend.hide();
 				}
			this.render_pie();
 			}
		};	
	})();
	

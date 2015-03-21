/** 
 * @include "../../../js/common.js"
 * @include "./widget_report.js"
 */
 
/** 
 * 
 * @type {Object} 
 */ 
var WidgetCore = {
	Engines		: {},
	loadedFiles	: {}
	};

(function(){
	var 
		/** 
		 * Inner core alias
		 * @type {Object}
		 */
		core = WidgetCore,
		
		widgets = [],
		
		/** 
		 * Inner alias of global widget settings
		 * @type {Object}
		 */
		settings =  {
			'lang':				window['LANG'] || '',
			'host': 			'',
			'uri':				'/a/tracker/report/widgets',
			'url':				'',
			'restUrl':			'/rest',
			'restUrlColumns':	'/rest/columns',
			'onlinesUrl' :      '/rest/onlines',
			'chartSrc':			window.CHART_SRC || '/a/tracker/report/img/swf/line_chart_tracker.swf',
			'chartSwfVer':		9,
			'chartSwfVerAlt':	6,
			'pieSrc':			window.PIE_SRC || '/a/tracker/report/img/swf/pie_chart_tracker.swf',
			'pieSwfVer':		9,
			'pieSwfVerAlt':		6,
			'geomapSrc':		window.GEOMAP_SRC || '/a/tracker/report/img/swf/geomap_tracker.swf',
			'geomapSwfVer':		9,
			'histochartEngineSrc' : '/a/tracker/report/js/histochart.js',
			'stackchartEngineSrc' : '/a/tracker/report/js/stackchart.js',
			'requiredSwfVer':	FLASH_CHECKING.DetectFlashVer(9),
			'requiredSwfVerAlt':FLASH_CHECKING.DetectFlashVer(6),
			'useJsChartOnly':	true,
			'useJsMapOnly':	false,
			'date':		{
							/* TODO: Need to synchronize with calendar control */
							from:		(new Date()).offset({months:-1}),
							to:			new Date()
							},
			'colors':		['#569E45','#ED1C2F','#11AAE3','#F9961E','#A24086']
			},
		
		/** 
		 * Inner alias of all reports data
		 * @type {Object}
		 */
		allReports = window['TRACKER_REPORTS'] || [],
		
		
		allMetrics = window['TRACKER_DATA']['metrics'] || [],
		
		allSegments = window['TRACKER_DATA']['segments'] || [],
		
		paramsNames = {
			'rpr': 		'',
			'class': 	'Class',
			'report':	'Report',
			'w':		'W',
			'h':		'H'
			},
		
		priorityOrderParams = ['rpr', 'class', 'report', 'w', 'h'],
		
		priorityOrderKeys = [
			'rpr_class_report_w_h',
			'rpr_class_report_w',
			'rpr_class_report_h',
			'rpr_class_report',
			'rpr_report_w_h',
			'rpr_report_w',
			'rpr_report_h',
			'rpr_report',
			'rpr_class_w_h',
			'rpr_class_w',
			'rpr_class_h',
			'rpr_class',
			'rpr_w_h',
			'rpr_h',
			'rpr_w',
			'rpr'
			];
		
		
	$.extend(true, settings, window['OpenstatWidgetSettings'] || {});
	!settings.url && (settings.url = settings.host + settings.uri);
	
	
	core.getReportData = function(reportId){
		return $.extend({	
			metrics: 	allMetrics,
			segments:	allSegments
			},allReports[reportId]);
		}
		
	core.settings = function(data, value){
		return storage(settings, data, value);
		}
	
	
	;(function(){
		var
			_loadedScripts = {},
			_loadedCss = {},
			STATUS_LOADING = 1,
			STATUS_LOADED_SUCCESS = 10,
			STATUS_LOADED_ERROR = 100;
		
		/** 
		 * Loads given js files and runs listeners when its done
		 * @example <code>ScriptLoad('script1.js', 'script2.js', onloadFunction, onerrorFunction)</code>
		 */
		core.scriptLoad = function(){
			var 
				Load = function(src, onload, onerror){
					var 
						documentHead = document.getElementsByTagName("head")[0],
						s,
						_onload,
						_isLoaded = false,
						complete = function(success){
							var listeners = [];
							if (_loadedScripts[src].status != STATUS_LOADING){
								/* Preventing double running */
								return false;
								}
							if (success){
								_loadedScripts[src].status = STATUS_LOADED_SUCCESS;
								listeners = _loadedScripts[src]['listenersSuccess'];
								}
							else{
								_loadedScripts[src].status = STATUS_LOADED_ERROR;
								listeners = _loadedScripts[src]['listenersError'];
								}
							if (listeners.length){
								for (var i = 0, l = listeners.length; i < l; i++) {
									listeners[i] && listeners[i]();
									}
								}
							};
					if (!documentHead || !documentHead.firstChild){
						throw new Error('Cannot load script until DOM ready');
						}
					if (onerror === false){
						onerror = onload;
						}
					if (_loadedScripts[src] && _loadedScripts[src].status){
						switch (_loadedScripts[src].status){
							case STATUS_LOADING:
								_loadedScripts[src].listenersSuccess.push(onload);
								_loadedScripts[src].listenersError.push(onerror);
								return true;
							case STATUS_LOADED_SUCCESS:
								onload && onload();
								return true;
							case STATUS_LOADED_ERROR:
								onerror && onerror();
								return true;
							}
						}	
						
					_loadedScripts[src] = {
						status: STATUS_LOADING,
						listenersSuccess: [onload],
						listenersError: [onerror]
						};
						
					s = document.createElement("script");
					s.charset = "utf-8";
					s.src = src;
					s.onload = function(res){
						complete(true);
						};
					s.onerror = function(){
						complete(false);
						}
					s.onreadystatechange = function() {
						if (this.readyState == 'complete' || this.readyState == 'loaded') {
							s.onload();
							}
						}
					documentHead.insertBefore(s, documentHead.firstChild);
					},
				scripts = [],
				onload,
				onerror,
				_src,
				_total,
				_loaded;
			if (arguments.length){
				for (var i = 0, l = arguments.length; i < l; i++) {
					if ($.isFunction(arguments[i])){
						if (onload == undefined){
							onload = arguments[i];
							}
						else if (onerror == undefined){
							onerror = arguments[i];
							}
						else{
							break;
							}
						}
					else if (arguments[i] ===  false){
						if (onload != undefined && onerror == undefined){
							onerror = onload;
							}
						}
					else{
						_src = arguments[i].toString();
						if (
							_src.search(/https?:\/\//) !== 0 && 
							_src.charAt(0) != '/'
							){
							/* Converting relative urls to absolute using global url value */
							_src = settings.url + '/' + _src
							}
						scripts.push(_src);
						}
					}
				_total = scripts.length;
				_loaded = 0;
				for (var i = 0; i < _total; i++) {
					_src = scripts[i];
					Load(_src, 
						function(){
							if (++_loaded >= _total){
								onload && onload();
								}
							},
						function(){
							onerror && onerror(_src);
							});
					}
				}
			};
			
			
		core.cssLoad = function(){
			var 
				_src,
				Load = function(src){
					var 
						documentHead = document.getElementsByTagName("head")[0],
						s;
					if (_loadedCss[src] && _loadedCss[src].status == STATUS_LOADED_SUCCESS){
						/* Was loaded earlier */
						return true;
						}
					if (!documentHead || !documentHead.firstChild){
						throw new Error('Cannot load css until DOM ready');
						}
						
					s = document.createElement("link");
					s.rel = 'stylesheet';
					s.href = src;
					/* Inserting link element after all other to allow redeclare some rules */
					documentHead.appendChild(s);
					_loadedCss[src] = {
						status: STATUS_LOADED_SUCCESS
						}
					};
			if (arguments.length){
				
				for (var i = 0, l = arguments.length; i < l; i++) {
					_src = arguments[i];	
					if (
						_src.search(/https?:\/\//) !== 0 && 
						_src.charAt(0) != '/'
						){
						/* Converting relative urls to absolute using global url value */
						_src = settings.url + '/' + _src;
						}
					Load(_src);
					}
				}
			};
		})();
	
	/** 
	 * Finds appropriate widget based on given data 
	 * and starts it in given container  
	 */
	core.widgetStart =  function(_container, _wdata, _data){
		var 
			/** @type {jQuery} */
			$container,
			
			/** 
			 * Common proccess data
			 * @type {Object} */
			data = {
				onload:function(){},
				onerror:function(){}
				},
				
			/** 
			 * Widget data
			 * @type {Object} */
			wdata = {
				w: 1,
				h: 1,
				widget:{
					'class': 	'table',
					'report':		''
					}
				},
				
			widgetGlobalMessage = function(msg, type){
				msg && $container && $container.html([
					'<div class="openstat-report-widget-global-message' ,
						' openstat-report-widget-global-message-type-' + (type || 'notice'),
						'">',
						msg,
					'</div>'
					].join(''));
				
				},
				
			start = function(){
				var 
					report = allReports[wdata.widget.report],
					nameBase,
					widgetEngine,
					
					/** @type {new WidgetCore.Engines.WidgetReport()} */
					widget;
					
				if (!report){
					/* Unknown report name in widget data */
					return false;
					}
				
				nameBase =(
						!report.representation_class || 
						report.representation_class == 'unbound' || 
						report.representation_class == 'searchterms'
						)
					? 'hierarchical'
					: report.representation_class;
					
				core.cssLoad('/a/tracker/report/widgets/widget.css');
				(BROWSER.isIE7 || BROWSER.isIE6) 
					&& core.cssLoad('/a/tracker/report/widgets/widget_ie7.css');	
				BROWSER.isIE6 
					&& core.cssLoad('/a/tracker/report/widgets/widget_ie6.css');
					
				/* Important to load base widget_report class earlier than any other */
				core.scriptLoad('widget_report.js', 
					function(){
						core.scriptLoad('widget_report_' + nameBase + '.js', 
							function(){
								if (!core.loadedFiles[nameBase]){
									//Error: Not requested file was loaded	
									widgetGlobalMessage(message('error'), 'error');
									return;
									}
								widgetEngine = core.getAppropriateWidgetEngine({
									rpr: nameBase,
									report: wdata.widget.report,
									'class': wdata.widget['class'],
									'w': wdata.w,
									'h': wdata.h
									});
								widgets.push(widget = new widgetEngine(wdata, $container));
								widget.setInstanceId(widgets.length - 1);
								data.onload(widget);
								widget.run();
								},
							function(src){
								//Error: cannot loading file with special engine class
								widgetGlobalMessage(message('error'), 'error');
								})
						}, 
					function(src){
						//Error: cannot loading file with base class
						widgetGlobalMessage(message('error'), 'error');
						});
				
				},
			/** 
			 * Public functionality
			 * @type {Object}
			 */
			obj = {
				
				};
		
		if (!_container || !_wdata){
			/* Incorrect given data */
			return false;
			}
			
		$container = $(_container);
		$.extend(true, wdata, _wdata);
		_data && $.extend(data, _data);
		start();
		return obj;
		}
	;(function(){
		
		var 
			apprEngine = function(params, getClosest){
				var 
					p = [],
					_k,
					_c = false,
					_cc = false,
					_name,
					key2name = function(key){
						var 
							_kp = key.toString().split('_'),
							_kk,
							_pp = ['WidgetReport'];
						for (var i = 0, l = _kp.length; i < l; i++) {
							_kk = _kp[i];
							if (params[_kk] != undefined){
								paramsNames[_kk] && _pp.push(paramsNames[_kk]);
								_pp.push(params[_kk]);
								}
							else{
								return false;
								}
							}
						return _pp.join('_');
						}
						
				for (var i = 0, l = priorityOrderParams.length; i < l; i++) {
					_k = priorityOrderParams[i];
					if (params[_k] != undefined){
						p.push(_k)
						}
					}
					
				_k = p.join('_');
				for (var i = 0, l = priorityOrderKeys.length; i < l; i++) {
					if (!_c && _k == priorityOrderKeys[i]){
						_c = true;
						}
					if (_c && (_name = key2name(priorityOrderKeys[i]))){
						if (core.Engines[_name]){
							if (getClosest && !_cc){
								_cc = true;
								}
							else {
								return core.Engines[_name];
								}
							}
						}
					}
				return core.Engines.WidgetReport;
				}
		
		/** 
		 * Returns more appropriate widget engine for given params set
		 * @return {Function}
		 */
		core.getAppropriateWidgetEngine = function(params){
			return apprEngine(params);
			};
		/** 
		 * Returns closest parent to appropriate widget engine for given params set
		 * @return {Function}
		 */
		core.getAppropriateWidgetEngineParent = function(params){
			return apprEngine(params, true);
			};
		})();	
		
	;(function(){
		
		var params2name = function(params){
			var 
				p = ['WidgetReport'],
				_k;
			for (var i = 0, l = priorityOrderParams.length; i < l; i++) {
				_k = priorityOrderParams[i];
				if (params[_k] != undefined){
					paramsNames[_k] && p.push(paramsNames[_k]);
					p.push(params[_k]);
					}
				}
			return p.join('_');
			}
		
		core.registerEngine = function(params, proto){
			var 
				name = params2name(params),
				Engine = core.Engines[name] = function(){
					Engine.superClass.apply(this, arguments);
					Engine.prototype._widgetEngineName = name;
					},
				parentEngine = core.getAppropriateWidgetEngineParent(params);
				
			Engine.inheritsFrom(parentEngine);
			proto && $.extend(Engine.prototype, proto);
			};
		})();
		
	
	})();
	

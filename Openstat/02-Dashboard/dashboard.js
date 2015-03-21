/**
 * @include "./tracker_report.js"
 * @include "../widgets/widget_core.js"
 * @include "../../../js/common.js"
 */

var Dashboard = (function(){
	var
		/** @type {Object} */
		data = {
			tabs			: [],
			selectedTab		: 0,
			useTabs			: true
			},
			
		/** @type {new TrackerReport()} */
		_reportObj = undefined,
			
		globalDate = {
			/** @type {Date} */
			from: 	undefined,
			/** @type {Date} */
			to:		undefined
			},
		/** @type {DashboardTab[]} */
		tabs = undefined,
		/** 
		 * Currently selected tab
		 * @type {Object} 
		 */
		tab,
		
		isInit = false,
		
		/** 
		 * Main container
		 * @type {jQuery} */
		$container,
		
		/** @type {jQuery} */
		$tabsBodies,
		
		/** @type {jQuery} */
		$tabsTitles,
		
		/** Counter Id 
		 * @type {Number}
		 */
		_cid,
		
		_view = window['VIEW'],
		
		/** 
		 * Parent container for rows
		 * @type {jQuery}
		 */
		$rowsContainer,
		
		appendTab = function(tabData, isSelected){
			var 
				id = tabs.length,
				_tab = DashboardTab(tabData, {
					isSelected: !!isSelected,
					onSelect: function(newTabId){
						obj.switchTab(newTabId);
						obj.render();
						obj.save();
						},
					onChange: function(newTabId){
						obj.save();
						}
					});
			_tab.id(id);
			tabs.push(_tab);
			return _tab;
			},
		
			
		/** 
		 * Public functionality
		 */
		obj = {
			init: function(){
				if (isInit){
					return false;
					}
				_cid = TRACKER_DATA.counter.id;
				$container = $('#dashboard');
				if (!$container.length){
					$container = $([
						'<div id="dashboard" class="' , data.useTabs ? '' : 'dashboard-notabs' , '">',
							'<ul id="dashboard-tabs-titles"></ul>',
							'<div id="dashboard-tabs"></div>',
						'</div>'].join(''));
					$('#page-core').replaceWith($container);
					$tabsBodies = $('#dashboard-tabs');
					$tabsTitles = $('#dashboard-tabs-titles');
					}
				isInit = true;
				},
			render: function(){
				var 
					/** @type {DashboardTab} */
					_tab;
					
				this.init();
				if (!tabs){
					if (!data.tabs.length){
						/* Nothing to render */
						return false;
						}
					tabs = [];
					for (var i = 0, l = data.tabs.length; i < l; i++) {
						appendTab(data.tabs[i], i == data.selectedTab);
						}
					globalDate.from && globalDate.to && 
							WidgetCore.settings('date', globalDate);
					}
				for (var i = 0, l = tabs.length; i < l; i++) {
					tabs[i].render();
					}
				},
			switchTab: function(tabId){
				var 
					_tabEngine;
				if (data.tabs[tabId]){
					data.selectedTab = tabId;
					for (var i = 0, l = tabs.length; i < l; i++) {
						_tabEngine = tabs[i];
						_tabEngine.setSelected(i == data.selectedTab);
						}
					tab = data.tabs[tabId];
					}
				else{
					/* Unexistent tab id */
					return false;
					}
				},
			setData: function(_data){
				$.extend(data, _data);
				},
			/** 
			 * @param {new TrackerReport()}
			 */
			setReportObj : function(r){
				_reportObj = r;
				},
			setGlobalDate: function(date){
				if (date.from && date.to){
					globalDate.from = date.from;
					globalDate.to = date.to;
					return true;
					}
				return false;
				},
			save: function(){
				
				/* Cannot save dashboard in Domains */
				return false;
				
				if (!tabs){
					/* Nothing to save */
					return false;
					}
				var 
					_tab,
					newTabs = [];
				for (var i = 0, l = tabs.length; i < l; i++) {
					_tab = tabs[i];
					newTabs.push(_tab.exportData());
					}
				data.tabs = newTabs;
				$.request({
					url:		'/' + counterUrl() + '/report/summary/',
					data:{
						action: 	'save',
						data:		$.toJSON(data),
						view_id:	_reportObj._view.id
						},
					quite:true,
					type:'POST',
					success:function(res){
						if (res && res.id){
							_reportObj._view.id = res.id;
							}
						}
					});
				}
			},
			
			
		DashboardTab = function(_data, _settings){
			var
				data = {
					widgets: 	[],
					title:		''	
					},
				settings = {
					isSelected: false,
					onSelect: 	function(){},
					onChange:	function(){}
					},
				/** 
				 * Tab container
				 * @type {jQuery}
				 */
				$body,
				
				/** 
				 * Tab title
				 * @type {jQuery}
				 */
				$title,
				
				/** @type {jQuery} */
				$rowsContainer,
				
				/**
				 * Rows containers for widgets place
				 * @type {jQuery[]} */
				$$rows = [],
				
				widgets = [],
				
				/** 
				 * Global tab id (current order num	in fact)
				 * @type {Number}
				 */
				id = 0,
				
				isRendered = false,
				
				init = function(){
					if (arguments.callee.isInit){
						return false;
						}
						
					$body = $('<div class="dashboard-tab"></div>').appendTo($tabsBodies),
					$rowsContainer = $('<div class="dashboard-rows"></div>').appendTo($body);
					$title = $([
						'<li>', 
							'<a href="javascript:;">' , data.title , '</a>', 
						'</li>'].join('')).appendTo($tabsTitles);
					$title.find('>a').click(function(){
						if (!settings.isSelected){
							settings.onSelect(id);
							}
						return false;
						});
					actualize();
					arguments.callee.isInit = true;
					},
				actualize = function(){
					$body.toggle(settings.isSelected);
					$title.toggleClass('selected', settings.isSelected);
					},
				initWidget = function(wdata){
					/* Checking correctess of widget data */ 
					if (!wdata || 
						!wdata.x || !wdata.y || 
						!wdata.widget || (
							! wdata.widget.report &&
							! wdata.widget['static']
							)
						){
						/* Incorrect widget data */
						return false;
						}
					if (!wdata.widget.data){
						wdata.widget.data = {};
						}
					var 
						/** 
						 * Row contains widget container
						 * @type {jQuery} */
						$row,
						/** 
						 * Widget container wrapper
						 * @type {jQuery}
						 */
						$wContainerWrap,
						/** 
						 * Widget container
						 * @type {jQuery} */
						$wContainer;
					
					wdata = $.extend(true, {
						w: 1,
						h: 1,
						widget:{
							'class': 'table'
							},
						_counter:TRACKER_DATA.counter,
						_maxPossibleDates : _reportObj.data.maxPossibleDates,
						_minPossibleDates : _reportObj.data.minPossibleDates,
						onchange:function(){
							settings.onChange(id);
							}
						}, wdata);
					$row = $$rows[wdata.y - 1];
					if (!$row){
						/* Creating missing lines */
						for (var i = 0; i < wdata.y; i++) {
							if (!$$rows[i]){
								$$rows[i] = $([
									'<div class="dashboard-row dashboard-row-num-' , i + 1  , '">',
										'<div class="dashboard-cell dashboard-cell-num-1">',
											'<div class="dashboard-cell-core"></div>',
										'</div>',
										'<div class="dashboard-cell dashboard-cell-num-2">',
											'<div class="dashboard-cell-core"></div>',
										'</div>',
										'<div class="dashboard-cell dashboard-cell-num-3">',
											'<div class="dashboard-cell-core"></div>',
										'</div>',
									'</div>'
									].join('')).appendTo($rowsContainer);
								}
							}
						$row = $$rows[wdata.y - 1];
						}
					$wContainerWrap = $row.find('>div.dashboard-cell').eq(wdata.x - 1);
					$wContainerWrap.addClass('dashboard-cell-w-' + wdata.w);
					if (wdata.w > 1){
						$wContainerWrap.nextAll('div.dashboard-cell').slice(0, wdata.w - 1).hide();
						}
					$wContainer = $wContainerWrap.find('>div.dashboard-cell-core');
					WidgetCore.widgetStart($wContainer, wdata, {
						onload:function(widget){
							widgets.push(widget)
							}
						});
					},
				obj = {
					setData: function(_d){
						$.extend(data, _d);
						},
					render: function(){
						if (!settings.isSelected){
							return false;
							}
						if (isRendered){
							this.refresh();
							return false;
							}
						if (data.widgets){
							for (var i = 0, l = data.widgets.length; i < l; i++) {
								initWidget(data.widgets[i]);
								}
							}
						isRendered = true;
						},
					refresh: function(){
						var _w;
						for (var i = 0, l = widgets.length; i < l; i++) {
							_w = widgets[i];
							_w.run();
							}
						},
					/** 
					 * Make tab selected
					 */
					setSelected: function(state){
						settings.isSelected = !!state;
						actualize();
						},
						
					exportData: function(){
						var 
							_widget,
							newWidgets = [];
						for (var i = 0, l = widgets.length; i < l; i++) {
							_widget = widgets[i];
							newWidgets.push(_widget.exportData());
							}
						data.widgets = newWidgets;
						return data;
						},
						
					/** 
					 * Get (and set if need) tab global id
					 */
					id: function(_id){
						if (typeof _id != 'undefined'){
							id = _id
							}
						return id;
						}
					};
			_data && obj.setData(_data);
			_settings && $.extend(settings, _settings);
			init();
			return obj;
			};
	return obj;
	})(); 

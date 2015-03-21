/** 
 * @include "../../vzr.js"
 * @include "../../../../../js/lib/jschart.raphael.js"
 * @include "../../../../../js/lib/punycode.js"
 */
 ;(function(){
 	var
 		linechartObj = {
	 		/**
			 * Flag means User Agent has version of Flash Plugin to provide full functionality
			 * @type {Boolean}
			 */
			_userFlashRequired: FLASH_CHECKING.DetectFlashVer(8),
	
			_userFlashRequiredAlternate: FLASH_CHECKING.DetectFlashVer(6),
	 			
	 		_settings : {
	 			flash_src				: window['CHART_SRC']  
	 										|| '/a/tracker/report/img/swf/line_chart_tracker.swf',
	 			flash_name				: 'report_chart',
	 			infoNoDataText			: 'No attributes selected for display on the chart',
				progressBarText			: 'Loading...',
				infoErrorLoadingText	: 'Error',
				useChartEvents			: true,
				onChartReady			: function(){},
				onChartLoad				: function(){},
				reportObj				: undefined,
				
				useBalloon				: true,
				
				driver					: undefined,
				
				noDriverText			: 'Error: cannot render',
				
	 			params					: {}
	 			},
	 			
	 		_raphaelRequiredCss : ['linechart_raphael.css'],
	 			
	 		/** 
	 		 * Name of choosed driver
	 		 * Defining at first rendering and using all times later
	 		 * @type {String} 
	 		 */
	 		_driverName : undefined,
	 			
	 		_flashChart : undefined,
	 		
	 		/**
			 * Engine of JS-chart (no flash)
			 * @type {window.jschart}
			 */
			_raphaelChart: undefined,
	 		
	 			
	 		render : function(){
	 			this._superMethod('render');
	 			this.chooseDriver();
	 			if (this._driverName){
		 			this['render_' + this._driverName]();
	 				}
	 			else{
	 				this.render_nodriver();
	 				}
	 			},
	 			
	 		chooseDriver : function(){
	 			if (this._settings.driver){
	 				/* If driver name set by user always use it */
	 				this._driverName = this._settings.driver;
	 				delete this._settings.driver;
	 				}
	 			else if (! this._driverName){
	 				if (this._userFlashRequired || this._userFlashRequiredAlternate){
	 					this._driverName = 'flash';
	 					}
	 				else if ( ! BROWSER.isIE6  ){
						this._driverName = 'raphael'; 
						}
	 				}
	 			return this._driverName;
	 			},
	 		
	 		/** 
	 		 * Renders chart using driver 'flash'
	 		 */
	 		render_flash : function(){
	 			var 
	 				$this = this,
	 				isAlternate = false,
	 				flashData = $.extend({}, this._settings);
	 			if (!this.$container){
	 				return;
	 				}
	 			flashData.src = flashData.flash_src;
	 			flashData.name = flashData.flash_name;
	 			if ( ! ('useExternalInterface' in flashData.params) ){
	 				flashData.params.useExternalInterface = 0;
	 				}
	 			if (!this._flashChart){
					this._flashChart = $flashMovie(flashData.name);
					}
				if (!this._flashChart || !this._flashChart.extrefresh){
					delete this._flashChart;
					}
				if ( flashData.params && flashData.params.remoteHost && window.punycode ){
					flashData.params.remoteHost = flashData.params.remoteHost.replace(/^(https?:\/\/)(.+?)(\/.*)?$/i , function( m0 , m1 , m2 , m3 ){
						return m1 + punycode.ToASCII( m2 ) + m3 || '';
						});
					}
				isAlternate = this._flashChart ? !this._userFlashRequired : true;
				if (BROWSER.isSafari){
					isAlternate = true; /*Extrefresh unstable working in Safari*/
					}
	
				if (!isAlternate && this._flashChart && this._flashChart.extrefresh){
					/*Base flash updating method (by ExternalInterface)*/
					this._flashChart.extrefresh(flashData.params);
					}
				else{
					/*Alternate flash updating method (by updating flash container) */
					this.$container.html($flash(flashData));
					}
	 			},
	 			
	 		/** 
	 		 * Renders chart using driver 'raphael' (Raphael lib) 
	 		 */
	 		render_raphael : function(){
	 			//TODO add js loading (now rely that it has preloaded)
	 			
	 			var
					$this = this,
					/**
					 * Data for loader
					 * @type {Object}
					 **/
					loadData = {
						report: $this._settings.reportObj
						};
	
				/** @type {window.jschart} */
				if (!this._raphaelChart){
					if (this._raphaelRequiredCss){
						this.loadCss(this._raphaelRequiredCss);
						}
					this._raphaelChart = this.$container.jschart({
						orderTypeX				: window.jschart.constant('ORDERTYPE_ASC'),
						infoNoDataText			: $this._settings.infoNoDataText,
						progressBarText			: $this._settings.progressBarText,
						infoErrorLoadingText	: $this._settings.infoErrorLoadingText,
						useChartEvents			: $this._settings.useChartEvents,
						onDraw					: $this._settings.onChartReady,
						onLoad 					: $this._settings.onChartLoad,
						useBalloon				: $this._settings.useBalloon
						});
					}
	
				this._raphaelChart.load(loadData);
	 			
	 			},
	 			
	 		render_nodriver : function(){
	 			this.$container.html(this._settings.noDriverText);
	 			}
	 		};
	 		
	 window['Vzr'] && 
	 	Vzr.registerEngine('linechart', linechartObj);
 	})();
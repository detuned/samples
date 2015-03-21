/** 
 * @include "../../vzr.js"
 * @include "./geomap_svg.js"
 */
 
 ;(function(){
 	var
 		geomapObj = {
	 		/**
			 * Flag means User Agent has version of Flash Plugin to provide full functionality
			 * @type {Boolean}
			 */
			_userFlashRequired 			: FLASH_CHECKING.DetectFlashVer(8),
	
			_userFlashRequiredAlternate	: FLASH_CHECKING.DetectFlashVer(6),
			
			svgRequiredJs				: [
				'/a/js/lib/jquery.svg.js', 
				'/a/js/lib/jquery.svganim.min.js', 
				'/a/tracker/report/vzr/engines/geomap/geomap_svg.js'
				],
	 			
	 		_settings : {
	 			src 					: window['GEOMAP_SRC'] 
	 										|| '/a/tracker/report/img/swf/geomap_tracker.swf',
	 			name 					: 'report_geomap',
	 			driver					: undefined,
					
				noDriverText			: 'Error: cannot render',
				
	 			params					: {}
	 			},
	 			
	 		/** @type {String} */
	 		_driverName : undefined,
	 		_flashGeomap : undefined,
	 		
	 		/** @type {JsGeomap()} */
	 		_svgGeomap : undefined,
	 		
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
						this._driverName = 'svg'; 
						}
	 				}
	 			return this._driverName;
	 			},
	 			
	 		render : function(){
	 			if ( 
	 				! this._prevSettings 
	 				|| ! this._prevSettings.params 
	 				|| ! this._prevSettings.params.level 
	 				|| this._prevSettings.params.level != this._settings.params.level
	 				){
					 switch ( + this._settings.params.level){
						case 1:
							this._settings.params.accent_world = '1';
							break;
						case 2:
							this._settings.params.accent_country = 'ru';
							this._settings.params.accent_country_bestview = 'regions';
							break;
						case 3:
							this._settings.params.accent_country = 'ru';
							this._settings.params.accent_country_bestview = 'cities';
							break;
						} 
					}
	 			this.chooseDriver();
	 			if (this._driverName){
		 			this['render_' + this._driverName]();
	 				}
	 			else{
	 				this.render_nodriver();
	 				}
	 			},
	 			
	 		render_flash : function(){
	 			var 
	 				$this = this,
	 				isAlternate = false,
	 				refreshSettings = {};
	 			if (!this.$container){
	 				return;
	 				}
	 			/* Completing settings */
	 				if ($.isArray(this._settings.params.columns)){
	 					this._settings.params.columns = this._settings.params.columns.join('%0D');
	 					}
	 				if ( this._settings.params.rest_host_flash ){
	 					this._settings.params.rest_host = this._settings.params.rest_host_flash;
	 					}
	 			if ( ! this._flashGeomap){
					refreshSettings = $.extend({}, this._settings);
					/* Serializing structured values */
						refreshSettings.params.date_from = refreshSettings.params.date_from.getTimeStamp();
						refreshSettings.params.date_to = refreshSettings.params.date_to.getTimeStamp();
	//					refreshSettings.params.columns = refreshSettings.params.columns.join('%0D');
					
					this.$container.html($flash(refreshSettings));
					this._flashGeomap = $flashMovie('report_geomap');
					if ( ! BROWSER.isIE ){
						;(function(){
							var 
								onDraggingOut = function(){
									var fl = $this._flashGeomap;
									if (fl && fl.releaseOutside){
										fl.releaseOutside();
										}
									$(document.body).unbind('mouseup', onDraggingOut);
									};
							$this.$container
								.unbind('mousewheel')
								.bind('mousewheel', function(/* Event */e, delta){
									var fl = $this._flashGeomap;
									if (fl && fl.zoomIn && fl.zoomOut){
										if (delta > 0){
											fl.zoomIn();
											}
										else{
											fl.zoomOut();
											}
										return false;
										}
									})
								.mousedown(function(){
									$(document.body).bind('mouseup', onDraggingOut);
									});
							})();
						}
					
					}
				else if (this._flashGeomap.refresh){
					this._flashGeomap.refresh(this._settings.params);
					}
	 			},
	 			
	 		render_svg : function(){
	 			var $this = this;
	 			if ( ! window.JsGeomap && ! arguments.callee._isLoaded){
					SitePage.loadJs(
						this.svgRequiredJs, 
						function(){
							$this.render_svg();
							});
					arguments.callee._isLoaded = true;
					return;
					}
				if ( ! this._svgGeomap){
					this._svgGeomap = JsGeomap({
						$container	: $this.$container
						});
					}
				this._svgGeomap.refresh(this._settings.params);
	 			},
	 			
	 		render_nodriver : function(){
	 			this.$container.html(this._settings.noDriverText);
	 			}
	 		};
	 window['Vzr'] && Vzr.registerEngine('geomap', geomapObj );
 	})();
 
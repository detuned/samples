/**
 * @include "../../../../../js/lib/common.js"
 * @include "../../../../../js/common.js"
 * @include "../../../tracker_report_page.js"
 * @include "../../../tracker_report.js"
 * @include "../../../representation.js"
 * @include "./regions_dict.js"
 **/
 
var JsGeomap = function(_settings){
	var
		settings = {
		
		/* Base map settings */
			/** Url to geomap svg */
			mapUrl								: '/a/tracker/report/img/svg/geomap.svg',
			russiaMapUrl						: '/a/tracker/report/img/svg/geomap_russia.svg',
			baseMapWidth						: 612, //FIXME Would be nice to 
			baseMapHeight						: 324, // autodetect it after loading
			
		/* Zooming */
			minZoom								: 1,
			maxZoom								: 6,
			smoothZoom							: true,
			zoomInterval						: 500,
			
		/* Balloon */
			balloonOffsetX						: 20,
			balloonOffsetY						: -5,
			
		/* Country view */
			countryBaseBg						: 'C5C5C5',
			countryHoverBg						: 'FEFFC9',
			countryDisabledBg					: 'DCDCDC',
			countryBorderWidth					: 0.5,
			countryBorderColor					: 'FFFFFF',
			countryBorderOpacity				: 0.7,
			countryHoverBorderColor				: 'CDCE7C',
			countryHoverBorderOpacity			: 0.7,
			country_min_zoom_to_show_districts	: 1,
			country_max_zoom_to_show_districts	: 2,
			country_min_zoom_to_show_regions	: 2,
			country_max_zoom_to_show_regions	: 4,
			
		/* Country background range */
			country_hue_min						: 85,
			country_hue_max						: 85,
			country_saturation_min				: 0.1,
			country_saturation_max				: 0.8,
			country_brightness_min				: 0.89,
			country_brightness_max				: 0.7,
			
			
		/* Region view */
			allowRegions						: true,
			regionBaseBg						: 'C5C5C5',
			regionHoverBg						: 'FEFFC9',
			regionBorderWidth					: 0.5,
			regionBorderColor					: 'FFFFFF',
			regionBorderOpacity					: 0.7,
			regionHoverBorderColor				: 'CDCE7C',
			regionHoverBorderOpacity			: 0.7,
			regionsDictUrl						: '/a/tracker/report/vzr/engines/geomap/regions_dict.js',
			
		/* Region background range */
			region_hue_min						: 85,
			region_hue_max						: 85,
			region_saturation_min				: 0.1,
			region_saturation_max				: 0.8,
			region_brightness_min				: 0.89,
			region_brightness_max				: 0.7,
			
		/* Districts view */
			allow_districts						: false,
			districtBaseBg						: 'C5C5C5',
			districtHoverBg						: 'FEFFC9',
			districtBorderWidth					: 0.5,
			districtBorderColor					: 'FFFFFF',
			districtBorderOpacity				: 0.7,
			districtHoverBorderColor				: 'CDCE7C',
			districtHoverBorderOpacity			: 0.7,
			districtsDictUrl						: '/a/tracker/report/vzr/engines/geomap/districts_dict.js',	
			
		/* District background range */
			district_hue_min						: 85,
			district_hue_max						: 85,
			district_saturation_min				: 0.1,
			district_saturation_max				: 0.8,
			district_brightness_min				: 0.89,
			district_brightness_max				: 0.7,	
			
		/* Cities */
			allow_cities							: false,
			allow_regions							: false,
			
		/* Progress Bar */
			progressBarText						: _('Loading...'),
			
			
		/* Data params (using to load) */
			/** @type {Array} */
			columns								: [],
			/** @type {Number} */
			primary_column						: 0,
			/** @type {String} */
			counter_id							: '',
			/** @type {Date} */
			date_from							: undefined,
			/** @type {Date} */
			date_to								: undefined,
			/** @type {String} */
			lang								: undefined,
			detalisation						: 'day',
			/** @type {Number} */
			level								: undefined,
			level_countries						: 1,
			level_districts						: 1,
			level_regions						: 2,
			/** @type {Boolean} */
			accent_world						: false,
			/** @type {Boolean} */
			accent_country						: false,
			accent_country_bestview				: 'regions',
			
			show_country						: undefined,
			/** @type {String} */
			report_id							: undefined,
			/** @type {String} */
			rest_host							: undefined,
			/** @type {String} */
			rest_url							: undefined
			
			},
			
		columnSetTitles = {
			visitors : function(n){
				return _('(0) visitors', n);
				},
			sessions : function(n){
				return _('(0) sessions', n);
				},
			pageviews : function(n){
				return _('(0) pageviews', n);
				},
			files : function(n){
				return _('(0) files', n);
				},
			bytes : function(n){
				return _('(0) bytes', n);
				},
			domains : function(n){
				return _('(0) domains', n);
				},
			admins : function(n){
				return _('(0) admins', n);
				}
			},
		/**
		 * Base element contains svg
		 * @type {jQuery}
		 */
		$container,
		/** Svg controller (see jquery.svg.js) */
		svg,
		/**
		 * Svg html element
		 * @type {jQuery}
		 */
		$svg,
		
		/** 
		 * All countries
		 * @type {Object}
		 */
		countries = {},
		
		normalCanvasWidth,
		normalCanvasHeight,
		containerWidth,
		containerHeight,
		containerLeft,
		containerTop,
		startMapWidth,
		offset = {
			top		: 0,
			left	: 0
			},
		
		isDragging	= false,
		viewBox	= {
			x		: 0,
			y		: 0,
			width	: 0,
			height	: 0
			},

		isInitialized = false,

		initialize = function(){
			if (isInitialized){
				/* Have initialized earlier */
				return false;
				}
			if (!$container){
				/* Cannot continue without container */
				return false;
				}
			$container.svg();
			svg = $container.svg('get');
			actualizeContainerSizes();

			isInitialized = true;
			},
			
		load = function(_params){
			var
				params = {
					items		: ['map', 'data'],
					complete	: function(res){}
					},
				completeNum = 0,
				composedRes	= {
					},
				loaderSuccess = function(name, res){
					composedRes[name] = res;
					},
				loaderComplete = function(name){
					if (++completeNum >= params.items.length){
						params.complete(composedRes);
						}
					},
				loaders = {
					map		: loadMap,
					data	: loadData
					};
			_params && $.extend(params, _params);
			for (var i = 0, l = params.items.length; i < l; i++) {
				;(function(){
					var
						_loaderName = params.items[i],
						_loader = loaders[_loaderName];
					if (_loader){
						_loader({
							success : function(res){
								loaderSuccess(_loaderName, res);
								},
							complete : function(){
								loaderComplete(_loaderName);
								progressBar.hide();
								}
							});
						}
					})();
				}
			progressBar.show();
			},

		/**
		 * Loads svg file from server
		 * @param {Object}
		 */
		loadMap = function(_params){
			var
				params = {
					success : function(){},
					complete : function(){},
					force : false
					},
				done = function(){
					params.success();
					params.complete();
					};
			_params && $.extend(params, _params);
			if (arguments.callee.lastMapUrl && settings.mapUrl == arguments.callee.lastMapUrl && !params.force){
				/* Avoid to reload the same svg*/
				done();
				return;
				}
			svg.load(
				settings.show_country && settings.show_country == 'ru' 
					? settings.russiaMapUrl
					: settings.mapUrl, 
				{
				addTo:			false,
				changeSize:		true,
				onLoad:			function(svg, error){
					processMap();
					done();
					}
				});
			arguments.callee.lastMapUrl = settings.mapUrl; 
			},
			
			
		loadData = function(_params){
			var
				params = {
					success 		: function(){},
					complete 		: function(){},
					lc				: settings.lang,
					level			: settings.level_countries,
					primary_column	: settings.primary_column,
					columns			: settings.columns 
										? settings.columns.join('%0D')
										: ''
					},
				/** @type {UrlComposer()} */
				url;
			_params && $.extend(params, _params),
			dateFormat = TrackerReport.REMOTE_DATE_FORMATS[ settings.detalisation ];
			url = UrlComposer(
				[
					trimStr(settings.rest_host, '/ '), 
					trimStr(settings.rest_url, '/ '), 
					settings.counter_id, 
					settings.report_id,
					settings.date_from.format( dateFormat ) + '-' + 
					settings.date_to.format( dateFormat ) + '.json'
					], 
				{
					lc				: params.lang,
					level			: params.level,
					primary_column	: params.primary_column,
					column			: params.columns 
					}
				);

			$.request({
				type 		: 'GET',
				url			: url,
				success 	: params.success,
				complete 	: params.complete
				})
			},

		/**
		 * Runs after svg loaded, binds needed events,
		 * prepares it to use
		 */
		processMap = function(){
			var
				/** @type {Country()} */
				_country,
				onMouseUp = function(){
					$svg.unbind('mousemove');
					$(document.body)
						.unbind('mouseup', onMouseUp)
						.removeClass('grabbing');
//					isDragging = false;
					},
				countNormalCanvasSizes = function(){
					var 
						width 			= $container.width(),
						height			= $container.height(),
						ratio			= width / height,
						wFactor			= settings.baseMapWidth / width,
						hFactor			= settings.baseMapHeight / height;
						
					/* 
					 * Correcting canvas size by real factors 
					 * of changing base svg sizes
					 */
						if (wFactor > hFactor){
							normalCanvasWidth = settings.baseMapWidth * wFactor;
							normalCanvasHeight = normalCanvasWidth / ratio;
							}
						else{
							normalCanvasHeight = settings.baseMapHeight * hFactor;
							normalCanvasWidth = normalCanvasHeight * ratio;
							}
					startMapWidth = settings.baseMapWidth * ( width / normalCanvasWidth);
					},
				resizeTimer,
				onResize = function(force){
					if (resizeTimer){
						clearTimeout(resizeTimer);
						resizeTimer = undefined;
						}
					if (force){
						actualizeContainerSizes();
						countNormalCanvasSizes();
						zoomer.zoom(zoomer.zoom(), false);
						}
					else {
						resizeTimer = setTimeout(function(){
							onResize(true);
							}, 500);
						}
					};
			$(document.body)
				.bind('mouseleave', onMouseUp);
			countNormalCanvasSizes();
			viewBox.x				= 0.5 * (startMapWidth - $container.width());
			viewBox.width 			= normalCanvasWidth;
			viewBox.height 			= normalCanvasHeight;
			svg.configure({
				width				: '100%',
				height				: '100%',
				viewBox				: [viewBox.x, viewBox.y, viewBox.width, viewBox.height].join(' '),
				fill				: '#' + settings.countryBaseBg,
				stroke				: '#' + settings.countryBorderColor,
				'stroke-width'		: settings.countryBorderWidth,
				'stroke-opacity'	: settings.countryBorderOpacity,
				'vector-effect'		: 'non-scaling-stroke'
				});
			$svg					= $(svg.root())
				.bind({
					mousedown : function(/* Event */e){
						var
							cursorStartLeft = e.pageX,
							cursorStartTop	= e.pageY,
							viewBoxStartX	= viewBox.x,
							viewBoxStartY	= viewBox.y;

						e.preventDefault();
						$(document.body)
							.bind('mouseup', onMouseUp)
							.addClass('grabbing');

						$svg.bind('mousemove', function(/* Event */e){

							/* Starting map drag */
							isDragging = true;
							placeMap({
								x	: viewBoxStartX - (e.pageX - cursorStartLeft) / zoomer.zoom(),
								y	: viewBoxStartY - (e.pageY - cursorStartTop) / zoomer.zoom()
								});
							});
						},
					click : function(){
						if (isDragging){
							isDragging = false;
							}
						else{
							obj.zoomIn(true);
							}
						},
					mousewheel : function(/* Event */e, delta){
						if (delta > 0){
							obj.zoomIn(true);
							}
						else{
							obj.zoomOut(true);
							}
						e.preventDefault();
						}
					});

			$svg.find('>path,>polygon,>g').each(function(){
				var p, id;
					if (
						! (id = $(this).attr('id')) 
						|| 'c' != id.toString().split('_').shift()
						){
						return;
						}
				var
					
					country = Country({
						$container	: $(this)
						});
				if (country.name()){
					if ( settings.show_country && country.name() != settings.show_country ){
						country.deactivate();
						}
					countries[country.name()] = country;
					
					if (country.hasInnerObjects()){
						/* 
						 * Binding show/hide events for only countries with inner objects 
						 * to prevent overhead
						 */
						country
							.bind(Country.EVENT_SHOW_INNER_OBJECTS, function(/* Event */e, eventData){
								disableAllCountries();
								})
							.bind(Country.EVENT_HIDE_INNER_OBJECTS, function(/* Event */e, eventData){
								enableAllCountries();
								})
						}
					}
				});
				
			if ( settings.show_country && ( _country = countries[settings.show_country] ) ){
				settings.country_min_zoom_to_show_regions = 2;
				}

			$(window).resize(function(){
				onResize();
//				placeMap({
//					width	: (normalCanvasWidth = $container.width()), 
//					height	: (normalCanvasHeight = $container.height()) 
//					});
				})
				
			/* Initializing zoomer */
			zoomer.initialize({
				container : $('<div />').appendTo($container)
				});
				
			/* Initializing balloon */
			balloon.initialize();
			},
		
			
		actualizeContainerSizes = function(){
			containerWidth	 = $container.width();
			containerHeight	 = $container.height();
			containerLeft	 = $container.offset().left; 
			containerTop	 = $container.offset().top; 
			},
		processData = function(data){
			var
				_item,
				_name,
				/** @type {Country()} */
				_country,
				/** @type {Number} */
				_stat, 
				/** @type {Number} */
				minStat, 
				/** @type {Number} */
				maxStat,
				/** @type {Number} */
				_countryFactor;
			if (!data || !data.report || !data.report.item){
				/* Cannot continue with incorrect data */
				return;
				}
			for (var i = 0, l = data.report.item.length; i < l; i++) {
				_item = data.report.item[i];
				if (_item.v == '-'){
					continue;
					}
				if ((_name = getNameByObj(_item)) && (_country = countries[_name])){
					_country.title(_item.r.join(' '));
					_stat = + _item.c[0];
					_country.stat(_stat);
					maxStat = !isNaN(maxStat) ? Math.max(maxStat, _stat) : _stat;
					minStat = !isNaN(minStat) ? Math.min(minStat, _stat) : _stat;
					}
				}
			if (!isNaN(minStat) && !isNaN(maxStat)){
				$.each(countries, function(){
					var
						/** @type {Country()} */
						_c = this;
					if (!_c.stat()){
						return;
						}
					_countryFactor = maxStat != minStat
						? (_c.stat() - minStat) / (maxStat - minStat)
						: 1;
					_c.color(getCountryBgByFactor(_countryFactor).toString(16))
					});
				}
			triggerEvent(obj.EVENT_PLACE_MAP);
			
			},
			
		getNameByObj = function(item){
			var name;
			if (item && item.v){
				name = trimStr( item.v , ' \\s\\t' ).split( "\t" ).pop();
				if (! isNaN( + name)){
					return getNameByBitMask( name );
					}
				else {
					return String( name ).toLowerCase();
					}
				}
			},	
			
		/** 
		 * Converts bitmask to country name
		 * @param {Number}
		 */
		getNameByBitMask = function(bitMask) {
			var 
				/**
				 * Hex
				 * @type {String}
				 */
				s = Number(bitMask).toString(16),
				/**
				 * Charcode of first char
				 * @type {Number}
				 */
				c0 = parseInt(s.substr(0, 2), 16),
				/**
				 * Charcode of second char
				 * @type {Number}
				 */
				c1 = parseInt(s.substr(2, 4), 16);
			return String.fromCharCode(c0).toLocaleLowerCase() + String.fromCharCode(c1).toLocaleLowerCase();
			},
			
		getCountryBgByFactor = function(factor){
			if (isNaN(factor)) {
				return settings.countryBaseBg;
				}
			return ColorsConverter.hsb2hex([
				settings.country_hue_min + factor * (settings.country_hue_max - settings.country_hue_min),
				settings.country_saturation_min * 100 + factor * 100 * (settings.country_saturation_max - settings.country_saturation_min),
				settings.country_brightness_min * 100 + factor * 100 * (settings.country_brightness_max - settings.country_brightness_min)
				]);
			},	
			
		/**
		 * Counts viewBox position and size at given zoom value
		 * Caches results
		 * @param {Number} Zoom
		 */
		countViewBox = function(z){
			if (!arguments.callee.cache){
				arguments.callee.cache = [];
				}
			if (!arguments.callee.cache[z] || true){
				arguments.callee.cache[z] = {
					x		: 0.5 * normalCanvasWidth * (z - 1) / z,
					y		: 0.5 * normalCanvasHeight * (z - 1) / z,
					width 	: normalCanvasWidth / z,
					height 	: normalCanvasHeight / z
					};
				}
			return $.extend({}, arguments.callee.cache[z]);
			},

		placeMap = function(vb, animate){
			if (vb){
				viewBox = $.extend({}, viewBox, vb || {})
				};
			var
				minVbX			= - viewBox.width * 0.5,
				maxVbX			= normalCanvasWidth - viewBox.width * 0.5,
				minVbY			= - viewBox.height * 0.5,
				maxVbY			= normalCanvasHeight - viewBox.height * 0.5;

			viewBox.x = Math.max( minVbX, Math.min( maxVbX, viewBox.x ));
			viewBox.y =  Math.max( minVbY, Math.min( maxVbY, viewBox.y ));

			if (animate){
				$svg.stop().animate({
					svgViewBox	: [ viewBox.x, viewBox.y, viewBox.width, viewBox.height ].join(' ')
					}, settings.zoomInterval, function(){
						triggerEvent(obj.EVENT_PLACE_MAP);
						});
				}
			else{
				svg.configure({
					viewBox	: [ viewBox.x, viewBox.y, viewBox.width, viewBox.height ].join(' ')
					});
				triggerEvent(obj.EVENT_PLACE_MAP);
				}
			},
			
		zoomer = (function(){
			var
				/** @type {jQuery} */
				$container,
				/** @type {jQuery} */
				$track,
				/** @type {jQuery} */
				$buttonPlus,
				/** @type {jQuery} */
				$buttonMinus,
				/** @type {jQuery} */
				$thumb,
				
				/** @type {Number} */
				trackHeight = 0,

				_settings = {
					},
					
				zoomValue	= 1,
				zoomFactor	= 0,
				
				_isThumbDragging = false,
				
				_isInitialized = false,
				render = function(){
					if (!$container){
						/* Cannot continue without container */
						return;
						}
					$container
						.empty()
						.addClass('geomap-zoomer');
					$track = $('<span class="geomap-zoomer-track"/>')
						.appendTo($container);
					$buttonPlus = $('<span class="geomap-zoomer-btn geomap-zoomer-btn-plus">+</span>')
						.click(function(){
							_obj.increase();
							})
						.appendTo($container);
					$buttonMinus = $('<span class="geomap-zoomer-btn geomap-zoomer-btn-minus">&ndash;</span>')
						.click(function(){
							_obj.decrease();
							})
						.appendTo($container);
					$thumb = $('<span class="geomap-zoomer-thumb" />')
						.appendTo($track)
						.allowDrag({
							maxXDelta : 0,
							onbegin	: function(target, /* Event */e, draggingSettings){
								e.preventDefault();
								draggingSettings.maxTop = trackHeight;
								_isThumbDragging = true;
								},
							onmove : function(target, left, top){
								setZoomByThumb(top);
								},
							oncomplete : function(){
								setZoomByThumb();
								_isThumbDragging = false;
								}
							});
							
					trackHeight = $track.height() - $thumb.height();
					
					},
					
				setZoomByThumb = function(thumbTop){
					if (isNaN(thumbTop)){
						thumbTop = parseInt($thumb.css('top'));
						}
					_obj.zoom(settings.minZoom + (settings.maxZoom - settings.minZoom) * (thumbTop / trackHeight), false);
					},
					
				actualize = function(){
					var
						css = {
							top : trackHeight * zoomFactor
							};
					if (settings.smoothZoom){
						$thumb.stop().animate(css, settings.zoomInterval);
						}
					else{
						$thumb.css(css);
						}
						
					/* 
					 * Hack for visible constant stroke width in browsers 
					 * has not native support of 
					 * vector-effect: 'non-scaling-stroke'
					 */
					!BROWSER.isOpera && !BROWSER.isChrome
						&& svg.configure({
							'stroke-width' : settings.countryBorderWidth / zoomValue 
							});
					},
				
				/**
				 * Public of zoomer
				 */
				_obj = {
					
					
					initialize : function(_s){
						if (_isInitialized){
							/* Have initialized earlier */
							return;
							}
						if (_s){
							if (_s.container){
								$container = $(_s.container);
								delete _s.container;
								}
							$.extend(_settings, _s);
							}
						render();
						_isInitialized = true;
						},
						
					zoom : function(_zoom, smooth){
						if (typeof _zoom == 'undefined'){
							return zoomValue;
							}
						var
							newZoom 	= Math.max(settings.minZoom, Math.min(settings.maxZoom, _zoom)),
							newViewBox	= countViewBox(newZoom),
							prevViewBox	= newZoom == zoomValue 
											? $.extend(newViewBox)
											: countViewBox(zoomValue),
							vbOffsetX	= viewBox.x - prevViewBox.x,
							vbOffsetY	= viewBox.y - prevViewBox.y;
							
						newViewBox.x += vbOffsetX;
						newViewBox.y += vbOffsetY;
		
						zoomFactor = (newZoom - settings.minZoom) / (settings.maxZoom - settings.minZoom);
						zoomValue = newZoom;
						
						actualize();
						
						if (smooth === true || (settings.smoothZoom && smooth !== false)){
							placeMap(newViewBox, true);
							}
						else{
							placeMap(newViewBox);
							}
						return zoomValue;
						},
					
					increase : function(){
						this.zoom(zoomValue + 1);
						},
						
					decrease : function(){
						this.zoom(zoomValue - 1);
						},
						
					isDragging : function(){
						return _isThumbDragging;
						}
					}
			return _obj;
			})(),

		balloon = (function(){
			var
				/** @type {jQuery} */
				$balloon,
				_isInitialized = false,
				_settings = {
					},
				/** @type {Number} */
				_x = 0,
				/** @type {Number} */
				_y = 0, 
				/** @type {String} */
				_text = '',
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
						$balloon = $('<div class="geomap-balloon" />')
							.hide()
							.appendTo(document.body);
						_isInitialized = true;
						},
					show : function(x, y, text){
						if (! text){
							this.hide();
							return;
							}
						_x = x;
						_y = y;
						_text = text;
						$balloon
							.html(text)
							.css({
								left 	: x + settings.balloonOffsetX,
								top 		: y + settings.balloonOffsetY
								})
							.showBlock();
						},
					hide : function(){
						$balloon.hide();
						}
					};
			return _obj;
			})(),
		
		progressBar = (function(){
			var
				/** @type {jQuery} */
				$progressBar,
				/** @type {jQuery} */
				$progressBarBar,
				/** @type {jQuery} */
				$progressBarCore,
				interval, 
				bgpos = 0,
				actualizeProgressBar = function(){
					if (bgpos++ >= 18){
						bgpos = 0;
						}
					$progressBarBar[0].style.backgroundPosition = bgpos + 'px -600px';
					},
				/** 
				 * Public of progressBar
				 */
				_obj = {
					show : function(){
						if (!$progressBar){
							$progressBar = $([
								'<div class="chart-progressbar">',
									'<span class="chart-progressbar-overlay"></span>',
								'</div>'].join(''))
								.appendTo($container).css({
									position:			'absolute',
									left:				0,
									top:				0,
									zIndex:				10
									});
							$progressBarCore = $([
								'<div class="chart-progressbar-core">',
									'<span class="chart-progressbar-text">', settings.progressBarText ,'</span>',
									'<span class="chart-progressbar-bar">',
										'<span class="chart-progressbar-light"></span>',
									'</span>',
								'</div>'
								].join('')).appendTo($progressBar).css({
									position:			'absolute'
									});
							$progressBarBar = $progressBarCore.find('.chart-progressbar-bar');
							}
						if (!$progressBar.is(':visible')){
							actualizeProgressBar();
							$progressBar.show();
							$progressBar.find('>.chart-progressbar-overlay').hide().fadeIn(800);
							$progressBar.data('interval', setInterval(actualizeProgressBar,30));
							}
						$progressBar
							.width($container.width())
							.height($container.height());
						},
					hide : function(){
						if ($progressBar){
							$progressBar.hide();
							clearInterval($progressBar.data('interval'));
							}
						}
					};
			return _obj;
			})(),
			
		/** 
		 * @param {Country()}
		 */
		isCountryVisible = function(country){
			var
				place = country.getPlace();
			if (
				place.left >= containerLeft 
				&& place.left <= containerLeft + containerWidth
				&& place.top >= containerTop 
				&& place.top <= containerTop + containerHeight 
				){
				return true;
				}	
			return false;	
			},
		
		
		disableAllCountries = function(){
			$.each(countries, function(){
				this.disable();
				});
			},
			
		enableAllCountries = function(){
			$.each(countries, function(){
				this.enable();
				});
			},
		
		Country = function(_s){
			var
				/** @type {jQuery} */
				$country,
				
				/** @type {jQuery} */
				$base,
				
				/** 
				 * Regions container 
				 * @type {jQuery} 
				 */
				$regions,
				
				regions = {},
				
				_hasRegions = false,
				
				_displayingRegions = false,
				
				_displayingInnerObjects = false,
				
				_loadedRegionsStat = false,
				
				_loadingRegionsStat = false,
				
				/** 
				 * Districts container 
				 * @type {jQuery} 
				 */
				$districts,
				
				districts = {},
				
				_hasDistricts = false,
				
				_displayingDistricts = false,
				
				_displayingInnerObjects = false,
				
				_loadedDistrictsStat = false,
				
				_loadingDistrictsStat = false,
				
				_name,
				
				_title = '',
				
				_stat = 0,
				
				_balloonText = '',
				
				_color,
				
				/** 
				 * Preserving real color value while temporarily changes it 
				 * (when disabling or smth else)
				 */
				_realColor,
				
				_disabled = false,
				
				_bBox = {
					x		: 0,
					y		: 0,
					width 	: 0,
					height 	: 0
					},
				
				/** 
				 * Country settings
				 */
				_settings = {
					},
					
				_isInitialized = false,	
				initialize = function(){
					var box;
					if (_isInitialized){
						/* Have initialized earlier */
						return;
						}
					if (!$country){
						/* Cannot continue without container */
						return;
						}
					_name = String($country.attr('id').toString().replace(/_[0-9]_$/, '')).split('_').pop();
					$base = $country.find('>#base');
					if (!$base.length){
						$base = $country;
						}
					$base
						.removeAttr('fill')
						.attr({
							'vector-effect'		: 'non-scaling-stroke'
							})
						.hover(
							function(){
								if ( ! _disabled){
									$(this).attr({
										fill				: '#' + settings.countryHoverBg,
										stroke				: '#' + settings.countryHoverBorderColor
										});
									}
								},
							function(){
								(_color 
									&& $(this).attr('fill', '#' + _color)
									|| $(this).removeAttr('fill')
									
									).removeAttr('stroke');
								balloon.hide();
								}
							)
						.bind('mousemove', function(/* Event */e){
							if ( _displayingInnerObjects ){
								return;
								}
							if (_stat && ! _disabled){
								balloon.show(e.pageX, e.pageY, _balloonText || refreshBalloonText());
								}
							else{
								balloon.hide();
								}
							})
						
							
					if (settings.allowRegions){
						initRegions();
						}
					if (_hasRegions){
						obj.bind(obj.EVENT_PLACE_MAP, onMoveMap);
						}
					if (settings.allow_districts){
						initDistricts();
						}
					if (_hasDistricts){
						obj.bind(obj.EVENT_PLACE_MAP, onMoveMap);
						}
					_bBox = $country[0].getBBox();
					_isInitialized = true;
					},
					
				refreshBalloonText = function(){
					var
						fullSetName = settings.columns[1].toString(),
						setName = fullSetName.split('_').shift(),
						sign = fullSetName.indexOf('percent') + 1 ? '&nbsp;%' : '';
					return (_balloonText = [
						'<h3 class="geomap-balloon-title">', _title, '</h3>',
						(_stat 
							? [
								'<p class="geomap-balloon-text">', 
									String(_stat).numberFormat(), 
									sign,
									columnSetTitles[setName]
										? ' ' + columnSetTitles[setName](_stat)
										: '',  
								'</p>'
								].join('') 
							: '')
						].join(''));
					},
				
				triggerEvent = function(event, eventData){
					$(_obj).triggerHandler(event, [eventData]);
					},		
					
				/** 
				 * @param {Number} New zoom factor
				 */
				onMoveMap = function(/* Event */e){
					var zoom = zoomer.zoom();
					if (settings.allowRegions){
						if (
							zoom >= settings.country_min_zoom_to_show_regions
							&& ( 
									! settings.allow_cities
									|| ! settings.country_max_zoom_to_show_regions 
									|| zoom < settings.country_max_zoom_to_show_regions)
									&&
								isCountryVisible(_obj)
							){
								
							if (!_loadedRegionsStat && !_loadingRegionsStat){
								loadRegionsStat();
								}	
							_displayingRegions = true;
							}
						else{
							_displayingRegions = false;
							}
						toggleRegions()
						}
					if (settings.allow_districts){
						if (
							zoom >= settings.country_min_zoom_to_show_districts
							&& ( 
									( ! settings.allow_cities && ! settings.allow_regions )
									|| ! settings.country_max_zoom_to_show_districts
									|| zoom < settings.country_max_zoom_to_show_districts)
									&&
								isCountryVisible(_obj)
							){
								
							if ( ! _loadedDistrictsStat && ! _loadingDistrictsStat ){
								loadDistrictsStat();
								}	
							_displayingDistricts = true;
							}
						else{
							_displayingDistricts = false;
							}
						toggleDistricts()
						}
					checkInnerObjects();
					},	
				
				/* Regions */
					
				initRegions = function(){
					$regions = $country.find('>#regions');
					if ($regions.length){
						$regions.find('>path,>polygon').each(function(){
							var p, id;
							if (
								! (id = $(this).attr('id')) 
//								|| 'c' != id.toString().split('_').shift()
								){
								return;
								}
							var
								region = Region({
									$container	: $(this)
									});
							if (region.name()){
								regions[region.name()] = region;
								_hasRegions = true;
								}
							});
						}
					},
				
				toggleRegions = function(){
					if (_hasRegions) {
						$regions.toggle( _displayingRegions );
						}
					},
					
				/** 
				 * @param {Number}
				 */
				getRegionBgByFactor = function(factor){
					if (isNaN(factor)) {
						return settings.regionBaseBg;
						}
					return ColorsConverter.hsb2hex([
						settings.region_hue_min + factor * (settings.region_hue_max - settings.region_hue_min),
						settings.region_saturation_min * 100 + factor * 100 * (settings.region_saturation_max - settings.region_saturation_min),
						settings.region_brightness_min * 100 + factor * 100 * (settings.region_brightness_max - settings.region_brightness_min)
						]);
					},
					
				loadRegionsStat = function(){
					var _load = function(){
						loadData({
							level	: settings.level_regions,
							success : function(res){
								var 
									items = [],
									_item = {
										c : [],
										r : [],
										/** @type {String} */
										v : undefined
										},
									/** @type {Region()} */
									_r,
									/** @type {Number} */
									_regionFactor,
									/** @type {Number} */
									minStat = 0,
									/** @type {Number} */
									maxStat = 0;
								if (res && res.report && res.report.item && res.report.item.length){
									items = res.report.item;
									}
								for (var i = 0, l = items.length; i < l; i++) {
									_item = items[i];
									if (
										_item.v != '' && 
										! !(_r = regions[RegionsDict.getRegionCode(_item.v)])){
										_r.title( _item.r[0] + ( _item.r[1] ? ',<br>' + _item.r[1] : '' ) )
										_r.stat(_item.c[0]);
										maxStat = !isNaN(maxStat) ? Math.max(maxStat, _r.stat()) : _r.stat();
										minStat = !isNaN(minStat) ? Math.min(minStat, _r.stat()) : _r.stat();
										}
									}
								$.each(regions, function(){
									_regionFactor = maxStat > minStat > 0
											? (this.stat() - minStat) / (maxStat - minStat)
											: 1;
									this.color( getRegionBgByFactor(_regionFactor).toString(16) );
									})
								},
							complete : function(){
								_loadedRegionsStat = true;
								_loadingRegionsStat = false;
								}
							})
						}
						
					if (_loadedRegionsStat){
						return;
						}
					if ( ! window.RegionsDict ){
						SitePage.loadJs(settings.regionsDictUrl, _load);
						}
					else{
						_load();
						}
					_loadingRegionsStat = true;
					},
					
					
				/* Districts */
					
				initDistricts = function(){
					$districts = $country.find('>#districts');
					if ($districts.length){
						$districts.find('>path,>polygon').each(function(){
							var p, id;
							if (
								! (id = $(this).attr('id')) 
//								|| 'c' != id.toString().split('_').shift()
								){
								return;
								}
							var
								district = District({
									$container	: $(this)
									});
							if (district.name()){
								districts[district.name()] = district;
								_hasDistricts = true;
								}
							});
						}
					},	
					
				toggleDistricts = function(){
					if (_hasDistricts) {
						$districts.toggle( _displayingDistricts );
						}
					},
					
				/** 
				 * @param {Number}
				 */
				getDistrictBgByFactor = function(factor){
					if (isNaN(factor)) {
						return settings.districtBaseBg;
						}
					return ColorsConverter.hsb2hex([
						settings.district_hue_min + factor * (settings.district_hue_max - settings.district_hue_min),
						settings.district_saturation_min * 100 + factor * 100 * (settings.district_saturation_max - settings.district_saturation_min),
						settings.district_brightness_min * 100 + factor * 100 * (settings.district_brightness_max - settings.district_brightness_min)
						]);
					},
					
				loadDistrictsStat = function(){
					var _load = function(){
						loadData({
							level	: settings.level_districts,
							success : function(res){
								var 
									items = [],
									_item = {
										c : [],
										r : [],
										/** @type {String} */
										v : undefined
										},
									/** @type {District()} */
									_r,
									/** @type {Number} */
									_districtFactor,
									/** @type {Number} */
									minStat = 0,
									/** @type {Number} */
									maxStat = 0;
								if (res && res.report && res.report.item && res.report.item.length){
									items = res.report.item;
									}
								
								for (var i = 0, l = items.length; i < l; i++) {
									_item = items[i];
									if (
										_item.v != '' && 
										! !(_r = districts[DistrictsDict.getDistrictCode(_item.v)])){
										_r.title(_item.r[0])
										_r.stat(_item.c[0]);
										maxStat = !isNaN(maxStat) ? Math.max(maxStat, _r.stat()) : _r.stat();
										minStat = !isNaN(minStat) ? Math.min(minStat, _r.stat()) : _r.stat();
										}
									}
								$.each(districts, function(){
									_districtFactor = maxStat > minStat > 0
											? (this.stat() - minStat) / (maxStat - minStat)
											: 1;
									this.color( getDistrictBgByFactor(_districtFactor).toString(16) );
									})
								},
							complete : function(){
								_loadedDistrictsStat = true;
								_loadingDistrictsStat = false;
								}
							})
						}
						
					if (_loadedDistrictsStat){
						return;
						}
					if ( ! window.DistrictsDict ){
						SitePage.loadJs(settings.districtsDictUrl, _load);
						}
					else{
						_load();
						}
					_loadingDistrictsStat = true;
					},
				
					
				checkInnerObjects = function(){
					var	newState = _displayingRegions || _displayingDistricts;
					if (_displayingInnerObjects != newState) {
						if (newState) {
							triggerEvent(Country.EVENT_SHOW_INNER_OBJECTS);
							}
						else {
							triggerEvent(Country.EVENT_HIDE_INNER_OBJECTS);
							}
						_displayingInnerObjects = newState;
						}
					},
					
				applyColor = function(c){
					if (typeof(c) != 'undefined'){
						_color = c;
						}
					$base.attr('fill', '#' + _color);
					},
				
				/** 
				 * Public of Country
				 */
				_obj = {
					name : function(){
						return _name;
						},
					title : function(t){
						if (typeof(t) != 'undefined'){
							_title = t;
							_balloonText = '';
							}
						return _title;
						},
					stat : function(s){
						if (typeof(s) != 'undefined'){
							_stat = +s;
							_balloonText = '';
							}
						return _stat;
						},
					color : applyColor,
					reset : function(){
						$base.removeAttr('fill');
						_color = undefined;
						_balloonText = '';
						
						if (_hasRegions && regions){
							$.each(regions, function(){
								this.reset();
								});
							_loadedRegionsStat = false;
							_loadingRegionsStat = false;
							_displayingRegions = false;
							}
						_displayingInnerObjects = false;
						checkInnerObjects();
						
						},
						
						
					enable : function(){
						if (_realColor){
							applyColor(_realColor);
							_realColor = undefined;
							}
						_disabled = false;
						},
						
					disable : function(){
						_realColor = _color;
						applyColor(settings.countryDisabledBg);
						_disabled = true;
						},
						
					getPlace : function(){
						var
							pos = $country.offset(),
							cx = pos.left + _bBox.width * zoomer.zoom() / 2,
							cy = pos.top + _bBox.height * zoomer.zoom() / 2;
						return {
							left	: cx,
							top		: cy
							}
						},
					getWidth : function(){
						return _bBox.width * zoomer.zoom();
						},
					getHeight : function(){
						return _bBox.height * zoomer.zoom();
						},
					hasInnerObjects : function(){
						return _hasRegions;
						},
					bind : function(){
						var d = $(this);
						d.bind.apply(d, arguments);
						return this;
						},
					unbind : function(){
						var d = $(this);
						d.unbind.apply(d, arguments);
						return this;
						},
					deactivate : function(){
						$country.remove();
						}
					};
			if (_s){
				if (_s.$container){
					$country = $(_s.$container);
					delete _s.$container;
					}
				$.extend(_settings, _s);
				initialize();
				}
			return _obj;
			},
			
			
		Region = function(_s){
			var
				/** @type {jQuery} */
				$region,
				
				/** @type {jQuery} */
				$base,
				_settings = {
					},
					
				_name,
				
				_title = '',
				
				_stat = 0,
				
				_balloonText = '',
				
				_color,
				
				
				_isInitialized = false,	
				
				initialize = function(){
					if (_isInitialized){
						/* Have initialized earlier */
						return;
						}
					if (!$region){
						/* Cannot continue without container */
						return;
						}
					_name = String($region.attr('id').toString().replace(/_[0-9]_$/, '')).split('_').pop();
					$base = $region.find('>#base');
					if (!$base.length){
						$base = $region;
						}
					$base
						.removeAttr('fill')
						.attr({
							'vector-effect'		: 'non-scaling-stroke'
							})
						.hover(
							function(){
								$(this).attr({
									fill				: '#' + settings.regionHoverBg,
									stroke				: '#' + settings.regionHoverBorderColor
									});
								},
							function(){
								(_color 
									&& $(this).attr('fill', '#' + _color)
									|| $(this).removeAttr('fill')
									
									).removeAttr('stroke');
								balloon.hide();
								}
							)
						.bind('mousemove', function(/* Event */e){
							if (_stat){
								balloon.show(e.pageX, e.pageY, _balloonText || refreshBalloonText());
								}
							else{
								balloon.hide();
								}
							})
					_isInitialized = true;
					},
					
				refreshBalloonText = function(){
					var
						fullSetName = settings.columns[1].toString(),
						setName = fullSetName.split('_').shift(),
						sign = fullSetName.indexOf('percent') + 1 ? '&nbsp;%' : ''
					
					return (_balloonText = [
						'<h3 class="geomap-balloon-title">', _title, '</h3>',
						(_stat 
							? [
								'<p class="geomap-balloon-text">', 
									String(_stat).numberFormat(), 
									sign,
									 columnSetTitles[setName]
										? ' ' + columnSetTitles[setName](_stat)
										: '',  
								'</p>'
								].join('') 
							: '')
						].join(''));
					},
				
				
				/** 
				 * Public of Region
				 */
				_obj = {
					name : function(){
						return _name;
						},
					title : function(t){
						if (typeof(t) != 'undefined'){
							_title = t;
							_balloonText = '';
							}
						return _title;
						},
					stat : function(s){
						if (typeof(s) != 'undefined'){
							_stat = +s;
							_balloonText = '';
							}
						return _stat;
						},
					color : function(c){
						if (typeof(c) != 'undefined'){
							_color = c;
							}
						$base.attr('fill', '#' + _color);
						},
					reset : function(){
						$base.removeAttr('fill');
						_color = undefined;
						_balloonText = '';
						}
					};
			if (_s){
				if (_s.$container){
					$region = $(_s.$container);
					delete _s.$container;
					}
				$.extend(_settings, _s);
				initialize();
				}
			return _obj;
			},
		
			
		District = function(_s){
			var
				/** @type {jQuery} */
				$district,
				
				/** @type {jQuery} */
				$base,
				_settings = {
					},
					
				_name,
				
				_title = '',
				
				_stat = 0,
				
				_balloonText = '',
				
				_color,
				
				
				_isInitialized = false,	
				
				initialize = function(){
					if (_isInitialized){
						/* Have initialized earlier */
						return;
						}
					if (!$district){
						/* Cannot continue without container */
						return;
						}
					_name = String($district.attr('id').toString().replace(/_[0-9]_$/, '')).split('_').pop();
					$base = $district.find('>#base');
					if (!$base.length){
						$base = $district;
						}
					$base
						.removeAttr('fill')
						.attr({
							'vector-effect'		: 'non-scaling-stroke'
							})
						.hover(
							function(){
								$(this).attr({
									fill				: '#' + settings.districtHoverBg,
									stroke				: '#' + settings.districtHoverBorderColor
									});
								},
							function(){
								(_color 
									&& $(this).attr('fill', '#' + _color)
									|| $(this).removeAttr('fill')
									
									).removeAttr('stroke');
								balloon.hide();
								}
							)
						.bind('mousemove', function(/* Event */e){
							if (_stat){
								balloon.show(e.pageX, e.pageY, _balloonText || refreshBalloonText());
								}
							else{
								balloon.hide();
								}
							})
					_isInitialized = true;
					},
					
				refreshBalloonText = function(){
					var
						fullSetName = settings.columns[1].toString(),
						setName = fullSetName.split('_').shift(),
						sign = fullSetName.indexOf('percent') + 1 ? '&nbsp;%' : ''
					
					return (_balloonText = [
						'<h3 class="geomap-balloon-title">', _title, '</h3>',
						(_stat 
							? [
								'<p class="geomap-balloon-text">', 
									String(_stat).numberFormat(), 
									sign,
									 columnSetTitles[setName]
										? ' ' + columnSetTitles[setName](_stat)
										: '',  
								'</p>'
								].join('') 
							: '')
						].join(''));
					},
				
				
				/** 
				 * Public of District
				 */
				_obj = {
					name : function(){
						return _name;
						},
					title : function(t){
						if (typeof(t) != 'undefined'){
							_title = t;
							_balloonText = '';
							}
						return _title;
						},
					stat : function(s){
						if (typeof(s) != 'undefined'){
							_stat = +s;
							_balloonText = '';
							}
						return _stat;
						},
					color : function(c){
						if (typeof(c) != 'undefined'){
							_color = c;
							}
						$base.attr('fill', '#' + _color);
						},
					reset : function(){
						$base.removeAttr('fill');
						_color = undefined;
						_balloonText = '';
						}
					};
			if (_s){
				if (_s.$container){
					$district = $(_s.$container);
					delete _s.$container;
					}
				$.extend(_settings, _s);
				initialize();
				}
			return _obj;
			},	
			
		triggerEvent = function(event, eventData){
			$(obj).triggerHandler(event, [eventData]);
			},	
			
		/**
		 * Public of JsGeomap
		 */
		obj = {
			EVENT_PLACE_MAP : 'place_map',

			/**
			 * @param {Number} Zoom factor between <code>settings.minZoom</code> and <code>settings.maxZoom</code>
			 */
			zoom 	: zoomer.zoom,
			zoomIn 	: zoomer.increase,
			zoomOut	: zoomer.decrease,
			refresh	: function(_s){
				var $this = this;
				if (_s){
					$.extend(settings, _s);
					}
				this.reset();
				load({
					complete : function(res){
						if (res && res.data){
							processData(res.data);
							}
						if (settings.accent_world){
							settings.accent_world = false;
							$this.showAll();
							}
						else if (settings.accent_country){
							$this.accentCountry(settings.accent_country, settings.accent_country_bestview)
							settings.accent_country = false;
							}
							
						}
					});
				},
			showAll : function(){
				zoomer.zoom(1, false);
				placeMap({
					x : 0.5 * (startMapWidth - containerWidth),
					y : 0
					}, true)
				},
			accentCountry : function(cid, zoomToBestView){
				var
					country = countries[cid],
					newZoom = zoomToBestView == 'regions' 
						? settings.country_min_zoom_to_show_regions
						: 1;
				if ( ! country ){
					return;
					}
				zoomer.zoom(newZoom, false);
				//FIXME
				placeMap(
					settings.show_country
						?  {
							x : 15,
							y : 75
							}
						: {
							x : 100,
							y : 0
							}
					, true);
				},
			reset	: function(){
				$.each(countries, function(){
					this.reset();
					})
				},
			bind : function(){
				var d = $(this);
				d.bind.apply(d, arguments);
				},
			unbind : function(){
				var d = $(this);
				d.unbind.apply(d, arguments);
				}
			};
	Country.EVENT_SHOW_INNER_OBJECTS = 'show_inner_objects';
	Country.EVENT_HIDE_INNER_OBJECTS = 'hide_inner_objects';
	if (_settings){
		if (_settings.$container){
			$container = $(_settings.$container);
			}
		$.extend(settings, _settings);
		}
	initialize();
	return obj;
	};
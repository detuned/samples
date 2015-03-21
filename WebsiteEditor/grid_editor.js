/**
 * @include "../../js/lib/core.js" 
 * @include "../../js/lib/jscore.js" 
 * @include "../../js/lib/jquery.json.js" 
 * @include "../../js/lib/jquery.validate.js" 
 * @include "./editor.js" 
 * @include "./image_manager.js" 
 * @include "../../../_s/js/picviewer.js" 
 * @include "./picviewer_edit.js" 
 */
 
;(function(/* jQuery */$){
	window.Editor = window.parent.Editor;
	window.LANG = window.parent.LANG || 'ru';
	if (!window.Editor){
		/* Seems like page was open in separate window, not iframe */
		return;
		}
	var
		BLOCK_EVENT_SAVE = 'block_event_save',
		
		CATALOG_TYPE_ROOT = 6,
		CATALOG_TYPE_FOLDER = 7,
		CATALOG_TYPE_ITEM = 8,
		
		YMAPS_KEY = 'sdfsdfsdfsdfsdf',
			
		ModalDialog = (function(settings){
			var
				/** @type {jQuery} */
				$overlay,
				overlay = function(state){
					var
						overlayClass = 'editor-modal-overlay',
						currState = !! ( $overlay && $overlay.length );
					if (typeof state == 'undefined'){
						state = ! currState;
						}
					if (state){
						if ( ! currState){
							$overlay = $('<div class="' + overlayClass + '"></div>').appendTo(document.body);
							}
						}
					else if ( currState ){
							$overlay.remove();
							$overlay = undefined;
						}
					},
				_modalDialogObj = {
					Instance : function(settings){
						var
							_settings = {
								title				: _( 'editor:default_dialog_title' ),
								containerClass		: 'editor-modal-dialog',
								headerClass			: 'editor-modal-dialog-header',
								bodyClass			: 'editor-modal-dialog-body',
								closeBtnClass		: 'editor-modal-dialog-close-btn',
								submitBlockClass	: 'editor-modal-dialog-submit-block',
								submitButtonClass	: 'editor-modal-dialog-submit-button',
								cancelButtonClass	: 'editor-modal-dialog-cancel-button',
								addClass			: '',
								closeByEsc			: true,
								/** 
								 * Need to use submit block in bottom of dialog: submit & cancel buttons
								 * @type {Boolean}
								 */
								useSubmit			: false,
								onsubmit			: function(){},
								oncancel			: function(){},
								submitButtonCaption	: _( 'editor:action_save' ),
								cancelButtonCaption	: _( 'editor:action_cancel' ),
								
								removeOnHide		: false
								},
							/** @type {jQuery} */
							$dialog,
							/** @type {jQuery} */
							$header,
							/** @type {jQuery} */
							$body,
							/** @type {jQuery} */
							$submitBlock,
							/** @type {jQuery} */
							$closeBtn,
							
							bodyKeyPress = function(/* Event */e){
								if (e.keyCode == 27 && _settings.closeBtnClass){
									_modalDialogInstance.hide();
									}
								},
							
							
							_modalDialogInstance = {
								show : function(){
									overlay(true);
									$dialog.show();
									$(document).bind('keydown', bodyKeyPress);
									this.place();
									},
								hide : function(){
									$(document.body).unbind('keydown', bodyKeyPress);
									$dialog.hide();
									overlay(false);
									if (_settings.removeOnHide){
										this.remove();
										}
									},
								remove : function(){
									overlay(false);
									$dialog.remove();
									},
								place : function(){
									$dialog.placeAtCenter();
									},
								$dialog : $dialog,
								$header : $header,
								$body : $body
								},
							initialize = function(){
								/* Creating container */
								$dialog = _modalDialogInstance.$dialog = $(['<div class="',
									[_settings.containerClass, _settings.addClass].join(' ') ,
									'"></div>'].join(''))
									.hide()
									.appendTo(document.body);
								$header = _modalDialogInstance.$header = $(['<div class="', _settings.headerClass, '">',
										_settings.title,
										'</div>'].join(''))
									.appendTo($dialog);
								$body = _modalDialogInstance.$body = $('<div class="' + _settings.bodyClass + '"></div>')
									.appendTo($dialog);
								if (_settings.useSubmit){
									$submitBlock = $([
										'<div class="' + _settings.submitBlockClass + '">',
											'<button type="submit" class="' , _settings.submitButtonClass , '">',
												_settings.submitButtonCaption,
											'</button>',
											'<span class="' , _settings.cancelButtonClass , '">',
												_settings.cancelButtonCaption,
											'</span>',
										'</div>'].join(''))
										.delegate('button', 'click', function(){
											_modalDialogInstance.hide();
											_settings.onsubmit();
											})
										.delegate('span', 'click', function(){
											_modalDialogInstance.hide();
											_settings.oncancel();
											})
										.appendTo($dialog);
									}
								$closeBtn = $('<span class="' + _settings.closeBtnClass + '"></span>')
									.click(function(){
										_modalDialogInstance.hide();
										})
									.appendTo($dialog);
								_modalDialogInstance.show();
								};
						settings && $.extend(_settings, settings);
						initialize();
						return _modalDialogInstance;
						}
					};
			return _modalDialogObj;
			})(),
			
		ImageCropper = (function(){
			var
				
				initJcrop = function(oncomplete){
					if ( ! $.Jcrop){
						SitePage.loadCss('/s/js/lib/jcrop/jquery.Jcrop.css')
						SitePage.loadJs('/s/js/lib/jcrop/jquery.Jcrop.js', function(){
							oncomplete();
							})
						}
					else{
						oncomplete();
						}
					
					},
				_imageCropperObj = {
					Selection : function(params){
						var
							_selectionObj = {
								/** @type {Number} */
								x 		: undefined,
								/** @type {Number} */
								y 		: undefined,
								/** @type {Number} */
								x2 		: undefined,
								/** @type {Number} */
								y2 		: undefined,
								/** @type {Number} */
								w 		: undefined,
								/** @type {Number} */
								h 		: undefined
								};
						params && $.extend(_selectionObj, params);
						return _selectionObj;
						},
					Instance : function(settings){
						var
							
							_settings = {
								/** 
								 * Image uri
								 * @type {String}
								 */
								uri : undefined,
								/** 
								 * Init x-position of crop selection
								 * @type {Number}
								 */
								x : 0,
								/** 
								 * Init y-position of crop selection
								 * @type {Number}
								 */
								y : 0,
								/** 
								 * Init width of crop selection
								 * @type {Number}
								 */
								w : undefined,
								/** 
								 * Init height of crop selection
								 * @type {Number}
								 */
								h : undefined,
								/** @type {Number} */
								aspectRatio : undefined,
								onsubmit : function(){}
								},
							/** @type {ModalDialog.Instance()} */
							_dialog,
							/** @type {jQuery} */
							$img,
							
							/** @type {_imageCropperObj.Selection()} */
							_currentSelection = {},
							
							
							startCrop = function(){
								var
									onChange = function(c){
										_currentSelection = c;
										},
									/** 
									 * Jcrop init object
									 * @type {Object}
									 */
									init = {
										onSelect 	: onChange,
										onChange	: onChange
										};
								if (_settings.aspectRatio){
									init.aspectRatio = _settings.aspectRatio;
									}
								/* Protecting from 'null' or smth in x & y */
									_settings.x = _settings.x || 0;
									_settings.y = _settings.y || 0;
									_settings.w = _settings.w || 0;
									_settings.h = _settings.h || 0;
									
								if (_settings.w && (_settings.h || _settings.aspectRatio)){
									init.setSelect = [
										_settings.x, 
										_settings.y,
										_settings.x + _settings.w,
										_settings.h 
											? _settings.y + _settings.h
											: _settings.w / _settings.aspectRatio  
										];
									}
								$img.Jcrop(init);
								},
							
							initialize = function(){
								_dialog = ModalDialog.Instance({
									title 			: _( 'editor:crop_dialog.title' ),
									addClass 		: 'editor-modal-dialog-cropper',
									useSubmit		: true,
									onsubmit		: function(){
										_settings.onsubmit(_currentSelection);
										},
									removeOnHide	: true
									});
								_dialog.$dialog.css({
									visibility 	: 'hidden'	
									}).fadeTo(0,0);
								$img = $(['<img src="' , _settings.uri , '?rnd=' , Math.round( Math.random() * 10000 ) + 10000 , '" alt="" />'].join(''))
									.load(function(){
										_dialog.$dialog.width($(this).width());
										_dialog.place();
										_dialog.$dialog
											.css('visibility', '')
											.fadeTo('fast', 1, function(){
												initJcrop(startCrop);
												});
										
										})
									.appendTo(_dialog.$body);
								
								},
							/** 
							 * Public of ImageCropper instance
							 */
							_imageCropperInstance = {
								//TODO
								};
							
						settings && $.extend(_settings, settings);
						initialize();
						return _imageCropperInstance;
						}
					};
			return _imageCropperObj;
			})(),
			
		ImageManagerDialog = function(settings){
			var
				_settings = {
					onSelect 	: function(){},
					onCancel 	: function(){},
					allowCrop 	: false,
					defaultCat	: undefined
					},
				/** @type {ModalDialog.Instance()} */
				_dialog,
				
				/** @type {ImageManager.Instance()} */
				_manager,
				
				initEngine = function(oncomplete){
					if ( ! window.ImageManager){
						SitePage.loadJs('/s/editor/js/image_manager.js', function(){
							oncomplete();
							})
						SitePage.loadCss('/s/editor/css/image_manager.css');
						BROWSER.isIE7 && SitePage.loadCss('/s/editor/css/image_manager.ie7.css');
						}
					else{
						oncomplete();
						}
					},
					
				startManage = function(){
					_manager = ImageManager.Instance({
						container 	: _dialog.$body,
						allowCrop 	: _settings.allowCrop,
						defaultCat	: _settings.defaultCat,
						onSelect 	: function(res){
							_dialog.hide();
							_settings.onSelect(res);
							}
						});
					},
				
				initialize = function(){
					_dialog = ModalDialog.Instance({
						title 			: _( 'editor:imagemanager_dialog.title' ),
						addClass 		: 'editor-modal-dialog-imagemanager',
						useSubmit		: false,
						removeOnHide	: true
						});
					_dialog.$body.html( _( 'editor:loading_fast' ) );
					initEngine(startManage);
					},
				/** 
				 * Public of ImageManagerDialog
				 */
				_imageManagerDialog = {
					
					};
			settings && $.extend(_settings, settings);
			initialize();
			return _imageManagerDialog;
			},
		HandlersRegistry 	= (function(){
			var
				/** 
				 * Storage for saving registering handlers
				 * Using block types as keys
				 */
				registry = {},
				
				/**
				 *  Public of HandlersRegistry
				 *  @type {Object}
				 */
				obj = {
					/** 
					 * Registers new block handler
					 * and saves it related to given params
					 * @param {Object} Object to describe useability of registering handler
					 * @param {Object} Functionality (prototype) of registering handler
					 */
					register : function(_params, proto){
						var
							params = {
								/** @type {String} */
								type			: undefined,
								/** @type {String} */
								extendsHandler	: undefined
								},
							/** @type {String} */
							name,
							Engine,
							ParentEngine = BaseBlockHandler;
						_params && $.extend(params, _params);
						if (params.extendsHandler && registry[params.extendsHandler.toLowerCase()]){
							//FIXME recursion
							ParentEngine = registry[params.extendsHandler.toLowerCase()];
							}
						name = params.type;
						if (!name){
							//Cannot register handler with no type
							return;
							}
						name = name.toLowerCase();
						Engine = registry[name] = function($block){
							Engine.superClass.apply(this, arguments);
//							Engine.prototype = $.extend(true, {}, Engine.prototype);
							Engine.prototype._engineName = name;
							};
						Engine.inheritsFrom(ParentEngine);
						proto && $.extend(Engine.prototype, proto);
						},
						
					getAppropriate : function($block){
						var	
							res = BaseBlockHandler,
							type = $block.searchInClass('block-type-');
						if (type && (type = type.toLowerCase()) && registry[type]){
							res = registry[type];
							}
						return res;
						}
					
					};
			return obj;
			})(),
		/** 
		 * Builds and sets up field to edit content of given container
		 * @param {jQuery}
		 * @param {Object}
		 * @return {jQuery}
		 */
		editField = function($container, _params){
			var
				/** @type {jQuery} */
				$field,
				/** @type {Number} */
				containerWidth,
				/** @type {Number} */
				containerHeight,
				/** 
				 * Default params
				 * @type {Object}
				 */
				params = {
					type				: 'input',
					name				: 'title',
					placeholder			: '',
					content				: '',
					width				: undefined,
					minHeight			: 25,
					css					: {},
					useWysiwyg			: false,
					hideWhileInit		: true,		
					onInit				: function(){},
					wysiwygSettings		: {
						theme								: 'advanced',
						skin								: 'editor',
						language							: LANG,
						inlinepopups_skin					: 'setupeditor',
						plugins								: 'inlinepopups,autoresize,paste,simpledoc,simpletable',
						
						/* Paste plugin settings */
						paste_auto_cleanup_on_paste			: true,
						paste_strip_class_attributes		: true,
						paste_remove_styles					: true,
						paste_preprocess					: function( pl , o ){
							// Removing non breaking spaces cause it can break block layout
							o.content = o.content.replace( /&nbsp;/g , ' ' );
							},
						
						
						/* Simpletable plugin settings */
						table_styles						: [
																_( 'editor:wysiwyg.class_no_border' ) , 
																'no-border'
																].join('='),
						
						
						script_url							: '/s/editor/js/tiny_mce/tiny_mce.js',
						content_css							: [
							'/page/css/common.css',
							'/s/editor/css/content.css' ,
							'/s/editor/css/wysiwyg.css'
							].join(','),
						body_class							: 'block-text',
						style_formats						: [
							{title : _( 'editor:wysiwyg.format.weak' ), 
								inline : 'span', attributes : { 'class' : 'weak'}},
							{title : _( 'editor:wysiwyg.format.weaker' ), 
								inline : 'span', attributes : { 'class' : 'weaker'}},
							{title : _( 'editor:wysiwyg.format.accent' ), 
								inline : 'span', attributes : { 'class' : 'accent'}},
							{title : _( 'editor:wysiwyg.format.accenter' ), 
								inline : 'span', attributes : { 'class' : 'accenter'}},
							{title : _( 'editor:wysiwyg.format.highlighted' ), 
								inline : 'span', attributes : { 'class' : 'highlighted'}}
							],
						theme_advanced_blockformats 		: "p,h2,h3",
						
						//Only one future can by used: autoresize plugin or user resize
						/* theme_advanced_resizing  		: true,
						theme_advanced_resize_horizontal 	: false,
						theme_advanced_resizing_use_cookie 	: false,
						theme_advanced_resizing_min_height	: 100,
						
						theme_advanced_statusbar_location	: 'bottom', */
						
						theme_advanced_toolbar_location		: 'top',
						theme_advanced_toolbar_align		: 'left',
						
						theme_advanced_buttons1				: ( Editor.isProSite() ? 'code,|,' : '' ) +  
																'bold,italic,|,link,unlink,|,justifyfull,|,bullist,numlist,|,table,delete_table,|,image,simpledoc,|,styleselect,formatselect',
						theme_advanced_buttons2				: '',
						theme_advanced_buttons3				: '',
						
						theme_advanced_buttons1_semilight	: ( Editor.isProSite() ? 'code,|,' : '' ) + 
																'bold,italic,|,link,unlink,|,bullist,numlist,|,image,simpledoc,|,styleselect,formatselect',
						theme_advanced_buttons1_light		: ( Editor.isProSite() ? 'code,|,' : '' ) + 
																'bold,italic,|,link,unlink,|,image,simpledoc,|,styleselect',
						theme_advanced_buttons1_extralight	: 'bold,italic,|,link,unlink,|,styleselect',
						
						custom_shortcuts					: false,
						execcommand_callback				: function(editor_id, elm, command, user_interface, value){
							if (command == 'mceImage'){
								//TODO
								}
							},
						
						file_browser_callback				: function(field_name, url, type, win){
							if (type == 'file'){
								/* Links */
								tinyMCE.activeEditor.windowManager.open({
									file 			: '/s/editor/links.html',
									title 			: _( 'editor:wysiwyg.links_dialog.title' ),
									width 			: 500,  
									height 			: 300,
									resizable 		: "yes",
									inline 			: "yes",
									close_previous 	: "no"
									}, {
									    window 	: win,
									    input 	: field_name,
									    editor	: tinyMCE.activeEditor
									});
								}
							else{
								/* Images */
								tinyMCE.activeEditor.windowManager.open({
									file 			: '/s/editor/images.html',
									title 			: _( 'editor:wysiwyg.images_dialog.title' ),
									width 			: 800,  
									height 			: 400,
									resizable 		: "yes",
									inline 			: "yes",
									close_previous 	: "no"
									}, {
									    window 	: win,
									    input 	: field_name,
									    editor	: tinyMCE.activeEditor
									});
								}
						   
							return false;
							},
						
						relative_urls						: false,
						extended_valid_elements 			: 'noindex' +
							// Allowing empty dives for pro sites to enable for them yandex maps
							Editor.isProSite()
								? [',+div[align<center?justify?left?right|class|dir<ltr?rtl|id|lang|onclick' , 
									'|ondblclick|onkeydown|onkeypress|onkeyup|onmousedown|onmousemove', 
									'|onmouseout|onmouseover|onmouseup|style|title],embed[*]'
									].join('')
  								: '',
						custom_elements					: 'noindex',
						invalid_elements					: 'pre',
						setup								: function( editor ){
							if ( Editor.isProSite() ){
								 editor.onPreProcess.add(function(ed, o) {
								 	if ( o.get ){
								 		tinymce.each(ed.dom.select('div', o.node), function(n){
							 				/* 
							 				 * Inserting &nbsp; in each empty div to preserve it in result html
							 				 * (usable when inserting embeded code etc)
							 				 */
								 			if ( !n.innerHTML || /^\s+|<br\s*\/?>$/.test( String( n.innerHTML ) ) ){
								 				n.innerHTML = '&nbsp;';
								 				}
								 			})
								 		}
					                });
					               editor.onBeforeSetContent.add(function( ed , o ){
								 		o.content = o.content.replace( /(src\=\"http:\/\/api-maps\.yandex\.ru\/[0-9\.]+\/\?key=[a-zA-Z0-9\=_\-]+)(\&amp.+\")/g , "$1~" + YMAPS_KEY  + "$2" )
					               	})
								}
							},
						init_instance_callback				: function(editor){
							/* 
							 * Extending tinyMCE i18n by our l10n dict of current lang 
							 * All msgid will hide under keyword 'ext'
							 */
							tinyMCE.addI18n( [ LANG , 'ext' ].join('.'), window.parent.__lang || {} )
							
							if (params.hideWhileInit && $container){
								$container
									.css('visibility', 'visible')
									.fadeTo('fast', 1, function(){
										$(this).css({
											display	: '',
											visibility : '',
											opacity : ''
											})
										});
								}
								

							if ( tinymce.isIE || tinymce.isOpera ){
								/* 
								 * IE, and from any time Opera too, ignores attaching 'load' event to window here 
								 * so we'll just wait few time and fire listeners
								 */
								setTimeout(function(){
									tinyMCE.activeEditor.execCommand('mceAutoResize');
									params.onInit(tinyMCE.activeEditor);
									}, 200)
								}
							else{
								tinymce.dom.Event.add(editor.getWin(), 'load', function(e) {
								 	tinyMCE.activeEditor.execCommand('mceAutoResize');
									params.onInit(tinyMCE.activeEditor);
								    });
								}
							}
						} 
					};
			if (!$container || !$container.length){
				//Cannot work without container
				return false;
				}
			params.wysiwygSettings.body_class = $container.attr('class');
			_params && $.extend(true, params, _params);
			containerWidth 	= $container.width();
			containerHeight = $container.height();
			switch (params.type){
				case 'textarea':
					$field = $([
						'<textarea name="' , params.name , '">' , 
							htmlspecialchars( 
								params.useWysiwyg 
									? params.content
									: strip_tags( params.content )
									),
						'</textarea>'
						].join(''))
						.appendTo($container.empty())
						.css($.extend({
							'color'		: $container.css('color'),
							'fontSize'	: $container.css('fontSize'),
							'fontFamily': $container.css('fontFamily'),
							'width'		: params.width || containerWidth || '100%',  
							'height'	: Math.max( params.minHeight, containerHeight )
							}, params.css));
					if (params.useWysiwyg){
						if (containerWidth < 450){
							params.wysiwygSettings.theme_advanced_buttons1 = params.wysiwygSettings.theme_advanced_buttons1_semilight;
							}
						if (containerWidth < 390){
							params.wysiwygSettings.theme_advanced_buttons1 = params.wysiwygSettings.theme_advanced_buttons1_light;
							}
						if (containerWidth <= 250){
							params.wysiwygSettings.theme_advanced_buttons1 = params.wysiwygSettings.theme_advanced_buttons1_extralight;
							}
						if (params.hideWhileInit){
							$container
								.css('visibility', 'hidden')
								.fadeTo(0, 0);
							}
						$field.tinymce(params.wysiwygSettings);
						}
					else{
						params.onInit($field);
						}
					break;
				default:
				case 'input':
					$field = $([
						'<input type="text"',
							' value="' , htmlspecialchars( strip_tags ( params.content ) ) , 
							'" name="' , params.name , 
							'" placeholder="' , params.placeholder , 
							'" autocomplete="off" />'
						].join(''))
						.appendTo($container.empty())
						.css($.extend({
							'color'		: $container.css('color'),
							'fontSize'	: $container.css('fontSize'),
							'fontFamily': $container.css('fontFamily'),
							'width'		: containerWidth,
							'height'	: Math.max( params.minHeight, containerHeight )
							}, params.css));
					params.onInit($field);
					break;
				}
			return $field;
			},
		
		
		/** 
		 * Parses object described in plain text format like:
		 * <pre>
		 * key1 : value1 
		 * key2 : value2 
		 * </pre>
		 */
		parsePlainTextObject = function( txt ){
			var
				rows = strip_tags( txt ).split( /\r?\n/ ),
				_p,
				_key,
				res = {};
			
			if ( rows && rows.length ){
				for (var i = 0, l = rows.length; i < l; i++) {
					_p = String( rows[ i ] ).split(':');
					_key = trimStr( _p.shift() );
					res [ _key ] = trimStr( _p.join(':') ); 
					}
				}
			return res;
			};
			

	


	var
		GridLevelSet = function( levelSetContainer , params ){
			var
				_params = {
					levelSetIdBase				: 'levels-set-id-',
					levelClass					: 'level',
					levelIdClassBase			: 'level-',
					levelActiveClass			: 'level-active',
					levelMovingClass			: 'level-moving',
					levelMainMovingClass		: 'level-moving-main',
					buttonContainerClass 		: 'level-buttons',
					buttonUpContainerClass 		: 'level-button level-button-up',
					buttonDownContainerClass 	: 'level-button level-button-down',
					buttonUpTitle				: _( 'editor:block_level.up' ),
					buttonDownTitle				: _( 'editor:block_level.down' ),
					buttonDisabledClass			: 'level-button-disabled',
					moveTime					: 500,
					moveEasing					: 'swing',
					saveUrl						: '/block/set-blocks'
					},
				_levelSetData = {
					id : undefined
					},
				allEngines = {},
				/** @type {jQuery} */
				$levelSetContainer,
				registerEngine = function( /* GridLevel() */engine ){
					allEngines[ engine.getId() ] = engine;
					},
				actualizeAllEngines = function( except ){
					$.each(allEngines , function( id ){
						if ( ! except || except != id ){
							this.actualize();
							}
						})
					},
				/** 
				 * @return {GridLevel()}
				 */
				getEngineByContainer = function( c ){
					return allEngines[ $( c ).searchInClass( _params.levelIdClassBase ) ];
					},
				/** 
				 * @return {jQuery}
				 */
				getLevelContainers = function(){
					return $( 'div.' + _params.levelClass );
					},
				levelSetInitialize = function(){
					getLevelContainers().each( function(){
						registerEngine( GridLevel( this ) );
						}  );
					},
				levelSetObj = {
					save : function( p ){
						var
							levels = [],
							_p = {
								success : function(){}
								};
						getLevelContainers().each(function(){
							levels.push( 'level_' + getEngineByContainer( this ).getId() );
							});
						$.request({
							type	: 'POST',
							url 	: _params.saveUrl,
							data 	: {
								block_id 	: _levelSetData.id,
								location	: Editor.getPageUri(),
								data		: $.toJSON({
									blocks : levels
									})
								},
							success : function(){
								_p.success()
								}
							})
						}
					},
				/** 
				 * Level controller
				 * Allows change its order
				 */
				GridLevel = function( container ){
					var
						/** @type {jQuery} */
						$container,
						_data = {
							id : 0
							},
						setContainer = function( c ){
							$container = $( c );
							},
						/** @type {jQuery} */
						$btnContainer,
						/** @type {jQuery} */
						$btnUp,
						/** @type {jQuery} */
						$btnDown,
						/** @type {jQuery} */
						$prevLevelContainer,
						/** @type {jQuery} */
						$nextLevelContainer,
						
						initialize = function(){
							if ( ! $container ){
								return false;
								}
							$container.addClass( _params.levelActiveClass );
							_data.id = $container.searchInClass( _params.levelIdClassBase );
							$btnContainer = $( [ '<div class="' , _params.buttonContainerClass , '" ></div>' ].join('') );
							$btnUp = $( [ '<span',
								' class="' , _params.buttonUpContainerClass  , '"' ,
								' title="' , _params.buttonUpTitle , '"' ,
								'/>' ].join('') )
								.click(function(){
									obj.moveUp();
									})
								.appendTo( $btnContainer );
							$btnDown = $( [ '<span',
								' class="' , _params.buttonDownContainerClass  , '"' ,
								' title="' , _params.buttonDownTitle , '"' ,
								'/>' ].join('') )
								.click(function(){
									obj.moveDown();
									})
								.appendTo( $btnContainer );
							
							$btnContainer.appendTo( $container );
							
							/* Window resize handling */
							(function(){
								var
									tightClass = 'width-narrow',
									$container = $(document.body),
									minWidth = 960 + 80,
									onResize = function(){
										$container.toggleClass( tightClass , $(window).width() <= minWidth );
										}
								$( window ).resize( onResize );
								onResize();
								})();
							
							},
							
						moveTo = function( dir ){
							var
								$nextContainer = dir == 'up' 
									? $prevLevelContainer
									: $nextLevelContainer;
							if ( ! $nextContainer.length ){
								return;
								}
							var
								blocks = getBlocks();
							for (var i = 0, l = blocks.length; i < l; i++) {
								blocks[i].prepareToMove();
								}
							var
								/** @type {GridLevel()} */
								nextEngine = getEngineByContainer( $nextContainer ),
								top = $container.offset().top,
								height = $container.outerHeight( true ),
								nextTop = $nextContainer.offset().top,
								nextHeight = $nextContainer.outerHeight( true ),
								complete = function(){
									
									$container[ dir == 'up' ? 'insertBefore' : 'insertAfter' ]( $nextContainer );
									actualizeAllEngines( _data.id );
									for (var i = 0, l = blocks.length; i < l; i++) {
										blocks[i].afterMove();
										}
									nextEngine 
										&& nextEngine.stopSlide();
									obj.actualize();
									levelSetObj.save();
									
									};
							obj.slideTo( {
								top 		: dir == 'up'	
												? nextTop - top
												: nextHeight,
								isMain		: true,
								complete 	: complete
								} );
							nextEngine
								&& nextEngine.slideTo({
									'top' : dir == 'up'
												? height
												: top - nextTop
									});
							
							},
						
						
						getBlocks = function(){
							return GridEditor.searchBlocks({
								container : $container
								});
							},
						
						obj = {
							moveUp : function(){
								moveTo( 'up' );
								},
							moveDown : function(){
								moveTo( 'down' );
								},
								
							slideTo : function( p ){
								var
									_p = {
										top 		: 0 ,
										complete 	: function(){},
										moveTime 	: _params.moveTime,
										moveEasing	: _params.moveEasing,
										isMain		: false
										}
								p && $.extend( _p , p );
								$container.addClass( _params.levelMovingClass );
								_p.isMain 
									&& $container.addClass( _params.levelMainMovingClass );
								$container
									.animate({
										'top' : _p.top
										}, 
										_p.moveTime, 
										_p.moveEasing , 
										function(){
											$container
												.removeClass( _params.levelMovingClass )
												.css( 'visibility', 'hidden' )
												.css( 'top', '' );
											_p.isMain 
												&& $container.removeClass( _params.levelMainMovingClass );
											_p.complete();
											$container.css( 'visibility', '' );
											}
										);
								},
							stopSlide : function(){
								$container.stop();
								$container
									.removeClass( _params.levelMovingClass )
									.css( 'top', '' );
								},
							actualize : function(){
								$prevLevelContainer = $container.prev( '.' + _params.levelClass ); 
								$nextLevelContainer = $container.next( '.' + _params.levelClass ); 
								$btnUp.toggleClass( _params.buttonDisabledClass , ! $prevLevelContainer.length );
								$btnDown.toggleClass( _params.buttonDisabledClass , ! $nextLevelContainer.length );
								},
							getId : function(){
								return _data.id;
								}
							};
					if ( container ){
						setContainer( container );
						}
					else{
						return false;
						}
					initialize();
					obj.actualize();
					return obj;
					};
			
					
			params && $.extend( _params , params );
			if ( levelSetContainer ){
				$levelSetContainer = $( levelSetContainer );
				_levelSetData.id = $levelSetContainer.searchInClass( _params.levelSetIdBase );
				}
			else{
				return false;
				}
			levelSetInitialize();
			return levelSetObj;
			};
		
	var	
		/** 
		 * Main editor controller
		 * Controls all editing page
		 */
		GridEditor = (function(){
			var
			
				MAINIMG_WIDTH 			= 660,
				MAINIMG_WIDE_WIDTH 		= 940,
				MAINIMG_HEIGHT 			= 240,
				MAINIMG_HEIGHT_INNER 	= 160,
				LOGO_WIDTH 				= 250,
				LOGO_HEIGHT 			= 80,
				/** 
				 * Page settings structure
				 */
				PageSettings = function(_p){
					var
						p = {
							/** @type {String} */
							uri		: undefined,
							/** @type {String} */
							title	: undefined
							};
					$.isPlainObject(_p) && $.extend(p, _p);
					return p;
					},
				/** @type {jQuery} */
				$mainContainer	= undefined,
				
				data = {
					page				: Editor.Page(), 
					parent_page			: Editor.Page(),
					/** @type {Editor.Page()[]} */
					crumbs				: []
					},
				
				settings = {
					blockClass				: 'block',
					blockGlobalIdBaseClass	: 'block-globalid-',
					bodyEditorClass			: 'mode-editor',
					bodyFooterDownClass		: 'footer-down',
					bodyBannersInlineClass	: 'banners-inline',
					bodyMainimgWideClass	: 'mainimg-wide',
					levelSetClass			: 'levels-set' 
					},
					
				/** @type {new BaseBlockHandler()[]} */	
				blockEngines = [],
				
				/** @type {GridLevelSet()[]} */	
				levelSetEngines = [],
				
				isInitialized = false,
				
				/* Body layout style flags */
				_isFooterDown = false,
				_isBannersInline = false,
				_isMainimgWide = false,
				
				initialize = function(){
					$mainContainer = $(document.body);
					_isFooterDown = $mainContainer.hasClass(settings.bodyFooterDownClass);
					_isBannersInline = $mainContainer.hasClass(settings.bodyBannersInlineClass);
					_isMainimgWide = $mainContainer.hasClass(settings.bodyMainimgWideClass);
					/* Searching and initializing blocks */
					$mainContainer.find('.' + settings.blockClass)
						.each(function(){
							obj.handleBlock($(this));
							});
					/* Searching and initializing levels */
					$mainContainer.find('.' + settings.levelSetClass)
						.each(function(){
							obj.handleLevelSet( this );
							});
							
					$(document.body).delegate('a:not(div.block-state-edit a)', 'click', function(/* Event */e){
						var
							/** @type {jQuery} */
							$target = $(e.target),
							href = $(this).attr('href'),
							url = parseUrl(href),
							baseHost = Editor.getDomain();
						if ($target.is('span.block-edit-btn, span.block-crop-btn')){
							return false;
							}
						if ( href && ( href.indexOf('/file/link/') + 1 ) ){
							window.open( href )
							return false;
							}
						if ( href && href.indexOf( 'mailto:' ) + 1 ){
							return true;
							}
						if (href && href.indexOf( 'javascript:' ) < 0 ){
							if (url.protocol && url.host && [ url.protocol, url.host ].join( '//' ) != baseHost ){
								/* 
								 * Link to page on other site
								 * Need to force open in new window
								 */
								window.open(href);
								}
							else{
								/* Link to page on this site */
								Editor.moveTo(href);
								Editor.Toolbar.hideAllDialogs();
								}
							}
						return false;
						});
					if ($.isPlainObject(window.pageSettings)){
						$.extend(true, data, window.pageSettings);
						}
					},
					
				/** 
				 * Sends any free event(s) to all listeners
				 */
				triggerEvent = function(event, eventData){
					$(document).triggerHandler(event, [eventData]);
					},
					
				/** 
				 * GridEditor public
				 */
				obj = {
					EVENT_CHANGE_PAGE_TITLE : 'change_page_title',
					execute : function(){
						if (!isInitialized){
							initialize();
							}
						},
					/** 
					 * @param {jQuery} Block container
					 * @param {Object} Block settings
					 * @return {new BaseBlockHandler()}
					 */
					handleBlock : function($block, handleBlockSettings){
						var
							$this = this,
							s = {
								/** @type {String} */
								type : undefined
								},
							/** @type {BaseBlockHandler} */
							Handler,
							/** @type {new BaseBlockHandler()} */
							engine;
						if (!$block || !$block.length){
							/* Cannot continue without correct block container */
							return false;
							}
						handleBlockSettings && $.extend(s, handleBlockSettings);
						if (!s.type){
							s.type = $block.searchInClass('block-type-');
							}
						s.globalId = blockEngines.length;
						$block.addClass( settings.blockGlobalIdBaseClass + s.globalId );
						Handler = HandlersRegistry.getAppropriate($block);
						engine = new Handler($block, s);
						if (engine.settings.id == 'main'){
							engine.bind(BLOCK_EVENT_SAVE, function(/* Event */e, eventData){
								if (data.page.title != eventData.title){
									data.page.title = eventData.title;
									triggerEvent($this.EVENT_CHANGE_PAGE_TITLE, data.page);
									}
								});
							}
						blockEngines.push(engine);
						return engine;
						},
					handleLevelSet : function( $levelSet , settings ){
						var
							/** @type {GridLevelSet()} */
							engine = GridLevelSet ( $levelSet , settings );
						levelSetEngines.push( engine );
						},
					/** 
					 * Binds any free event(s) to block
					 * Using jQuery's <code>bind</code> function syntax
					 */
					bind : function(){
						var $d = $(document);
						$d.bind.apply($d, arguments);
						},
					
					/** 
					 * Unbinds any free event(s) to block
					 * Using jQuery's <code>unbind</code> function syntax
					 */
					unbind : function(){
						var $d = $(document);
						$d.unbind.apply($d, arguments);
						},
						
					getPage : function(){
						return data.page;
						},
						
					getParentPage : function(){
						return data.crumbs.length
							? data.crumbs[ data.crumbs.length - 1 ]
							: { uri : '/'};
						},
						
					/** 
					 * @return {Array}
					 */
					getCrumbs : function(){
						return data.crumbs;
						},
						
					searchBlocks : function(query){
						var
							_query = {
								/** @type {String} */
								type : undefined,
								/** @type {Number} */
								id : undefined,
								/** 
								 * @type {DOMElement}
								 */
								container : undefined
								},
							/** @type {new BaseBlockHandler} */
							_engine,
							/** @type {new BaseBlockHandler[]} */
							res = [],
							targetedEngines = [].concat( blockEngines );
						query && $.extend(_query, query);
						
						if ( _query.container ){
							targetedEngines = [];
							$( '.' + settings.blockClass, _query.container ).each(function(){
								var
									globalId = $(this).searchInClass( settings.blockGlobalIdBaseClass );
								if ( globalId && blockEngines[ + globalId ] ){
									targetedEngines.push( blockEngines[ + globalId ] );
									}
								})
							}
						
						if (_query.type || _query.id){
							for (var i = 0, l = targetedEngines.length; i < l; i++) {
								_engine = targetedEngines[i];
								if (
									(_query.type && _engine._type == _query.type)
									|| (_query.id && _engine._globalId == _query.id)
									){
										res.push(_engine);
									}
								}
							targetedEngines = [].concat( res );
							}
						return targetedEngines;
						},
						
					applyCss : function( url ){
						SitePage.loadCss( url );
						},
					
					/** 
					 * @return {Boolean}
					 */
					isFooterDown : function(){
						return _isFooterDown;
						},
						
					toggleFooterDown : function(state){
						$(document.body).toggleClass(settings.bodyFooterDownClass, ! ! state);
						},
						
					isBannersInline : function(){
						return _isBannersInline;
						},
						
					getMainimgWidth : function(){
						return _isMainimgWide ? MAINIMG_WIDE_WIDTH : MAINIMG_WIDTH
						},
					getMainimgHeight : function(){
						return $(document.body).hasClass('inner')
							? MAINIMG_HEIGHT_INNER
							: MAINIMG_HEIGHT;
						},
					getMainimgBaseHeight : function(){
						return MAINIMG_HEIGHT;
						},
					getLogoWidth : function(){
						return LOGO_WIDTH
						},
					getLogoHeight : function(){
						return LOGO_HEIGHT;
						},
					BaseBlockHandler : BaseBlockHandler,
					HandlersRegistry : HandlersRegistry,
					ImageCropper : ImageCropper,
					storage : {}
					};
			return obj;
			})();
	
			
	window.GridEditor = GridEditor;
	/* Starting */		
	$(GridEditor.execute);
	
	
	})(jQuery);

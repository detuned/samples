(function( GridEditor ){

	/* Banners  */
	GridEditor.HandlersRegistry.register({type	: 'banners' }, {
		afterInitialize : function(){
			this.settings.titleFieldType 	= '';
			this.settings.textFieldType 	= '';
			this.settings.maxItemsNum 			= 3;
			this.settings.bannerWidth 		= 240;
			this.settings.bannerHeight 		= 60;
			this.settings.captionMaxLength	= 30;
			this.settings.captionPositions = {
				'0' 		: _( 'editor:block.banners.caption_pos_top' ),
				'1' 		: _( 'editor:block.banners.caption_pos_right' ),
				'2' 		: _( 'editor:block.banners.caption_pos_bottom' ),
				'3' 		: _( 'editor:block.banners.caption_pos_left' )
			};
			this.data.banners = [];
		},
		/** @type {jQuery} */
		$banners : undefined,
		/**
		 * Gets and returns only background images set by 'style' (this means its not default)
		 */
		_getImgSrc : function($banner){
			var m = String($banner.css('backgroundImage')).match(/url\(\"?([^\)\"]+)\"?\)/i);
			if (m && m[1]){
				return m[1];
			}
		},
		render_edit : function(){
			var
				$this = this,
				/** @type {jQuery} */
					$addLinkWrap,
				/** @type {Number} */
					maxUsedIndex = 0,
				actualizeBannersNum = function(){
					if ( $addLinkWrap ){
						$addLinkWrap.toggle( $this.$banners.find('>div.banner-edit-item').length < $this.settings.maxItemsNum );
					}
				},
				/**
				 * Switches menu item container to select mode
				 * @param {jQuery}
				 */
					toggleSelectMode = function($c){
					var
						/** @type {jQuery} */
							$selectWrap = $c.find('div.menu-edit-item-select'),
						/** @type {jQuery} */
							$selectList;
					$c.addClass('menu-edit-item-mode-select');
					if (!$selectWrap.length){
						$selectWrap = $([
							'<div class="menu-edit-item-select">',
							'<h4 class="menu-edit-item-select-title">' ,
							_( 'editor:action_select_page' ) ,
							':</h4>',
							'<div class="menu-edit-item-select-core">',
							'<ul class="menu-edit-list-item-select-list">',
							'</ul>',
							'</div>',
							'</div>'].join(''))
							.appendTo($c);
						$selectList = $selectWrap.find('ul')
							.delegate('div.menu-edit-item-select-list-item', 'click', function(){
								var
									title = $(this).find('strong').html() || '',
									url = $(this).find('em').html() || '',
									id = $(this).searchInClass('menu-edit-item-select-list-item-id-');
								$c.find('input.banner-edit-item-field-uri').val(url);
								toggleSelectMode($c);
							});
						$selectWrap.slideDown('fast');
						Editor.PagesController.load({
							withChildren : true,
							success : function(pages){
								var
									html = [],
									/** @type {Editor.Page()} */
										addPage = function(_page, level){
										!level && (level = 0);
										if (!_page.uri || _page.uri == '/'){
											_page.title = _( 'editor:index_page_title_full' );
										}
										html.push(
											'<li>' ,
											'<div class="menu-edit-item-select-list-item',
											' menu-edit-item-select-list-item-level-' , level,
											level >= 1
												? ' menu-edit-item-select-list-item-child'
												: '',
											'">',
											'<strong>', _page.title,'</strong>',
											'<em>' , _page.uri , '</em>',
											'</div>',
											'</li>');
										if (_page.items && _page.items.length){
											addPages(_page.items, level )
										}
									},
									addPages = function(_pages, level){
										for (var i = 0, l = _pages.length; i < l; i++) {
											addPage(_pages[i], level + 1)
										}
									}
								addPages(pages);
								$selectList.html(html.join(''));
							}
						});
					}
					else{
						$selectWrap.slideUp('fast', function(){
							$(this).remove();
							$c.removeClass('menu-edit-item-mode-select');
						});
					}
				},
				appendItem = function(item, index){
					var
						_item = (function(){
							var
								_p = {
									title 			: '',
									link			: '',
									picture_link	: '',
									title_pos		: '2'
								}
							item && $.extend(_p, item);
							return _p;
						})(),
						html = [
							'<div class="banner-edit-item',
							_item.picture_link
								? ''
								: ' banner-edit-item-default',
							'">',
							'<div class="banner-edit-item-img-wrap">',
							'<span class="dragger"></span>',
							'<span class="banner banner-' , index , '"',
							(_item.picture_uri || _item.picture_link
								? ' style="background-image:url(' + htmlspecialchars(_item.picture_uri || _item.picture_link) + ') !important"'
								: '')
							,'>',
							'<span class="banner-caption"><span class="banner-caption-core">' ,
							_item && _item.title
								? htmlspecialchars(_item.title)
								: '',
							'</span></span>',
							'</span>',
							'<span class="block-edit-btn">' ,
							_( 'editor:block_button.upload' ) ,
							'</span>',
							'<span class="block-crop-btn">',
							_( 'editor:block_button.crop' ),
							'</span>',
							'<span class="block-delete-btn block-delete-btn-pos-tl">' ,
							_( 'editor:block_button.delete' ),
							'</span>',
							'</div>',
							'<div class="banner-edit-item-field-wrap banner-edit-item-field-wrap-uri">',
							'<label>',
							'<span class="label">' ,
							_( 'editor:block.banners.uri' ) ,
							'</span>',
							'<input type="text" class="banner-edit-item-field-uri" name="link-' , index , '" value="' , htmlspecialchars(_item.link) , '"/>',
							'</label>',
							'<span class="menu-edit-item-select-button"></span>',
							'</div>',
							'<div class="banner-edit-item-field-wrap">',
							'<label>',
							'<span class="label">' ,
							_( 'editor:block.banners.title' ),
							'</span>',
							'<input type="text" class="banner-edit-item-field-title" name="title-' , index , '" maxlength="' , $this.settings.captionMaxLength , '" value="' , htmlspecialchars(_item.title) , '" />',
							'</label>',
							'</div>',
							'<div class="banner-edit-item-field-wrap banner-edit-item-field-wrap-textpos">',
							'<label>',
							'<select name="title_pos-' , index , '" class="banner-edit-item-field-titlepos" >',
							(function(){
								var
									res = [];
								$.each($this.settings.captionPositions, function(name){
									res.push(
										'<option value="' , name , '"' ,
										_item.title_pos == name
											? ' selected="selected"'
											: '' , '>' ,
										this.toString() ,
										'</option>'
									);
								});
								return res.join('');
							})(),
							'</select>',
							'</label>',
							'</div>',
							'</div>'],
						/** @type {jQuery} */
							$item = $(html.join('')).appendTo($this.$banners),
						$caption = $item.find('span.banner-caption'),
						$captionCore = $item.find('span.banner-caption-core'),
						$banner = $item.find('.banner'),
						actualizeCaption = function(){
							var caption = $captionField.val();
							if (caption){
								$captionCore.html(caption);
								$caption.show();
							}
							else{
								$captionCore.empty();
								$caption.hide();
							}
						},
						actualizeCaptionPosition = function(){
							var
								val = $captionPositionField.val();
							$.each($this.settings.captionPositions, function(name){
								$banner.toggleClass('banner-caption-pos-' + name, name == val);
							});
						},
						$captionField = $item.find('input.banner-edit-item-field-title')
							.bind('click keyup', actualizeCaption),
						$captionPositionField = $item.find('select.banner-edit-item-field-titlepos')
							.change(actualizeCaptionPosition),

						applyPic = function(src){
							if (src = trimStr(src)){
								$banner[0].setAttribute('style', ['background-image:url(' , src , '?fit=banner', ') !important'].join(''));
								if ( ! $this.data.banners[index - 1] ){
									$this.data.banners[index - 1] = {};
								}
								$this.data.banners[index - 1].picture_link = src;
								$item.removeClass('banner-edit-item-default');
							}
						},

						cropPic = function(src){
							$.request({
								url : '/file/get-crop',
								type : 'GET',
								data : {
									link : src
								},
								success : function(savedCrop){
									var
										cropData = $.extend({
											uri : src,
											aspectRatio : $this.settings.bannerWidth / $this.settings.bannerHeight,
											onsubmit : function(/* ImageCropper.Selection() */sel){
												$.request({
													url 	: '/file/set-crop',
													type 	: 'POST',
													data 	: {
														x 			: sel.x,
														y 			: sel.y,
														w 			: sel.w,
														h 			: sel.h,
														link		: src
													},
													success : function(cropRes){
														if (cropRes && cropRes.uri){
															applyPic(cropRes.uri)
														}
													}
												})
											}
										}, savedCrop || {}),
										/** @type {ImageCropper.Instance()} */
											cropper;
									/* Clearing dirty 'null' values that can overriden default params while extending */
									$.each(cropData, function(name){
										if (!cropData[name]){
											delete cropData[name];
										}
									});
									cropper = ImageCropper.Instance(cropData);
								}
							});
						};
					actualizeCaption();
					actualizeCaptionPosition();
					/* Allowing item drag */
					$item.allowDrag({
						useClone: 	true,
						dragger: 	'span.dragger',
						maxXDelta:	GridEditor.isBannersInline() ? undefined : 0,
						maxYDelta:	! GridEditor.isBannersInline() ? undefined : 0,
						onbegin: 	function(clone){
							var dragControl = $.data($item, '_dragControl');
							$item.addClass('projection');
							$(clone).addClass('banner-edit-item-dragging');
							if (dragControl){
								dragControl.setTrackAreas([
									$this.$banners
										.find('>div.banner-edit-item:visible:not(.projection)'),
									function(/* jQuery */$area, /* Boolean */state, targetOffset){
										if (state){
											if (targetOffset.topFactor >= 0.5){
												$area.after($item);
											}
											else{
												$area.before($item);
											}
										}
									}
								]);
							}
						},
						oncomplete: function(){
							$item.removeClass('projection');
						}
					});

					/* Allowing image cropping */
					$item.find('.block-crop-btn').click(function(){
						var
							src = $this.data.banners[index - 1].picture_link;
						cropPic(src);
					});
					$item.find('span.menu-edit-item-select-button').click(function(/* Event */e){
						toggleSelectMode($(this).closest('div.banner-edit-item-field-wrap'));
					})
					/* Allowing change image */
					$item.find('.block-edit-btn').click(function(){
						ImageManagerDialog({
							defaultCat : 3, //ImageManager.CAT_BANNERS
							allowCrop : true,
							onSelect : function(manageRes){
								if (manageRes.needResize){
									cropPic(manageRes.uri)
								}
								else{
									applyPic(manageRes.uri);
								}
							}
						})
					});
					/* Allowing delete image */
					$item.find('.block-delete-btn').click(function(){
						$item.slideUp('fast', function(){
							$(this).remove();
							actualizeBannersNum();
						});
					});
					maxUsedIndex = Math.max(index, maxUsedIndex);
					return $item;
				}
			this._superMethod('render_edit');
			this.$text.empty();
			this.$banners = $('<div class="banner-edit-items"></div>').appendTo(this.$text);

			if ( this.data.banners && this.data.banners.length ){
				for (var i = 0, l = this.data.banners.length; i < l; i++) {
					appendItem(this.data.banners[i], i + 1);
				}
			}
			$addLinkWrap = $([
				'<div class="banner-edit-add-item-wrap">',
				'<span class="link-add-item">' ,
				_( 'editor:block.banners.add_banner' ) ,
				'</span>',
				'</div>'].join(''))
				.find('>span').click(function(){
					appendItem({}, maxUsedIndex + 1);
					actualizeBannersNum();
				})
				.end()
				.appendTo($this.$text);
			actualizeBannersNum();
		},
		render_view: function(){
			var
				html = [],
				_banner = {
					uri 			: undefined,
					title 			: undefined,
					title_pos 		: undefined,
					picture_link	: undefined,
					picture_uri		: undefined
				};


			this._superMethod('render_view');

			if ( this.data.banners && this.data.banners.length ){
				for (var i = 0, l = this.data.banners.length; i < l; i++) {
					if (_banner = this.data.banners[i]){
						html.push(['<a href="' , _banner.link || '/' , '" class="banner banner-' , i + 1 ,
							' banner-caption-pos-', _banner.title_pos || '2',
							'"' ,
							_banner.picture_link || _banner.picture_uri
								? ' style="background-image:url(' + htmlspecialchars(_banner.picture_uri || _banner.picture_link) + ') !important"'
								: '',
							'>' ,
							_banner.title
								? '<span class="banner-caption"><span class="banner-caption-core">' + _banner.title + '</span></span>'
								: '',
							'</a>'].join(''))
					}
					else{
						html.push(['<span class="banner banner-' , i + 1 , '">&nbsp;</span>'].join(''))
					}
				}
			}
			this.$text.html(html.join(''))
		},
		normalizeUrl : function(url){
			url = trimStr( url , ' ' ).replace( /^\/+/g, '' );
			if( ! isClickableUrl(url)){
				url = '/' + url;
			}
			return url;
		},
		processFormData : function(fields){
			var
				$this = this,
				banners = [],
				_p = [],
				_url;
			$.isPlainObject(fields) && $.each(fields, function(/* String */name){
				var ind;
				_p = name.split('-');
				if (_p[0] == 'title' && (('link-' + _p[1]) in fields)){
					ind = Number( _p[1] );
					_url = $this.normalizeUrl(fields['link-' + ind]);
					banners.push({
						title 			: this.toString(),
						link			: _url,
						title_pos		: fields['title_pos-' + ind],
						picture_link	: $this.data.banners[ ind - 1 ]
							? $this.data.banners[ ind - 1 ].picture_link
							: ''
					});
				}
			});
			return {banners : banners};
		},
		isDataEqual : function(data){
			var res = true;
			if (data.banners && data.banners.length && this.data.banners.length == data.banners.length){
				for (var i = 0, l = data.banners.length; i < l; i++) {
					if (
						data.banners[i].title 				!= this.data.banners[i].title
							|| data.banners[i].link 			!= this.data.banners[i].link
							|| data.banners[i].title_pos 		!= this.data.banners[i].title_pos
							|| data.banners[i].picture_link 	!= this.data.banners[i].picture_link
							|| data.banners[i].picture_uri	 	!= this.data.banners[i].picture_uri
						){
						res = false;
						break;
					}
				}
			}
			else{
				res = false;
			}
			return res;
		}
	});


})( this.GridEditor );
(function( GridEditor ){
	var menuPrototype = {
		/** @type {jQuery} */
		$menuList 		: undefined,
		/** @type {jQuery} */
		$menuEdit 	: undefined,
		afterInitialize : function(){
			var $this = this;
			this.data.menu = [];
			this.settings.titleFieldType = '';
			this.settings.textFieldType = '';
			this.settings.loadUrl = '/menu/get/';
			this.settings.saveUrl = '/menu/set/';
			this.$menuList = this.$text.find('>ul.menu');
		},

		_removeClones : false,

		normalizeUrl : function(url){
			url = trimStr(url, ' /')
			if( ! isClickableUrl(url)){
				url = '/' + url;
			}
			return url;
		},

		onSubmitWithNoChanges : function(){
			if (this._removeClones){
				Editor.InfoMessage.show({
					html 	: _( 'editor:block.menu.duplicate_pages_note' ),
					time	: true,
					clear	: true
				});
			}
		},

		getSuccessSaveMessage : function(){
			return [
				_( 'editor:block.menu.save_success' ),
				(
					this._removeClones
						? _( 'editor:block.menu.duplicate_pages_note.light' )
						: ''
					),
				'<a class="action action-undo">' , _( 'editor:action_cancel' ) , '</a>'
			].join('')
		},

		processFormData : function(fields){
			var
				$this = this,
				menu = [],
				_p = [],
				_url,
				urls = {},
				_selectedMenuItem,
				_menuItem;
			this._removeClones = false;
			$.isPlainObject(fields) && $.each(fields, function(/* String */name){
				_p = name.split('-');
				if (_p[0] == 'title' && (('url-' + _p[1]) in fields)){
					_url = $this.normalizeUrl(fields['url-' + _p[1]]);
					if (urls[_url]){
						/* Skip clones */
						$this._removeClones = true;
						return;
					}
					_menuItem = {
						title 	: this.toString(),
						url		: _url
					}
					if ( ( _selectedMenuItem = $this.$menuEdit.find('div.menu-edit-item-num-' + _p[1]).data('_selectedMenuItem') )
						&& _selectedMenuItem.url == trimStr(_menuItem.url)
						&& _selectedMenuItem.entity_id
						){
						_menuItem.entity_id = _selectedMenuItem.entity_id;
					}
					menu.push(_menuItem);
					urls[_url] = true;
				}
			})
			return {menu : menu};
		},
		processLoadedData : function(res){
			this.setCheckpoint();
			return res;
		},
		isDataEqual : function(data){
			var res = true;
			if (data.menu && data.menu.length && this.data.menu.length == data.menu.length){
				for (var i = 0, l = data.menu.length; i < l; i++) {
					if (
						data.menu[i].title != this.data.menu[i].title
							|| data.menu[i].url != this.data.menu[i].url
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
		},
		render_edit : function(){
			var
				$this 		= this,
				fieldNum 	= 0,
				/** @type {jQuery} */
					$list		= undefined,
				appendItem	= function(_item){
					var
						/** @type {jQuery} */
							$item;
					fieldNum ++ ;
					if (!_item){
						_item  = {
							title	: '',
							url		: ''
						}
					}
					$item = $([
						'<div class="',
						'menu-edit-item menu-edit-item-num-' , fieldNum ,
						' menu-edit-item-type-' , $this._type ,
						'">',
						'<span class="dragger"></span>',
						'<input type="text" name="title-' , fieldNum , '" placeholder="' ,
						_( 'editor:block.menu.page_title.placeholder' ) ,
						'" value="' , htmlspecialchars(_item.title || '') , '" class="menu-edit-field-title field-required" />',
						'<input type="text" name="url-' , fieldNum , '" placeholder="' ,
						_( 'editor:block.menu.page_url.placeholder' ) ,
						'"  value="' , htmlspecialchars(_item.url || '') , '" class="menu-edit-field-url field-required" />',
						'<span class="menu-edit-item-select-button" title="' ,
						_( 'editor:block.menu.select_existsing_page' ) ,
						'"></span>',
						'<span class="menu-edit-item-delete" title="' ,
						_( 'editor:block.menu.delete_item' ) ,
						'"></span>',
						'</div>'
					].join(''))
						.appendTo($list);
					if ( ! ! _item.entity_id ){
						$item.data( '_selectedMenuItem', $.extend( {} , _item ) );
					}
					$item.allowDrag({
						useClone: 	true,
						dragger: 	'span.dragger',
						maxXDelta:	0,
						onbegin: 	function(clone){
							var dragControl = $.data($item, '_dragControl');
							$item.addClass('projection');
							$(clone).addClass('menu-edit-item-dragging');
							if (dragControl){
								dragControl.setTrackAreas([
									$list
										.find('>div.menu-edit-item:visible:not(.projection)'),
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
					return $item;
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
								$c.find('input.menu-edit-field-title').val(title);
								$c.find('input.menu-edit-field-url').val(url);
								$c.data('_selectedMenuItem', {
									url 		: url,
									title		: title,
									entity_id	: id
								})
								toggleSelectMode($c);
							});
						$selectWrap.slideDown('fast');
						Editor.PagesController.load({
							withChildren : true,
							force : true,
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
											' menu-edit-item-select-list-item-id-', _page.id,
											level >= 1
												? ' menu-edit-item-select-list-item-child'
												: '',
											'">',
											'<strong>', _page.title, '</strong>',
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
				actualize 	= function(){
					$this.$menuEdit.toggleClass(
						'menu-edit-single-item',
						$list.find('div.menu-edit-item').length <= 1
					)
				};
			this._superMethod('render_edit');
			this.$menuList.hide();
			if (!this.$menuEdit || !this.$menuEdit.length){
				this.$menuEdit = $('<div class="menu-edit" />')
					.html([
						'<h3 class="menu-edit-title">',
						_( 'editor:block.menu.setup_title' ),
						'</h3>',
						'<div class="menu-edit-items">',
						'</div>',
						'<div class="menu-edit-add-item-wrap">',
						'<span class="link-add-item">',
						_( 'editor:block.menu.add_item' ),
						'</span>',
						'</div>'
					].join(''))
					.appendTo(this.$content)
					.delegate('span.menu-edit-item-delete', 'click', function(/* Event */e){
						var
							$c = $(e.target).closest('div.menu-edit-item');
						$c.slideUp('fast', function(){
							$c.remove();
							actualize();
						});
					})
					.delegate('span.menu-edit-item-select-button', 'click', function(/* Event */e){
						toggleSelectMode($(e.target).closest('div.menu-edit-item'));

					})
					.delegate('span.link-add-item', 'click', function(/* Event */e){
						var
							$c = appendItem({
								title 	:	_( 'editor:block.menu.new_page_title' ),
								url		:	'/page'
							})
								.hide()
								.slideDown('fast', function(){
									actualize();
									$c.find('input[type=text]').eq(0).select()
									$list.scrollTop(1000)
								});
					})
			}
			$list = this.$menuEdit.find('>div.menu-edit-items').empty();
			for (var i = 0, l = this.data.menu.length; i < l; i++) {
				appendItem(this.data.menu[i]);
			}
			$list
				.find('input[type=text]').eq(0).select();
			actualize();
		},

		render_view : function(){
			var $this = this;
			this._superMethod('render_view');
			if (this.$menuEdit){
				this.$menuEdit.remove();
				this.$menuEdit = undefined;
			}
			if (this.data.html){
				var v = this.data.html.toString().match(/<ul\s+class="menu(?:\s[^\"]+)?">([\s\S]+)<\/ul>/i);
				this.$menuList.html(
					v && v[1]
						? trimStr(v[1])
						: this.data.html
				);
				delete this.data.heml;
			}
			this.$menuList
				.show();
		}
	}
	GridEditor.HandlersRegistry.register({type	: 'menu' }, menuPrototype);

})( this.GridEditor );
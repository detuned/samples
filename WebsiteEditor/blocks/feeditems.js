(function( GridEditor ){
	/* Feeditems block (on feed title page) */
	GridEditor.HandlersRegistry.register( {type : 'feeditems' }, {
		/** @type {jQuery} */
		$addItemArea        : undefined,
		/** @type {jQuery} */
		$addItemBtn         : undefined,
		/** @type {jQuery} */
		$feedControlsWrap   : undefined,
		afterInitialize     : function(){
			var
				$this = this;
			this.setState( 'editable', false );
			this.$feedControlsWrap = $( '<div class="feed-items-controls cleared"/>' )
				.prependTo( this.$block );
			this.$addItemArea = $( '<div class="feed-items-add-item"/>' )
				.appendTo( this.$feedControlsWrap );
			this.$addItemBtn = $( [
				'<span class="feed-items-add-item-btn">' ,
				_( 'editor:block.feed.add_item' ),
				'<span class="feed-items-add-item-btn-r"></span></span>'
			].join( '' ) )
				.click( function( /* Event */e ){
					e.preventDefault();
					$this.addItem();
				} )
				.appendTo( this.$addItemArea );
			/* this.$block.find('>div.feed-item').each(function(){
			 $this.handleFeedItemBlock($(this));
			 }); */
			/* ..so force clean content of all items */
			this.cleanUpContent( this.$block );
		},
		handleFeedItemBlock : function( $item ){
			var
				$this = this,
				engine;
			$item.addClass( 'block block-type-feeditem' );
			$item
				.find( '.feed-item-title' ).addClass( 'block-title' ).end()
				.find( '.feed-item-content' ).addClass( 'block-content' ).end()
				.find( '.feed-item-text' ).addClass( 'block-text' );
			engine = GridEditor.handleBlock( $item, {
				settings : {
					id         : $this.settings.id,
					feedItemId : $item.searchInClass( 'feed-item-id-' )
				}
			} );
			engine.feedItems = this;
			return engine;
		},
		addItem             : function(){
			var
				$this = this,
				data = this.getSaveRequestData();
			data.data = $.toJSON( {
				title      : _( 'editor:block.feed.new_item.title' ),
				text       : '',
				autocreate : 1
			} );
			if( $this.$addItemArea.hasClass( 'feed-items-add-item-busy' ) ){
				/* Have started adding another item already */
				return;
			}
			this.$addItemArea.addClass( 'feed-items-add-item-busy' );
			$.request( {
				url      : $this.settings.saveUrl,
				data     : data,
				dataType : 'json',
				type     : 'POST',
				success  : function( res ){
					if( ! res || ! res.id ){
						$this.displayErrorMessage();
						return;
					}
					if( res && res.uri ){
						Editor.moveTo( res.uri );
						return;
					}
					var
						$item = $( [
							'<div class="feed-item feed-item-id-' , res.id , '">',
							'<h3 class="feed-item-title">',
							'<a href="/' , Editor.getPageUri() , '/' , htmlspecialchars( res.id ) , '">',
							res.title || '',
							'</a>',
							'</h3>',
							'<div class="feed-item-content">',
							'<div class="feed-item-text">',
							res.body || '',
							'</div>',
							'</div>',
							'</div>'
						].join( '' ) )
							.insertAfter( $this.$feedControlsWrap ),
						engine = $this.handleFeedItemBlock( $item );
					engine.toggleEditMode( true );
				},
				complete : function(){
					$this.$addItemArea.removeClass( 'feed-items-add-item-busy' );
				}
			} );
		}
	} );
	(function(){
		var
			feedItemPrototype = {
				/** @type {jQuery} */
				$description          : undefined,
				/** @type {jQuery} */
				$descriptionFieldWrap : undefined,
				/** @type {jQuery} */
				$descriptionField     : undefined,
				/** @type {jQuery} */
				$picture              : undefined,

				/** @type {new AjaxUpload()} */
				pictureUploader             : undefined,
				/** @type {jQuery} */
				$descriptionToggleFieldLink : undefined,
				/** @type {jQuery} */
				$deleteBtn                  : undefined,
				/** @type {new BaseBlockHandler()} */
				feedItems                   : undefined,
				_imagesCatalog              : 1, //ImageManager.CAT_FEEDS
				afterInitialize             : function(){
					var $this = this;
					$.extend( this.settings, {
						descriptionFieldType            : 'textarea',
						descriptionFieldUseWysiwyg      : false,
						descriptionFieldWysiwygSettings : {},
						titleFieldRequired              : true,
						pictureAspectRatio              : 268 / 182
					} );
					this.$deleteBtn = $( [
						'<span class="block-delete-btn">' ,
						_( 'editor:action_delete' ),
						'</span>'
					].join( '' ) )
						.click( function(){
							$this.deleteBlock();
						} )
						.appendTo( this.$block );
				},
				_getParentId                : function(){
					return this.hasState( 'standalone' )
						? GridEditor.getParentPage().id
						: this.feedItems
						? this.feedItems.settings.catalogId
						: undefined;
				},
				isDataEqual                 : function( data ){
					return ! ! (
						this._superMethod( 'isDataEqual', data )
							&& ( data.description == this.data.description || ( ! data.description && ! this.data.description ) )
							&& ( ( typeof data.parent_id == 'undefined' ) || + data.parent_id == + this._getParentId() )
							&& ( ( typeof this.data.ordering == 'undefined' ) || Number( this.hasState( 'hot' ) ) == + this.data.ordering )
						);
				},
				onSave                      : function( res ){
					var
						$this = this,
						parentId = this._getParentId();
					if(
						res
							&& ! isNaN( + res.parent_id )
							&& ! isNaN( + parentId )
							&& + res.parent_id != + parentId
						){
						/*  */
						if( $this.hasState( 'standalone' ) ){
							Editor.moveTo( GridEditor.getParentPage() );
						}
						else {
							$this.$block.slideUp( 500, function(){
								$( this ).remove();
							} );
						}
					}
				},
				getSuccessSaveMessage       : function( res ){
					var
						parentId = this._getParentId();
					if( res
						&& ! isNaN( + res.parent_id )
						&& ! isNaN( + parentId )
						&& + res.parent_id != + parentId ){
						/* Block was moved */
						return _( 'editor:block_was_replaced',
							this.data.title
								? '&laquo;' + this.data.title + '&raquo;'
								: ''
						);
					}
					else {
						return this._superMethod( 'getSuccessSaveMessage', res );
					}

				},
				render_view                 : function(){
					this._superMethod( 'render_view' );
					if( this.$descriptionFieldWrap ){
						this.$descriptionFieldWrap.remove();
						this.$descriptionFieldWrap = undefined;
						this.$description.remove();
						this.$description = undefined;
						this.$descriptionToggleFieldLink.remove();
						this.$descriptionToggleFieldLink = undefined;
					}
					! this.hasState( 'standalone' )
					&& this.$text.html( this.data.announce && this.data.announce !== null
						? String( this.data.announce ).cutText( 200 )
						: '' );

					this.setState( 'has-picture', ! ! this.data.picture );
					//			this.$picture.unbind('click');
					this.pictureUploader
					&& this.pictureUploader.disable();
					this._updatePictureHtml();
					this._cleanUpView();
				},
				_updatePictureHtml          : function(){
					if( this.$picture ){
						this.$picture.html( [
							this.hasState( 'edit' )
								? [ '<span class="block-edit-btn">' ,
								_( 'editor:block_button.upload' ) ,
								'</span>' ].join( '' )
								: '',
							this.data.picture
								? [
								this.hasState( 'edit' )
									? [
									'<span class="block-crop-btn">' ,
									_( 'editor:block_button.crop' ) ,
									'</span>',
									'<span class="block-delete-btn block-delete-btn-pos-tr3">' ,
									_( 'editor:block_button.delete' ),
									'</span>'
								].join( '' )
									: '',
								this.data.picture
									? [ '<img src="' , this.data.picture , '" alt="" />' ].join( '' )
									: ''
							].join( '' )
								: ''].join( '' ) );
					}
				},
				render_edit                 : function(){
					var $this = this;
					this.$text.removeClass( 'hidden' );


					/* Creating container for picture if it not exists yet */
					if( ! this.$picture || ! this.$picture.length ){
						if( ! (this.$picture = this.$content.find( 'div.block-picture' )) || ! this.$picture.length ){
							this.$picture = $( [
								'<div class="block-picture block-type-', this._type, '-picture" />'].join( '' ) )
								.prependTo( this.$content );
						}


						/* Binding click events to edit & crop buttons */
						(function(){

							var
								/**
								 * Saves new picture's uri everywhere:
								 * - at server,
								 * - in block data
								 * - and updates in its container
								 */
									savePic = function( uri ){
									var
										reqData = {
											link : uri
										};
									if( $this.settings.feedItemId ){
										reqData.id = $this.settings.feedItemId;
									}
									else {
										reqData.location = Editor.getPageUri();
									}
									if( ! reqData.link ){
										reqData.link = 'none';
									}
									/* Saving new picture at server */
									$.request( {
										url     : '/file/set-entity-picture',
										type    : 'POST',
										data    : reqData,
										success : function( reqRes ){
											if( reqRes ){
												/* Saving picture in block data */
												$this.data.picture = reqRes.uri;
												/* Updating picture view in container */
												$this._updatePictureHtml();
											}
										}
									} );
								}

							$this.$picture.undelegate( 'click' )
								.delegate( 'span.block-edit-btn', 'click', function(){
									ImageManagerDialog( {
										allowCrop  : true,
										defaultCat : $this._imagesCatalog,
										onSelect   : function( manageRes ){
											if( manageRes.needResize ){
												/* What? We have to crop picture before save? Well that is it */
												ImageCropper.Instance( {
													uri         : manageRes.uri,
													aspectRatio : $this.settings.pictureAspectRatio,
													w           : 268,
													h           : 182,
													onsubmit    : function( sel ){
														$.request( {
															url     : '/file/set-crop',
															type    : 'POST',
															data    : {
																// XXX Strictly filter only needed params to send
																x    : sel.x,
																y    : sel.y,
																w    : sel.w,
																h    : sel.h,
																link : manageRes.uri
															},
															success : function( cropSaveRes ){
																if( cropSaveRes && cropSaveRes.uri ){
																	savePic( cropSaveRes.uri );
																}
															}

														} );
													}
												} )
											}
											else {
												/* Set selected pisture to feeditem as is */
												savePic( manageRes.uri );
											}
										}
									} )
								} )
								.delegate( 'span.block-crop-btn', 'click', function(){
									var
										reqData = {
											location : Editor.getPageUri()
										};
									$this.settings.feedItemId
									&& (reqData.id = $this.settings.feedItemId);
									$.request( {
										url     : '/file/get-entity-crop',
										type    : 'GET',
										data    : reqData,
										success : function( savedCrop ){
											var
												cropData = $.extend( {
													uri         : $this.data.picture,
													aspectRatio : $this.settings.pictureAspectRatio,
													onsubmit    : function( /* ImageCropper.Selection() */sel ){
														$.request( {
															url     : '/file/set-entity-crop',
															type    : 'POST',
															data    : {
																x        : sel.x,
																y        : sel.y,
																w        : sel.w,
																h        : sel.h,
																location : Editor.getPageUri(),
																id       : $this.settings.feedItemId
															},
															success : function( cropRes ){
																if( cropRes && cropRes.uri ){
																	/* Saving picture in block data */
																	$this.data.picture = cropRes.uri;
																	/* Updating picture view in container */
																	$this._updatePictureHtml();
																}
															}
														} )
													}
												}, savedCrop || {} ),
												/** @type {ImageCropper.Instance()} */
													cropper;
											/* Clearing dirty 'null' values that can overriden default params while extending */
											$.each( cropData, function( name ){
												if( ! cropData[name] ){
													delete cropData[name];
												}
											} );
											cropper = ImageCropper.Instance( cropData );
										}
									} )

								} )
								.delegate( 'span.block-delete-btn', 'click', function(){
									savePic();
								} );
						})();
					}

					this._updatePictureHtml();
					/* Forcing show picture container in edit mode */
					this.setState( 'has-picture', true );

					this._superMethod( 'render_edit' );

					/* Creating container for description if it not exists yet */
					if(
						(! this.$description || ! this.$description.length)
							&& (! (this.$description = this.$content.find( 'div.block-description' )) || ! this.$description.length )
						){
						this.$description = $( [
							'<div class="block-description block-type-', this._type, '-description"/>'].join( '' ) )
							.insertBefore( this.$text );
					}

					/* Creating field wrapper for description if it not exists yet  */
					if( ! this.$descriptionFieldWrap || ! this.$descriptionFieldWrap.length ){
						this.$descriptionFieldWrap = this.$description.wrapInner( '<div class="block-description-field-wrap toggle-field-wrap"/>' ).find( '>div:first' );
					}
					/* Creating toggler for description field wrap if it not exists yet  */
					if( ! this.$descriptionToggleFieldLink || ! this.$descriptionToggleFieldLink.length ){
						this.$descriptionToggleFieldLink = $( [
							'<div class="toggle-field-link-wrap block-description-toggle-wrap">',
							'<span class="link pseudo-link toggle-field-link">' ,
							_( 'editor:block.feed.announce' ),
							'</span>',
							'</div>'
						].join( '' ) )
							.insertBefore( this.$descriptionFieldWrap )
							.find( 'span.toggle-field-link' )
							.click( function(){
								$this.$description.toggleClass( 'toggle-field-open' );
								$this.$descriptionField.css( 'width', $this.$descriptionFieldWrap.width() || '100%' );
							} );
					}

					/* Forcing show description container in edit mode */
					this.$description
						.removeClass( 'hidden' )
						.toggleClass( 'toggle-field-open', ! ! this.data.description );

					/* Transforming description static container to dynamic field */
					if( this.settings.descriptionFieldType ){
						this.$descriptionField = editField( this.$descriptionFieldWrap, {
							name            : 'description',
							type            : $this.settings.descriptionFieldType,
							content         : $this.data.description,
							minHeight       : 50,
							useWysiwyg      : $this.settings.descriptionFieldUseWysiwyg,
							wysiwygSettings : $this.settings.descriptionFieldWysiwygSettings
						} );
					}
					$this._renderSpecialFields();
				},
				_renderSpecialFields        : function(){},
				_cleanUpView                : function(){},
				getLoadRequestData          : function(){
					var
						$this = this,
						data = this._superMethod( 'getLoadRequestData' );
					data.data = $.toJSON(
						$this.settings.feedItemId
							? { id : $this.settings.feedItemId }
							: {}
					);
					return data;
				},
				processSaveRequestData      : function( data ){
					var
						$this = this,
						data = this._superMethod( 'processSaveRequestData', data );
					if( this.settings.feedItemId ){
						data.id = this.settings.feedItemId;
					}
					data.description = data.description
						? trimStr( data.description )
						: '';
					data.ordering = this.hasState( 'hot' )
						? 1
						: 0;
					return data;
				},
				deleteBlock                 : function( _params ){
					var
						$this = this,
						params = (function(){
							var
								_p = {
									newCheckpoint : true,
									updateData    : true,
									url           : $this.settings.saveUrl,
									data          : {
										block_id : $this.settings.id,
										location : Editor.getPageUri(),
										data     : undefined
									},
									success       : function( res ){}
								};
							_params && $.extend( true, _p, _params );
							if( ! _p.data.data ){
								_p.data.data = $.extend( {}, $this.data );
							}
							return _p;
						})();
					if( this.settings.feedItemId ){
						params.data.data.id = this.settings.feedItemId;
					}
					params.data.data.action = 'delete';
					params.data.data = $.toJSON( params.data.data );
					$.request( {
						url      : params.url,
						data     : params.data,
						dataType : 'json',
						type     : 'POST',
						success  : function( res ){
							var
								showMessage = function(){
									Editor.InfoMessage.show( {
										html    : _( 'editor:block_was_removed',
											$this.data.title
												? '&laquo;' + $this.data.title + '&raquo;'
												: ''
										),
										time    : true,
										clear   : true,
										actions : {
											undo : function( /* Editor.InfoMessage */im ){
												im.hide( {
													clear : true
												} );
												return false;
											}
										}
									} );
								}
							if( $this.hasState( 'standalone' ) ){
								Editor.moveTo( GridEditor.getParentPage() );
							}
							else {
								$this.$block.slideUp( 500, function(){
									$( this ).remove();
								} );
							}
							showMessage();
							params.success( res );
						}
					} );
				}
			},
			feedPrototypeExt = {
				_renderMovetoField  : function(){
					var
						$this = this,
						parentId = this._getParentId(),
						currentItemId = $this.hasState( 'standalone' )
							? GridEditor.getPage().id
							: $this.settings.feedItemId;

					this.$movetoWrap = this.$content.find( '.block-moveto' );
					/* Creating container for move-to if it not exists yet */
					if( ! this.$movetoWrap.length ){
						this.$movetoWrap = $( [
							'<div class="block-moveto">' ,
							'<span class="pseudo-link link-action-moveto">' ,
							_( 'editor:block_button.replace' ),
							'</span>',
							'</div>'].join( '' ) )
							.undelegate( 'span.link-action-moveto', 'click' )
							.delegate( 'span.link-action-moveto', 'click', function(){
								var
									/** @type {Array} */
										crumbs = GridEditor.getCrumbs(),
									catRootId = ( ! crumbs || ! crumbs[0] || ! crumbs[0].id )
										? parentId
										: crumbs[0].id;

								Editor.PagesController.load( {
									withChildren : true,
									branchId     : catRootId,
									force        : true,
									success      : function( pages ){
										var
											html = [],
											/** @type {Editor.Page()} */
												addPage = function( _page, level, isDisable ){
												var
													isActive = _page.id == parentId,
													isCurrent = _page.id == currentItemId,
													isInRoot = _page.id == catRootId,
													isFolder = + _page.type == CATALOG_TYPE_FOLDER
														|| + _page.type == CATALOG_TYPE_ROOT;
												! level && (level = 0);
												if( ! isFolder ){
													return;
												}
												html.push(
													'<option value="', _page.id, '"',
													isActive
														? ' selected="selected" class="active"'
														: '',
													isDisable || isCurrent || ! isFolder
														? ' disabled="disabled"'
														: '',
													'>',
													str_repeat( '–', level ),
													level ? '&nbsp;' : '',
													_page.title,
													'</option>'
												);
												if( _page.items && _page.items.length ){
													addPages( _page.items, level, isDisable || ( isCurrent && ! isInRoot ) );
												}
											},
											addPages = function( _pages, level, isDisable ){
												for( var i = 0, l = _pages.length; i < l; i ++ ){
													addPage( _pages[i], level + 1, isDisable )
												}
											}
										addPages( pages );
										$this.$movetoWrap.html( [
											'<label for="block-moveto-' , $this._globalId , '">',
											_( 'editor:block.catalogitem.move_to' ),
											'</label>&nbsp;',
											'<select name="parent_id" id="block-moveto-field-' , $this._globalId , '">',
											html.join( '' ),
											'</select>'
										].join( '' ) );
									}
								} );
							} )
							.appendTo( this.$content );
					}
				},
				_cleanUpMovetoField : function(){
					if( this.$movetoWrap ){
						this.$movetoWrap.remove();
						this.$movetoWrap = undefined;
					}
				},
				_renderHotField     : function(){
					var $this = this;
					this.$hotWrap = this.$content.find( '.block-hot' );
					if( ! this.$hotWrap.length ){
						this.$hotWrap = $( [
							'<div class="block-hot">' ,
							'<span class="pseudo-link link-action-hot">',
							'<span class="block-hot-bullet-caption-off">' ,
							_( 'editor:block.catalogitem.hot_on' ),
							'</span>',
							'<span class="block-hot-bullet-caption-on">' ,
							_( 'editor:block.catalogitem.hot_off' ),
							'</span>',
							'<span class="block-hot-bullet"></span>',
							'</span>',
							'</div>'].join( '' ) )
							.undelegate( 'span.link-action-hot', 'click' )
							.delegate( 'span.link-action-hot', 'click', function(){
								$this.toggleState( 'hot' );
							} )
							.appendTo( this.$content );
					}
				},
				_cleanUpHotField    : function(){
					if( this.$hotWrap ){
						this.$hotWrap.remove();
						this.$hotWrap = undefined;
					}
				}
			}
		/* Feed Item block (one of feed items on feed title page) */
		HandlersRegistry.register( {type : 'feeditem' }, feedItemPrototype );

		/* Catalog Item block  */
		HandlersRegistry.register( {type : 'catalogitem' }, $.extend( {}, feedItemPrototype, {
			/** @type {jQuery} */
			$priceEditWrap       : undefined,
			/** @type {jQuery} */
			$priceWrap           : undefined,
			_imagesCatalog       : 5,//ImageManager.CAT_CATALOG,
			_renderSpecialFields : function(){
				var $this = this;
				this.$priceEditWrap = this.$content.find( '.block-price-edit' );
				/* Creating container for price if it not exists yet */
				if( ! this.$priceEditWrap.length ){
					this.$priceEditWrap = $( [
						'<div class="block-price-edit">' ,
						'<label for="block-price-field-' , $this._globalId , '">',
						_( 'editor:block.catalogitem.price' ),
						'</label>',
						'<input type="text" name="attrs--price" id="block-price-field-' , $this._globalId , '" value="' ,
						$this.data.attrs && $this.data.attrs.price ? $this.data.attrs.price : '' ,
						'"  maxlength="50"/>',
						'</div>'].join( '' ) )
						.appendTo( this.$content );
				}
				this.$content.find( '.block-price' ).addClass( 'hidden' );
				feedPrototypeExt._renderHotField.apply( this );
				feedPrototypeExt._renderMovetoField.apply( this );
			},
			_cleanUpView         : function(){
				if( this.$priceEditWrap ){
					this.$priceEditWrap.remove();
					this.$priceEditWrap = undefined;
				}
				this.$priceWrap = this.$content.find( '.block-price' );
				/* Creating container for price if it not exists yet */
				if( this.data.attrs && this.data.attrs.price ){
					if( ! this.$priceWrap.length ){
						this.$priceWrap = $( [
							'<div class="block-price"></div>'].join( '' ) )
							.appendTo( this.$content );
					}
					this.$priceWrap
						.html( [ _( 'editor:block.catalogitem.price' ) , this.data.attrs.price ].join( ' ' ) )
						.removeClass( 'hidden' );
				}
				else {
					this.$priceWrap.addClass( 'hidden' );
				}
				feedPrototypeExt._cleanUpHotField.apply( this );
				feedPrototypeExt._cleanUpMovetoField.apply( this );
			},
			isDataEqual          : function( data ){
				return ! ! (data.body == this.data.body
					&& data.title == this.data.title
					&& (
					( this.data.attrs && data.attrs && data.attrs.price !== this.data.attrs.price )
						||
						( ! this.data.attrs && ! data.attrs )
					)
					);
			}

		} ) );

		HandlersRegistry.register( {type : 'catalogfolder' }, $.extend( {}, feedItemPrototype, {
			_imagesCatalog       : 5,//ImageManager.CAT_CATALOG,
			_renderSpecialFields : function(){
				feedPrototypeExt._renderHotField.apply( this );
				feedPrototypeExt._renderMovetoField.apply( this );
			},
			_cleanUpView         : function(){
				feedPrototypeExt._cleanUpHotField.apply( this );
				feedPrototypeExt._cleanUpMovetoField.apply( this );
			}
		} ) );
	})();
})( this.GridEditor );
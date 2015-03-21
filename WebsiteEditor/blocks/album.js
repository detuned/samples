(function( GridEditor ){
	/* Album Block  */
	GridEditor.HandlersRegistry.register({type : 'album' }, {
		/** @type {jQuery} */
		$addItemArea : undefined,
		/** @type {jQuery} */
		$addItemBtn : undefined,
		/** @type {jQuery} */
		$galleryControlsWrap : undefined,
		/** @type {jQuery} */
		$galleryCollection : undefined,
		/** @type {new PicViewer.BaseEngine()} */
		picViewer : undefined,

		/**
		 * @return {jQuery}
		 */
		_getAllPixContainers : function(){
			return this.$block.find('div.gallery-collection-item');
		},

		/**
		 * @return {Array}
		 */
		_getAllPixData : function(){
			var
				res = [];
			this._getAllPixContainers().each(function(){
				var
					/** @type {new BaseBlockHandler()} */
						d = $.data ( this , '_albumPicEngine' );
				if ( d ){
					res.push( d.getData() );
				}
			});

			return res;
		},

		/**
		 * @return {new BaseBlockHandler()}
		 */
		_getPicEngine : function( index ){
			var $item = this._getAllPixContainers().eq( index );
			return $item[0]
				? $.data ( $item[0] , '_albumPicEngine' )
				: undefined;
		},

		afterInitialize : function(){
			var
				$this = this,
				pixData = GridEditor.storage.blockAlbumData || [];

			$.extend(this.settings, {
				addBusyClass 	: 'feed-items-add-item-busy',
				uploadUrl		: '/block/file-set',
				itemIdBaseClass : 'gallery-collection-item-id-'
			});

			this.setState('editable', false);

			this._getAllPixContainers().each(function( num ){
				$this.handleAlbumPicBlock( $(this) , pixData[num] || {} );
			});

			this.$galleryCollection = this.$block.find('div.gallery-collection');
			this.$galleryControlsWrap = $('<div class="feed-items-controls cleared"/>')
				.prependTo(this.$block);
			this.$addItemArea = $('<div class="feed-items-add-item"/>')
				.appendTo(this.$galleryControlsWrap);

			this.$addItemBtn = $( [
				'<span class="feed-items-add-item-btn"><span class="feed-items-add-item-btn-caption">' ,
				_( 'editor:block.album.add_pic' ),
				'</span><span class="feed-items-add-item-btn-r"></span></span>'
			].join('') )
				.appendTo(this.$addItemArea);

			/* Initializing uploading & creating new pic block */
			(function(){
				var
					onComplete = function( response ){
						var blockData;
						if (
							response
								&& ( blockData = parsePlainTextObject( response ) )
								&& blockData
								&& blockData.picture
								&& blockData.picture_big
								&& blockData.id){
							// Response is ok, so now adding new block

							blockData.uri = blockData.picture_big // Making special alias for using in picViewer

							$this.addAlbumPicBlock( blockData );
						}
						else{
							$this.displayErrorMessage();
							window.onerror
							&& window.onerror( [ 'file_add_error' , response ].join(':') )
						}
					};

				if ( FLASH_CHECKING.DetectFlashVer( 9, 0, 24 ) ){
					/* Got needed flash version, so will using multifiles flash plugin */
					var scriptData = (function(){
						var
							res = {},
							_data = $.extend( Editor.getAuthData() , $this.getSaveRequestData() );
						$.each( _data , function( name ){
							res[ encodeURIComponent( name ) ] = encodeURIComponent( encodeURIComponent( _data[name] ) )
						});
						return res;
					})();
					SitePage.loadJs(
						'/s/js/lib/swfobject.js',
						'/s/js/lib/uploadify/jquery.uploadify.js',
						function(){
							$('<div id="upladify-button"/>').appendTo($this.$addItemArea).uploadify({
								uploader	: '/s/js/lib/uploadify/uploadify.swf',
								script		: $this.settings.uploadUrl,
								scriptData	: scriptData,
								hideButton	: true,
								auto		: true,
								width		: $this.$addItemBtn.outerWidth() + 25, // counting .r part
								height		: $this.$addItemBtn.outerHeight(),
								wmode		: 'transparent',
								multi		: true,
								queueID		: 'upload-queue',
								fileExt     : '*.jpg;*.gif;*.png',
								fileDesc    : _( 'editor:allow_file_types_to_upload' ),
								onSelect	: function(){
									$this.$addItemArea.addClass('feed-items-add-item-busy');
								},
								onProgress	: function(){
								},
								onComplete	: function( event, ID, fileObj, response, data ){
									onComplete( response );
								},
								onAllComplete : function(){
									$this.$addItemArea.removeClass('feed-items-add-item-busy');
								},
								onError		: function( event, ID, fileObj, errorObj ){
									$this.displayErrorMessage();
									$this.$addItemArea.removeClass('feed-items-add-item-busy');
									window.onerror
									&& window.onerror( [ 'file_add_error' , errorObj.type, errorObj.info ].join(':') )
								}
							});
							$this.$addItemBtn.find('>span.feed-items-add-item-btn-caption').text(
								_( 'editor:block.album.add_pix' )
							)
						}
					)
				}
				else{
					/* No needed flash plugin, so will using regular single-file ajax uploading */
					new AjaxUpload($this.$addItemBtn, {
						action 		: $this.settings.uploadUrl,
						name 		: 'FileData',
						hoverClass 	: 'feed-items-add-item-btn-hover',
						data		: $this.getSaveRequestData(),
						onSubmit	: function(file, extension){
							if ($.inArray(extension.toString().toLowerCase(), ['jpg', 'jpeg', 'gif', 'png']) < 0){
								Editor.InfoMessage.show({
									html: _( 'editor:block.album.error.wrong_pic_format' ),
									type : 'error',
									time : 10000,
									clear : true
								})
								return false;
							}
							$this.$addItemArea.addClass('feed-items-add-item-busy');
						},
						onComplete 	: function( uploader, response ){
							onComplete( response );
							$this.$addItemArea.removeClass('feed-items-add-item-busy');
						}
					});
				}

			})();

		},

		addAlbumPicBlock : function( picData ){
			var
				$this = this,
				$item = $([
					'<div class="gallery-collection-item ' , $this.settings.itemIdBaseClass , picData.id , '">',
					'<a class="gallery-collection-item-link" href="' , picData.picture_big , '">',
					'<span class="gallery-collection-item-img-wrap">',
					picData.picture
						?  ['<img src="' , picData.picture , '" alt="" class="gallery-collection-item-img" />'].join('')
						: '',
					'</span>',
					'</a>',
					'</div>'
				].join(''))
					.appendTo($this.$galleryCollection);
			this.handleAlbumPicBlock( $item, picData );
		},

		handleAlbumPicBlock : function( $item , picData ){
			var
				$this = this,
				engine;
			$item.addClass('block block-type-albumpic');
			engine = GridEditor.handleBlock($item, {
				settings : {
					id 				: $this.settings.id,
					albumPicId 		: $item.searchInClass('gallery-collection-item-id-'),
					editBtnRequired	: false
				}
			});
			engine.album = this;
			engine.setData( picData || {} );
			$.data( $item[0] , '_albumPicEngine' , engine );
			return engine;
		},

		showFullPicView : function( index ){
			var
				$this = this,
				/** @type {Array} */
					pixData = this._getAllPixData();

			if ( ! pixData.length && this.picViewer ){
				this.picViewer.hide();
				return;
			}
			index = Math.max( 0 , Math.min( index, pixData.length - 1) );

			if ( ! this.picViewer ){
				this.picViewer = PicViewer.Instance({
					engine 			: 'edit',
					offsetTop 		: 15,
					onDelete	 	: function( params ){
						var
							block = $this._getPicEngine( params.index );
						if ( block ){
							block.deleteBlock({
								success : function(){
									$this.showFullPicView( params.index );
								}
							});
						}
					},
					onEditSubmit	: function( params ){
						var
							block = $this._getPicEngine( params.index );
						if ( block && params.data) {
							block.setData( params.data );
							block.save();
						}
					},
					onRotate		: function( params ){
						var
							block = $this._getPicEngine( params.index );
						if ( block && params && params.data) {
							block.picRotate( {
								data : params.data,
								success : function( res ){
									$this.showFullPicView( params.index );
								}
							} );
						}
					}
				});
			}
			this.picViewer.setFullViews( pixData ).show( index );
		},

		saveOrder : function(){
			var
				$this = this,
				ordering = [],
				data = $this.getSaveRequestData();
			this._getAllPixContainers().each(function(){
				var id = $(this).searchInClass( $this.settings.itemIdBaseClass );
				if ( id ){
					ordering.push( id );
				}
			});
			data.data = $.toJSON( { ordering : ordering } );
			$.request ( {
				type	: 'POST',
				url 	: $this.settings.saveOrderUrl,
				data	: data,
				success	: function( res ){

				}
			} );
		}

	});
})( this.GridEditor );
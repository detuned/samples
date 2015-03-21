(function( GridEditor){
	var
		imgPrototype =  {
			/** @type {jQuery} */
			$cropBtn 		: undefined,
			$resetBtn 		: undefined,
			_imagesCatalog 	: 0, //ImageManager.CAT_TEXT

			_getCropWidth 	: function(){
				return GridEditor.getMainimgWidth();
			},
			_getCropHeight	: function(){
				return GridEditor.getMainimgHeight();
			},
			actualizePic : function(){
				this.setState( 'customized' , ! ! ( this.$block[0].style.backgroundImage ) );
			},

			updatePic : function( src , onlyThisBlock ){
				var
					$this = this,
					blocks = [],
					_block;
				if (onlyThisBlock){
					$this.$block[0].setAttribute(
						'style',
						src
							? ['background-image:url(' , trimStr(src) , ') !important'].join('')
							: ''
					);
					$this.$block.removeClass($this.settings.defaultStateClass);
					$this.actualizePic();;
				}
				else{
					// Trying to update another blocks of the same type if they are exists
					blocks = GridEditor.searchBlocks( { type : $this._type } );
					if ( blocks.length ){
						for (var i = 0, l = blocks.length; i < l; i++) {
							blocks[i].updatePic( src, true );
						}
					}
				}
			},

			afterInitialize : function(){
				var $this = this;
				$.extend(this.settings, {
					pictureAspectRatio					: $this._getCropWidth() / $this._getCropHeight()
				});
				;(function(){
					var
						/**
						 * Saves new picture's uri everywhere:
						 * - at server,
						 * - in block data
						 * - and updates in its container
						 */
							savePic = function( params ){
							var
								_params = {
									uri			: undefined,
									needResize 	: false,
									crop		: undefined
								};
							params && $.extend( _params, params );

							function completeSavePic( ){
								var
									reqData = {
										block_id 	: $this.settings.id,
										location 	: Editor.getPageUri(),
										data			: $.toJSON({
											link 		: _params.uri,
											crop		: _params.crop
										})
									};
								$this.showLoader();
								/* Saving new picture at server */
								$.request({
									url 	: '/block/set-picture',
									type 	: 'POST',
									data	: reqData,
									success	: function(reqRes){
										if (reqRes){
											/* Updating picture view in container */
											$this.updatePic( reqRes.picture );

											$this.hideLoader({
												fadeOut : 1000
											});
										}
									}
								});
							}
							if ( _params.needResize ){
								ImageCropper.Instance({
									uri : _params.uri,
									aspectRatio : $this.settings.pictureAspectRatio,
									w : $this._getCropWidth(),
									h : $this._getCropHeight(),
									onsubmit : function(sel){
										_params.crop =  {
											x : sel.x,
											y : sel.y,
											w : sel.w,
											h : sel.h
										};
										completeSavePic();
									}
								})
							}
							else{
								completeSavePic();
							}

						};
					$this.$editBtn.html( _( 'editor:block_button.upload' ) )
						.unbind( 'click' )
						.bind( 'click', function(){
							ImageManagerDialog({
								allowCrop 	: true,
								defaultCat	: $this._imagesCatalog,
								onSelect 	:  savePic
							})
						});
					$this.$cropBtn = $( [
						'<span class="block-crop-btn">' ,
						_( 'editor:block_button.crop' ) ,
						'</span>'
					].join('') )
						.bind( 'click', function(){
							var
								reqData = {
									location 	: Editor.getPageUri(),
									block_id 	: $this.settings.id
								};
							$.request({
								url : '/block/get-crop',
								type : 'GET',
								data : reqData,
								success : function(savedCrop){
									var
										cropData = {
											uri : $this.data.picture,
											aspectRatio : $this.settings.pictureAspectRatio,
											onsubmit : function(/* ImageCropper.Selection() */sel){
												savePic( {
													crop : {
														x : sel.x,
														y : sel.y,
														w : sel.w,
														h : sel.h
													}
												} );
											}
										},
										/** @type {ImageCropper.Instance()} */
											cropper;
									// Need to rename picture to uri because of ImageCropper using this field
									if ( savedCrop && savedCrop.picture_big && savedCrop.picture_big.uri ){
										cropData.uri = savedCrop.picture_big.uri;
									}
									if ( savedCrop && $.isPlainObject( savedCrop.crop ) ){
										$.extend( cropData , savedCrop.crop );
									}
									/* Clearing dirty 'null' values that can overriden default params while extending */
									$.each(cropData, function(name){
										if (!cropData[name]){
											delete cropData[name];
										}
									});
									cropper = ImageCropper.Instance(cropData);
								}
							})

						})
						.appendTo($this.$block);

					$this.$resetBtn = $([
						'<span class="block-delete-btn block-delete-btn-pos-tr3">' ,
						_( 'editor:block_button.reset' ),
						'</span>'
					].join(''))
						.bind( 'click' , function(){
							savePic( { uri : 'none' } );
						})
						.appendTo($this.$block);
				})();
				this.settings.defaultStateClass	= 'block-state-default';
				this.actualizePic();
			},
			onBlockClick : function(){}
		};


	GridEditor.HandlersRegistry.register( {type	: 'logo' }, $.extend( {}, imgPrototype, {
		_getCropWidth : function(){
			return GridEditor.getLogoWidth();
		},
		_getCropHeight : function(){
			return GridEditor.getLogoHeight();
		}
	} ) );

})( this.GridEditor );
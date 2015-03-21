(function( GridEditor ){
	/* Album Pic Block (one of pix on gallery album page) */
	GridEditor.HandlersRegistry.register( {type : 'albumpic' }, {

		/** @type {jQuery} */
		$deleteBtn : undefined,
		/** @type {jQuery} */
		$imgWrap   : undefined,
		/** @type {new BaseBlockHandler()} */
		album      : undefined,

		_getPicIndex : function(){
			return this.$block.prevAll( 'div.block-type-albumpic' ).length;
		},

		afterInitialize : function(){
			var
				$this = this,
				/** @type {jQuery} */
					$dragger;
			$.extend( this.settings, {
			} );

			this.$imgWrap = this.$block.find( '.gallery-collection-item-img-wrap' );
			this.$deleteBtn = $( [
				'<span class="block-delete-btn block-delete-btn-pos-tr">' ,
				_( 'editor:action_delete' ),
				'</span>'
			].join( '' ) )
				.click( function(){
					$this.deleteBlock();
				} )
				.appendTo( this.$block );
			$dragger = $( [
				'<span class="block-dragger" title="' , _( 'editor:block.album.drag_hint' ) , '"></span>'
			].join( '' ) )
				.appendTo( this.$block );

			/* Allowing item drag */
			this.$block.allowDrag( {
				useClone   : true,
				dragger    : 'span.block-dragger',
				onbegin    : function( clone ){
					var
						dragControl = $.data( $this.$block, '_dragControl' );
					$this.$block.addClass( 'projection' );
					$( clone ).addClass( 'banner-edit-item-dragging' );
					if( dragControl ){
						dragControl.setTrackAreas( [
							$this.$block
								.siblings( 'div.block-type-albumpic:visible:not(.projection)' ),
							function( /* jQuery */$area, /* Boolean */state, targetOffset, areaInfo ){
								var
									offset = $this.$block.offset();
								if( state ){
									if( ( areaInfo.offset.top > offset.top )
										|| ( areaInfo.offset.top == offset.top && areaInfo.offset.left > offset.left ) ){
										$area.after( $this.$block );
									}
									else {
										$area.before( $this.$block );
									}
								}
							}
						] );
					}
				},
				oncomplete : function(){
					$this.album.saveOrder();
					$this.$block.removeClass( 'projection' );
				}
			} );
		},


		processSaveRequestData : function( data ){
			var
				$this = this,
				data = {
					body : $this.data.body || ''
				};
			if( this.settings.albumPicId ){
				data.id = this.settings.albumPicId;
			}

			return data;
		},

		onSave : function( res ){
			if( res && res.picture_big && res.picture_big.uri ){
				this.data.uri = res.picture_big.uri;
			}
			if( res && res.picture ){
				this.$imgWrap.html( ['<img src="' , res.picture , '" alt="" class="gallery-collection-item-img" />'].join( '' ) );
			}
		},

		onBlockClick : function( /* Event */e ){
			var
				/** @type {jQuery} */
					$target = $( e.target );
			e.preventDefault();
			e.stopPropagation();
			if( $target.is( '.block-delete-btn' ) ){
				return false;
			}
			this.album.showFullPicView( this._getPicIndex() );
			return false;
		},

		deleteBlock : function( _params ){
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
			if( this.settings.albumPicId ){
				params.data.data.id = this.settings.albumPicId;
			}
			params.data.data.action = 'delete';

			params.data.data = $.toJSON( params.data.data );
			$.request( {
				url     : params.url,
				data    : params.data,
				type    : 'POST',
				success : function( res ){
					$this.$block.hide( 500, function(){
						$( this ).remove();
						Editor.InfoMessage.show( {
							html  : _( 'editor:block.album.pic_was_removed' ),
							time  : true,
							clear : true
						} );
						params.success( res );
					} );
				}
			} );
		},

		picRotate : function( params ){
			var
				$this = this,
				data = this.getSaveRequestData(),
				_params = {
					success : function(){},
					data    : {}
				};
			params && $.extend( _params, params );
			data.data = $.toJSON( $.extend( {
				id : $this.settings.albumPicId
			}, params.data ) );
			$.request( {
				url     : $this.settings.rotateUrl,
				data    : data,
				type    : 'POST',
				success : function( res ){
					$this.onSave( res );
					_params.success( res );
				}
			} );
		}
	} );
})( this.GridEditor );